import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "user_1";

const { prisma, verifySession, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    category: { findFirst: vi.fn() },
    transaction: { create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    streakLog: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
  verifySession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/dal", () => ({ verifySession }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { addTransaction, updateTransaction, deleteTransaction } = await import(
  "@/lib/actions/transactions"
);

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = {
  merchant: "Jaya Grocer",
  categoryId: "cat_1",
  amount: "45.50",
  date: "2026-03-14",
};

beforeEach(() => {
  vi.clearAllMocks();
  verifySession.mockResolvedValue({ userId: USER_ID });
  prisma.category.findFirst.mockResolvedValue({ id: "cat_1", userId: USER_ID });
  prisma.$transaction.mockResolvedValue([]);
  prisma.transaction.updateMany.mockResolvedValue({ count: 1 });
});

describe("addTransaction", () => {
  it("rejects a blank merchant", async () => {
    const state = await addTransaction(undefined, form({ ...validFields, merchant: "" }));
    expect(state?.errors?.merchant).toBeDefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a missing category", async () => {
    const state = await addTransaction(undefined, form({ ...validFields, categoryId: "" }));
    expect(state?.errors?.categoryId).toBeDefined();
  });

  it("rejects a zero or negative amount", async () => {
    for (const amount of ["0", "-5"]) {
      const state = await addTransaction(undefined, form({ ...validFields, amount }));
      expect(state?.errors?.amount, `amount=${amount}`).toBeDefined();
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric amount", async () => {
    const state = await addTransaction(undefined, form({ ...validFields, amount: "abc" }));
    expect(state?.errors?.amount).toBeDefined();
  });

  it("rejects a missing date", async () => {
    const state = await addTransaction(undefined, form({ ...validFields, date: "" }));
    expect(state?.errors?.date).toBeDefined();
  });

  it("refuses a category owned by someone else", async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    const state = await addTransaction(undefined, form(validFields));
    expect(state?.message).toBe("That category no longer exists.");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("scopes the category lookup to the session user", async () => {
    await addTransaction(undefined, form(validFields));
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: "cat_1", userId: USER_ID },
    });
  });

  it("stores the amount as integer cents", async () => {
    await addTransaction(undefined, form({ ...validFields, amount: "45.50" }));
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 4550 }) }),
    );
  });

  it("rounds fractional sen rather than truncating", async () => {
    await addTransaction(undefined, form({ ...validFields, amount: "19.999" }));
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 2000 }) }),
    );
  });

  it("trims whitespace from the merchant", async () => {
    await addTransaction(undefined, form({ ...validFields, merchant: "  Jaya Grocer  " }));
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ merchant: "Jaya Grocer" }) }),
    );
  });

  it("writes the transaction and the streak log atomically", async () => {
    await addTransaction(undefined, form(validFields));
    expect(prisma.transaction.create).toHaveBeenCalled();
    expect(prisma.streakLog.upsert).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
  });

  it("stamps the streak log with midnight today, not the transaction date", async () => {
    vi.setSystemTime(new Date(2026, 2, 20, 13, 45));
    await addTransaction(undefined, form({ ...validFields, date: "2026-01-02" }));
    expect(prisma.streakLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_date: { userId: USER_ID, date: new Date(2026, 2, 20) } },
      }),
    );
  });

  it("revalidates the dashboard on success", async () => {
    await addTransaction(undefined, form(validFields));
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("updateTransaction", () => {
  const updateFields = { ...validFields, id: "txn_1" };

  it("validates before touching the database", async () => {
    const state = await updateTransaction(undefined, form({ ...updateFields, merchant: "" }));
    expect(state?.errors?.merchant).toBeDefined();
    expect(prisma.transaction.updateMany).not.toHaveBeenCalled();
  });

  it("scopes the update to the session user", async () => {
    await updateTransaction(undefined, form(updateFields));
    expect(prisma.transaction.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "txn_1", userId: USER_ID } }),
    );
  });

  it("reports when the row matched nothing (deleted or not owned)", async () => {
    prisma.transaction.updateMany.mockResolvedValue({ count: 0 });
    const state = await updateTransaction(undefined, form(updateFields));
    expect(state?.message).toBe("That transaction no longer exists.");
  });

  it("refuses to move a transaction into another user's category", async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    const state = await updateTransaction(undefined, form(updateFields));
    expect(state?.message).toBe("That category no longer exists.");
    expect(prisma.transaction.updateMany).not.toHaveBeenCalled();
  });
});

describe("deleteTransaction", () => {
  it("deletes only rows owned by the session user", async () => {
    prisma.transaction.deleteMany.mockResolvedValue({ count: 1 });
    await deleteTransaction("txn_1");
    expect(prisma.transaction.deleteMany).toHaveBeenCalledWith({
      where: { id: "txn_1", userId: USER_ID },
    });
  });

  it("requires a session", async () => {
    verifySession.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(deleteTransaction("txn_1")).rejects.toThrow();
    expect(prisma.transaction.deleteMany).not.toHaveBeenCalled();
  });
});
