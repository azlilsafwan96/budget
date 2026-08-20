import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "user_1";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    transaction: { aggregate: vi.fn(), findMany: vi.fn() },
    category: { findMany: vi.fn() },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma }));

const { getHistoryData } = await import("@/lib/history");

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(new Date(2026, 2, 15, 10, 0));
  prisma.transaction.aggregate.mockResolvedValue({ _min: { date: new Date(2026, 0, 10) } });
  prisma.transaction.findMany.mockResolvedValue([]);
  prisma.category.findMany.mockResolvedValue([]);
});

describe("getHistoryData", () => {
  it("returns no cycles for a user with no transactions", async () => {
    prisma.transaction.aggregate.mockResolvedValue({ _min: { date: null } });
    const { cycles } = await getHistoryData(USER_ID, 1);
    expect(cycles).toEqual([]);
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
  });

  it("returns one cycle per month back to the first transaction", async () => {
    const { cycles } = await getHistoryData(USER_ID, 1);
    expect(cycles.map((c) => c.label)).toEqual(["January 2026", "February 2026", "March 2026"]);
  });

  it("buckets each transaction into the cycle that contains it", async () => {
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 100_00, date: new Date(2026, 0, 15), categoryId: null },
      { amount: 250_00, date: new Date(2026, 2, 2), categoryId: null },
    ]);
    const { cycles } = await getHistoryData(USER_ID, 1);
    expect(cycles.map((c) => c.totalSpentLabel)).toEqual(["RM 100", "RM 0", "RM 250"]);
  });

  it("splits spend per category and reports leftovers as uncategorized", async () => {
    prisma.category.findMany.mockResolvedValue([{ id: "c1", name: "Food", monthlyLimit: 500_00 }]);
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 100_00, date: new Date(2026, 2, 2), categoryId: "c1" },
      { amount: 40_00, date: new Date(2026, 2, 3), categoryId: null },
    ]);
    const march = (await getHistoryData(USER_ID, 1)).cycles.at(-1)!;
    expect(march.categories[0]).toMatchObject({ name: "Food", spentLabel: "RM 100" });
    expect(march.uncategorizedLabel).toBe("RM 40");
  });

  it("omits the uncategorized label when everything is categorized", async () => {
    prisma.category.findMany.mockResolvedValue([{ id: "c1", name: "Food", monthlyLimit: 500_00 }]);
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 100_00, date: new Date(2026, 2, 2), categoryId: "c1" },
    ]);
    const march = (await getHistoryData(USER_ID, 1)).cycles.at(-1)!;
    expect(march.uncategorizedLabel).toBeNull();
  });

  it("flags a cycle that exceeded the total budget", async () => {
    prisma.category.findMany.mockResolvedValue([{ id: "c1", name: "Food", monthlyLimit: 100_00 }]);
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 150_00, date: new Date(2026, 2, 2), categoryId: "c1" },
    ]);
    const march = (await getHistoryData(USER_ID, 1)).cycles.at(-1)!;
    expect(march.isOverBudget).toBe(true);
  });

  it("never flags over-budget when no budget is configured", async () => {
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 150_00, date: new Date(2026, 2, 2), categoryId: null },
    ]);
    const { cycles } = await getHistoryData(USER_ID, 1);
    expect(cycles.every((c) => c.isOverBudget === false)).toBe(true);
  });

  it("scales bars against the heaviest cycle", async () => {
    prisma.transaction.findMany.mockResolvedValue([
      { amount: 100_00, date: new Date(2026, 0, 15), categoryId: null },
      { amount: 200_00, date: new Date(2026, 2, 2), categoryId: null },
    ]);
    const { cycles } = await getHistoryData(USER_ID, 1);
    expect(cycles.map((c) => c.barPct)).toEqual([50, 4, 100]);
  });

  it("gives an empty cycle a visible minimum bar", async () => {
    const { cycles } = await getHistoryData(USER_ID, 1);
    expect(cycles.every((c) => c.barPct === 4)).toBe(true);
  });

  it("fetches only transactions from the oldest rendered cycle onward", async () => {
    await getHistoryData(USER_ID, 1);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, date: { gte: new Date(2026, 0, 1) } },
      }),
    );
  });

  it("honours a custom cycle start day in its labels", async () => {
    prisma.transaction.aggregate.mockResolvedValue({ _min: { date: new Date(2026, 1, 26) } });
    const { cycles } = await getHistoryData(USER_ID, 25);
    expect(cycles.map((c) => c.label)).toEqual(["25 Feb – 24 Mar, 2026"]);
  });
});
