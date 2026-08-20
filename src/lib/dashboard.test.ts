import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "user_1";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    category: { findMany: vi.fn() },
    transaction: { findMany: vi.fn() },
    bill: { findMany: vi.fn() },
    savingsGoal: { findFirst: vi.fn() },
    streakLog: { findMany: vi.fn() },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma }));

const { getDashboardData } = await import("@/lib/dashboard");

/** Midnight, `n` days before the frozen "now". */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(new Date(2026, 2, 15, 10, 0));
  prisma.category.findMany.mockResolvedValue([]);
  prisma.transaction.findMany.mockResolvedValue([]);
  prisma.bill.findMany.mockResolvedValue([]);
  prisma.savingsGoal.findFirst.mockResolvedValue(null);
  prisma.streakLog.findMany.mockResolvedValue([]);
});

describe("getDashboardData — category budgets", () => {
  it("labels a category under 90% as on track", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 100_00, transactions: [{ amount: 50_00 }] },
    ]);
    const { categories } = await getDashboardData(USER_ID, 1);
    expect(categories[0]).toMatchObject({
      name: "Food",
      spentLabel: "RM 50",
      limitLabel: "RM 100",
      barPct: 50,
      statusLabel: "On track",
    });
  });

  it("labels a category at 90% as near limit", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 100_00, transactions: [{ amount: 90_00 }] },
    ]);
    const { categories } = await getDashboardData(USER_ID, 1);
    expect(categories[0].statusLabel).toBe("Near limit");
  });

  it("treats spending exactly at the limit as near, not over", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 100_00, transactions: [{ amount: 100_00 }] },
    ]);
    const { categories } = await getDashboardData(USER_ID, 1);
    expect(categories[0].statusLabel).toBe("Near limit");
  });

  it("labels a category over the limit as over budget", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 100_00, transactions: [{ amount: 100_01 }] },
    ]);
    const { categories } = await getDashboardData(USER_ID, 1);
    expect(categories[0].statusLabel).toBe("Over budget");
  });

  it("caps the progress bar at 100% even when far over budget", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 100_00, transactions: [{ amount: 500_00 }] },
    ]);
    const { categories } = await getDashboardData(USER_ID, 1);
    expect(categories[0].barPct).toBe(100);
  });

  it("does not divide by zero for a category with no limit", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 0, transactions: [{ amount: 10_00 }] },
    ]);
    const { categories } = await getDashboardData(USER_ID, 1);
    expect(categories[0].barPct).toBe(0);
    expect(Number.isNaN(categories[0].barPct)).toBe(false);
  });

  it("sums multiple transactions in a category", async () => {
    prisma.category.findMany.mockResolvedValue([
      {
        id: "c1",
        name: "Food",
        monthlyLimit: 100_00,
        transactions: [{ amount: 20_00 }, { amount: 30_00 }],
      },
    ]);
    const { categories } = await getDashboardData(USER_ID, 1);
    expect(categories[0].spentLabel).toBe("RM 50");
  });
});

describe("getDashboardData — totals", () => {
  it("computes remaining budget and spent percentage", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 800_00, transactions: [] },
      { id: "c2", name: "Fuel", monthlyLimit: 200_00, transactions: [] },
    ]);
    prisma.transaction.findMany.mockResolvedValueOnce([{ amount: 250_00 }]).mockResolvedValue([]);

    const data = await getDashboardData(USER_ID, 1);
    expect(data.totalBudget).toBe("RM 1,000");
    expect(data.totalSpent).toBe("RM 250");
    expect(data.remaining).toBe("RM 750");
    expect(data.spentPct).toBe(25);
  });

  it("reports a negative remaining balance when overspent", async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: "c1", name: "Food", monthlyLimit: 100_00, transactions: [] },
    ]);
    prisma.transaction.findMany.mockResolvedValueOnce([{ amount: 150_00 }]).mockResolvedValue([]);

    const data = await getDashboardData(USER_ID, 1);
    expect(data.remaining).toBe("RM -50");
    expect(data.spentPct).toBe(150);
  });

  it("does not divide by zero when no budget is set", async () => {
    prisma.transaction.findMany.mockResolvedValueOnce([{ amount: 10_00 }]).mockResolvedValue([]);
    const data = await getDashboardData(USER_ID, 1);
    expect(data.spentPct).toBe(0);
  });

  it("totals all bills regardless of paid status", async () => {
    prisma.bill.findMany.mockResolvedValue([
      { id: "b1", name: "Internet", amount: 129_00, dueDay: 15, autopay: true, paidAt: new Date() },
      { id: "b2", name: "Phone", amount: 71_00, dueDay: 20, autopay: false, paidAt: null },
    ]);
    const data = await getDashboardData(USER_ID, 1);
    expect(data.totalBills).toBe("RM 200");
  });
});

describe("getDashboardData — bills", () => {
  it("marks a bill paid inside the current cycle as Paid", async () => {
    prisma.bill.findMany.mockResolvedValue([
      { id: "b1", name: "Internet", amount: 129_00, dueDay: 15, autopay: true, paidAt: new Date(2026, 2, 3) },
    ]);
    const { bills } = await getDashboardData(USER_ID, 1);
    expect(bills[0].statusLabel).toBe("Paid");
  });

  it("does not carry a previous cycle's payment forward", async () => {
    prisma.bill.findMany.mockResolvedValue([
      { id: "b1", name: "Internet", amount: 129_00, dueDay: 15, autopay: true, paidAt: new Date(2026, 1, 3) },
    ]);
    const { bills } = await getDashboardData(USER_ID, 1);
    expect(bills[0].statusLabel).toBe("Autopay");
  });

  it("labels an unpaid manual bill as Manual", async () => {
    prisma.bill.findMany.mockResolvedValue([
      { id: "b1", name: "Phone", amount: 71_00, dueDay: 20, autopay: false, paidAt: null },
    ]);
    const { bills } = await getDashboardData(USER_ID, 1);
    expect(bills[0]).toMatchObject({ statusLabel: "Manual", due: "Day 20", amountLabel: "RM 71" });
  });
});

describe("getDashboardData — transactions", () => {
  it("falls back to 'Uncategorized' for a transaction with no category", async () => {
    prisma.transaction.findMany.mockResolvedValueOnce([]).mockResolvedValue([
      { id: "t1", merchant: "Shell", category: null, date: new Date(2026, 2, 4), amount: 60_00 },
    ]);
    const { transactions } = await getDashboardData(USER_ID, 1);
    expect(transactions[0].category).toBe("Uncategorized");
  });

  it("uses the linked category name when present", async () => {
    prisma.transaction.findMany.mockResolvedValueOnce([]).mockResolvedValue([
      { id: "t1", merchant: "Shell", category: { name: "Fuel" }, date: new Date(2026, 2, 4), amount: 60_00 },
    ]);
    const { transactions } = await getDashboardData(USER_ID, 1);
    expect(transactions[0]).toMatchObject({ category: "Fuel", amountLabel: "RM 60" });
  });
});

describe("getDashboardData — savings goal", () => {
  it("returns placeholders when no goal is set", async () => {
    const data = await getDashboardData(USER_ID, 1);
    expect(data).toMatchObject({
      savingsGoalName: "No goal set",
      savingsCurrent: "RM 0",
      savingsTarget: "RM 0",
      savingsPct: 0,
    });
  });

  it("computes progress toward the goal", async () => {
    prisma.savingsGoal.findFirst.mockResolvedValue({
      name: "Umrah", currentAmount: 2_500_00, targetAmount: 10_000_00,
    });
    const data = await getDashboardData(USER_ID, 1);
    expect(data.savingsPct).toBe(25);
  });

  it("does not divide by zero for a goal with no target", async () => {
    prisma.savingsGoal.findFirst.mockResolvedValue({
      name: "Umrah", currentAmount: 100_00, targetAmount: 0,
    });
    const data = await getDashboardData(USER_ID, 1);
    expect(data.savingsPct).toBe(0);
  });
});

describe("getDashboardData — streak", () => {
  it("returns a 7-day window ending today", async () => {
    const { streakDays } = await getDashboardData(USER_ID, 1);
    expect(streakDays).toHaveLength(7);
    expect(streakDays.every((d) => d.active === false)).toBe(true);
  });

  it("marks the days that have a streak log", async () => {
    prisma.streakLog.findMany.mockResolvedValue([{ date: daysAgo(1) }, { date: daysAgo(0) }]);
    const { streakDays } = await getDashboardData(USER_ID, 1);
    expect(streakDays.map((d) => d.active)).toEqual([false, false, false, false, false, true, true]);
  });

  it("counts a streak running back from today", async () => {
    prisma.streakLog.findMany.mockResolvedValue([
      { date: daysAgo(2) }, { date: daysAgo(1) }, { date: daysAgo(0) },
    ]);
    const { streakCount } = await getDashboardData(USER_ID, 1);
    expect(streakCount).toBe(3);
  });

  it("counts zero when today is missing, even if yesterday logged", async () => {
    prisma.streakLog.findMany.mockResolvedValue([{ date: daysAgo(1) }]);
    const { streakCount } = await getDashboardData(USER_ID, 1);
    expect(streakCount).toBe(0);
  });

  it("stops counting at the first gap", async () => {
    prisma.streakLog.findMany.mockResolvedValue([
      { date: daysAgo(4) }, { date: daysAgo(1) }, { date: daysAgo(0) },
    ]);
    const { streakCount } = await getDashboardData(USER_ID, 1);
    expect(streakCount).toBe(2);
  });
});

describe("getDashboardData — cycle scoping", () => {
  it("queries transactions within the current cycle window", async () => {
    await getDashboardData(USER_ID, 1);
    const call = prisma.transaction.findMany.mock.calls[0][0];
    expect(call.where.date).toEqual({ gte: new Date(2026, 2, 1), lt: new Date(2026, 3, 1) });
  });

  it("honours a custom cycle start day", async () => {
    await getDashboardData(USER_ID, 25);
    const call = prisma.transaction.findMany.mock.calls[0][0];
    expect(call.where.date).toEqual({ gte: new Date(2026, 1, 25), lt: new Date(2026, 2, 25) });
  });

  it("scopes every query to the session user", async () => {
    await getDashboardData(USER_ID, 1);
    const queries = [
      prisma.category.findMany,
      prisma.transaction.findMany,
      prisma.bill.findMany,
      prisma.savingsGoal.findFirst,
      prisma.streakLog.findMany,
    ];
    for (const query of queries) {
      expect(query.mock.calls[0][0].where.userId).toBe(USER_ID);
    }
  });
});
