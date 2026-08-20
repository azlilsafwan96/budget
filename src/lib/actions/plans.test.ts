import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "user_1";

const { prisma, verifySession, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    plan: { create: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn() },
    planItem: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    tag: { upsert: vi.fn() },
  },
  verifySession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/dal", () => ({ verifySession }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { createPlan, deletePlan, addPlanItem, updatePlanItem, toggleItemBought, deletePlanItem } =
  await import("@/lib/actions/plans");

function form(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach((entry) => fd.append(k, entry));
    else fd.set(k, v);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  verifySession.mockResolvedValue({ userId: USER_ID });
  prisma.plan.findFirst.mockResolvedValue({ id: "plan_1", userId: USER_ID });
  prisma.planItem.findFirst.mockResolvedValue({ id: "item_1", bought: false });
  prisma.tag.upsert.mockImplementation(async ({ where }: { where: { userId_name: { name: string } } }) => ({
    id: `tag_${where.userId_name.name}`,
  }));
});

describe("createPlan", () => {
  it("rejects a blank name", async () => {
    const state = await createPlan(undefined, form({ name: "" }));
    expect(state?.errors?.name).toBeDefined();
    expect(prisma.plan.create).not.toHaveBeenCalled();
  });

  it("stores an omitted description as null", async () => {
    await createPlan(undefined, form({ name: "Kitchen reno" }));
    expect(prisma.plan.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, name: "Kitchen reno", description: null },
    });
  });

  it("stores a whitespace-only description as null", async () => {
    await createPlan(undefined, form({ name: "Kitchen reno", description: "   " }));
    expect(prisma.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ description: null }) }),
    );
  });

  it("keeps a real description", async () => {
    await createPlan(undefined, form({ name: "Kitchen reno", description: "Q2 budget" }));
    expect(prisma.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ description: "Q2 budget" }) }),
    );
  });
});

describe("deletePlan", () => {
  it("deletes only plans owned by the session user", async () => {
    prisma.plan.deleteMany.mockResolvedValue({ count: 1 });
    await deletePlan("plan_1");
    expect(prisma.plan.deleteMany).toHaveBeenCalledWith({
      where: { id: "plan_1", userId: USER_ID },
    });
  });
});

describe("addPlanItem", () => {
  const validFields = { planId: "plan_1", name: "Oven", amount: "2500" };

  it("rejects a blank name", async () => {
    const state = await addPlanItem(undefined, form({ ...validFields, name: "" }));
    expect(state?.errors?.name).toBeDefined();
  });

  it("rejects a non-positive amount", async () => {
    const state = await addPlanItem(undefined, form({ ...validFields, amount: "0" }));
    expect(state?.errors?.amount).toBeDefined();
  });

  it("refuses to add to a plan owned by someone else", async () => {
    prisma.plan.findFirst.mockResolvedValue(null);
    const state = await addPlanItem(undefined, form(validFields));
    expect(state?.message).toBe("That plan no longer exists.");
    expect(prisma.planItem.create).not.toHaveBeenCalled();
  });

  it("stores the amount as cents", async () => {
    await addPlanItem(undefined, form({ ...validFields, amount: "2500.75" }));
    expect(prisma.planItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 250075 }) }),
    );
  });

  it("creates an item with no tags when none are supplied", async () => {
    await addPlanItem(undefined, form(validFields));
    expect(prisma.tag.upsert).not.toHaveBeenCalled();
    expect(prisma.planItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tags: { connect: [] } }) }),
    );
  });

  it("lowercases tags and drops duplicates", async () => {
    await addPlanItem(undefined, form({ ...validFields, tags: ["Kitchen", "kitchen", "URGENT"] }));
    expect(prisma.tag.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.planItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: { connect: [{ id: "tag_kitchen" }, { id: "tag_urgent" }] },
        }),
      }),
    );
  });

  it("upserts tags scoped to the session user", async () => {
    await addPlanItem(undefined, form({ ...validFields, tags: ["kitchen"] }));
    expect(prisma.tag.upsert).toHaveBeenCalledWith({
      where: { userId_name: { userId: USER_ID, name: "kitchen" } },
      update: {},
      create: { userId: USER_ID, name: "kitchen" },
    });
  });

  it("rejects an empty tag rather than creating a blank one", async () => {
    const state = await addPlanItem(undefined, form({ ...validFields, tags: ["kitchen", "  "] }));
    expect(state?.errors).toBeDefined();
    expect(prisma.planItem.create).not.toHaveBeenCalled();
  });

  it("treats a checked bought box as true", async () => {
    await addPlanItem(undefined, form({ ...validFields, bought: "on" }));
    expect(prisma.planItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ bought: true }) }),
    );
  });
});

describe("updatePlanItem", () => {
  const validFields = { id: "item_1", planId: "plan_1", name: "Oven", amount: "2500" };

  it("refuses an item that is not reachable from the user's plans", async () => {
    prisma.planItem.findFirst.mockResolvedValue(null);
    const state = await updatePlanItem(undefined, form(validFields));
    expect(state?.message).toBe("That item no longer exists.");
    expect(prisma.planItem.update).not.toHaveBeenCalled();
  });

  it("checks ownership through the parent plan", async () => {
    await updatePlanItem(undefined, form(validFields));
    expect(prisma.planItem.findFirst).toHaveBeenCalledWith({
      where: { id: "item_1", plan: { userId: USER_ID } },
    });
  });

  it("replaces the tag set rather than appending to it", async () => {
    await updatePlanItem(undefined, form({ ...validFields, tags: ["kitchen"] }));
    expect(prisma.planItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tags: { set: [{ id: "tag_kitchen" }] } }),
      }),
    );
  });

  it("clears all tags when none are submitted", async () => {
    await updatePlanItem(undefined, form(validFields));
    expect(prisma.planItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tags: { set: [] } }) }),
    );
  });
});

describe("toggleItemBought", () => {
  it("flips the flag on an owned item", async () => {
    prisma.planItem.findFirst.mockResolvedValue({ id: "item_1", bought: false });
    await toggleItemBought("item_1", "plan_1");
    expect(prisma.planItem.update).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { bought: true },
    });
  });

  it("does nothing for an item the user cannot reach", async () => {
    prisma.planItem.findFirst.mockResolvedValue(null);
    await toggleItemBought("item_1", "plan_1");
    expect(prisma.planItem.update).not.toHaveBeenCalled();
  });
});

describe("deletePlanItem", () => {
  it("deletes an owned item", async () => {
    await deletePlanItem("item_1", "plan_1");
    expect(prisma.planItem.delete).toHaveBeenCalledWith({ where: { id: "item_1" } });
  });

  it("does nothing for an item the user cannot reach", async () => {
    prisma.planItem.findFirst.mockResolvedValue(null);
    await deletePlanItem("item_1", "plan_1");
    expect(prisma.planItem.delete).not.toHaveBeenCalled();
  });
});
