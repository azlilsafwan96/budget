import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "user_1";

const { prisma, verifySession, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    bill: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    user: { findUniqueOrThrow: vi.fn() },
  },
  verifySession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/dal", () => ({ verifySession }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { addBill, updateBill, toggleBillPaid, deleteBill } = await import("@/lib/actions/bills");

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = { name: "Internet", amount: "129", dueDay: "15" };

beforeEach(() => {
  vi.clearAllMocks();
  verifySession.mockResolvedValue({ userId: USER_ID });
  prisma.bill.updateMany.mockResolvedValue({ count: 1 });
  prisma.user.findUniqueOrThrow.mockResolvedValue({ cycleStartDay: 1 });
});

describe("addBill", () => {
  it("rejects a blank name", async () => {
    const state = await addBill(undefined, form({ ...validFields, name: "" }));
    expect(state?.errors?.name).toBeDefined();
    expect(prisma.bill.create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive amount", async () => {
    const state = await addBill(undefined, form({ ...validFields, amount: "0" }));
    expect(state?.errors?.amount).toBeDefined();
  });

  it("rejects a due day outside 1-31", async () => {
    for (const dueDay of ["0", "32"]) {
      const state = await addBill(undefined, form({ ...validFields, dueDay }));
      expect(state?.errors?.dueDay, `dueDay=${dueDay}`).toBeDefined();
    }
  });

  it("rejects a fractional due day", async () => {
    const state = await addBill(undefined, form({ ...validFields, dueDay: "15.5" }));
    expect(state?.errors?.dueDay).toBeDefined();
  });

  it("accepts the boundary due days", async () => {
    for (const dueDay of ["1", "31"]) {
      const state = await addBill(undefined, form({ ...validFields, dueDay }));
      expect(state, `dueDay=${dueDay}`).toBeUndefined();
    }
  });

  it("stores the amount as cents and attributes it to the session user", async () => {
    await addBill(undefined, form({ ...validFields, amount: "129.90" }));
    expect(prisma.bill.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, name: "Internet", amount: 12990, dueDay: 15, autopay: false },
    });
  });

  it("treats a checked autopay box as true", async () => {
    await addBill(undefined, form({ ...validFields, autopay: "on" }));
    expect(prisma.bill.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ autopay: true }) }),
    );
  });

  it("treats an absent autopay field as false", async () => {
    await addBill(undefined, form(validFields));
    expect(prisma.bill.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ autopay: false }) }),
    );
  });
});

describe("updateBill", () => {
  const updateFields = { ...validFields, id: "bill_1" };

  it("scopes the update to the session user", async () => {
    await updateBill(undefined, form(updateFields));
    expect(prisma.bill.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "bill_1", userId: USER_ID } }),
    );
  });

  it("reports when nothing matched", async () => {
    prisma.bill.updateMany.mockResolvedValue({ count: 0 });
    const state = await updateBill(undefined, form(updateFields));
    expect(state?.message).toBe("That bill no longer exists.");
  });
});

describe("toggleBillPaid", () => {
  it("does nothing for a bill the user does not own", async () => {
    prisma.bill.findFirst.mockResolvedValue(null);
    await toggleBillPaid("bill_1");
    expect(prisma.bill.update).not.toHaveBeenCalled();
  });

  it("marks an unpaid bill as paid now", async () => {
    vi.setSystemTime(new Date(2026, 2, 20, 9, 0));
    prisma.bill.findFirst.mockResolvedValue({ id: "bill_1", paidAt: null });
    await toggleBillPaid("bill_1");
    expect(prisma.bill.update).toHaveBeenCalledWith({
      where: { id: "bill_1" },
      data: { paidAt: new Date(2026, 2, 20, 9, 0) },
    });
  });

  it("un-pays a bill already paid inside the current cycle", async () => {
    vi.setSystemTime(new Date(2026, 2, 20));
    prisma.bill.findFirst.mockResolvedValue({ id: "bill_1", paidAt: new Date(2026, 2, 5) });
    await toggleBillPaid("bill_1");
    expect(prisma.bill.update).toHaveBeenCalledWith({
      where: { id: "bill_1" },
      data: { paidAt: null },
    });
  });

  it("re-pays a bill whose last payment was in a previous cycle", async () => {
    // A bill paid last month is due again — toggling must set a fresh date,
    // not clear the stale one.
    vi.setSystemTime(new Date(2026, 2, 20));
    prisma.bill.findFirst.mockResolvedValue({ id: "bill_1", paidAt: new Date(2026, 1, 5) });
    await toggleBillPaid("bill_1");
    expect(prisma.bill.update).toHaveBeenCalledWith({
      where: { id: "bill_1" },
      data: { paidAt: new Date(2026, 2, 20) },
    });
  });

  it("honours a custom cycle start day when deciding 'this cycle'", async () => {
    // Cycle starts on the 25th, so on Mar 20 the current cycle began Feb 25.
    // A payment on Mar 1 is inside it; a payment on Feb 20 is not.
    vi.setSystemTime(new Date(2026, 2, 20));
    prisma.user.findUniqueOrThrow.mockResolvedValue({ cycleStartDay: 25 });

    prisma.bill.findFirst.mockResolvedValue({ id: "bill_1", paidAt: new Date(2026, 2, 1) });
    await toggleBillPaid("bill_1");
    expect(prisma.bill.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { paidAt: null } }),
    );

    prisma.bill.findFirst.mockResolvedValue({ id: "bill_1", paidAt: new Date(2026, 1, 20) });
    await toggleBillPaid("bill_1");
    expect(prisma.bill.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { paidAt: new Date(2026, 2, 20) } }),
    );
  });
});

describe("deleteBill", () => {
  it("deletes only rows owned by the session user", async () => {
    prisma.bill.deleteMany.mockResolvedValue({ count: 1 });
    await deleteBill("bill_1");
    expect(prisma.bill.deleteMany).toHaveBeenCalledWith({
      where: { id: "bill_1", userId: USER_ID },
    });
  });
});
