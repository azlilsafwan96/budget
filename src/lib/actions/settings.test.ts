import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "user_1";

const { prisma, verifySession, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: { update: vi.fn() },
  },
  verifySession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/dal", () => ({ verifySession }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { addCategory, updateCategory, deleteCategory, updatePreferences } = await import(
  "@/lib/actions/settings"
);

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  verifySession.mockResolvedValue({ userId: USER_ID });
  prisma.category.findUnique.mockResolvedValue(null);
  prisma.category.updateMany.mockResolvedValue({ count: 1 });
});

describe("addCategory", () => {
  const validFields = { name: "Groceries", monthlyLimit: "800" };

  it("rejects a blank name", async () => {
    const state = await addCategory(undefined, form({ ...validFields, name: "" }));
    expect(state?.errors?.name).toBeDefined();
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive limit", async () => {
    const state = await addCategory(undefined, form({ ...validFields, monthlyLimit: "0" }));
    expect(state?.errors?.monthlyLimit).toBeDefined();
  });

  it("stores the limit as cents", async () => {
    await addCategory(undefined, form({ ...validFields, monthlyLimit: "800.50" }));
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, name: "Groceries", monthlyLimit: 80050 },
    });
  });

  it("rejects a duplicate name for the same user", async () => {
    prisma.category.findUnique.mockResolvedValue({ id: "cat_1", name: "Groceries" });
    const state = await addCategory(undefined, form(validFields));
    expect(state?.message).toBe("You already have a category with that name.");
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it("checks uniqueness per user, not globally", async () => {
    await addCategory(undefined, form(validFields));
    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: { userId_name: { userId: USER_ID, name: "Groceries" } },
    });
  });

  it("trims the name before the uniqueness check", async () => {
    await addCategory(undefined, form({ ...validFields, name: "  Groceries  " }));
    expect(prisma.category.findUnique).toHaveBeenCalledWith({
      where: { userId_name: { userId: USER_ID, name: "Groceries" } },
    });
  });
});

describe("updateCategory", () => {
  const validFields = { id: "cat_1", name: "Groceries", monthlyLimit: "800" };

  it("allows a category to keep its own name", async () => {
    prisma.category.findUnique.mockResolvedValue({ id: "cat_1", name: "Groceries" });
    const state = await updateCategory(undefined, form(validFields));
    expect(state).toBeUndefined();
    expect(prisma.category.updateMany).toHaveBeenCalled();
  });

  it("rejects renaming onto a different existing category", async () => {
    prisma.category.findUnique.mockResolvedValue({ id: "cat_2", name: "Groceries" });
    const state = await updateCategory(undefined, form(validFields));
    expect(state?.message).toBe("You already have a category with that name.");
    expect(prisma.category.updateMany).not.toHaveBeenCalled();
  });

  it("scopes the update to the session user", async () => {
    await updateCategory(undefined, form(validFields));
    expect(prisma.category.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cat_1", userId: USER_ID } }),
    );
  });

  it("reports when nothing matched", async () => {
    prisma.category.updateMany.mockResolvedValue({ count: 0 });
    const state = await updateCategory(undefined, form(validFields));
    expect(state?.message).toBe("That category no longer exists.");
  });
});

describe("deleteCategory", () => {
  it("deletes only rows owned by the session user", async () => {
    prisma.category.deleteMany.mockResolvedValue({ count: 1 });
    await deleteCategory("cat_1");
    expect(prisma.category.deleteMany).toHaveBeenCalledWith({
      where: { id: "cat_1", userId: USER_ID },
    });
  });
});

describe("updatePreferences", () => {
  const validFields = { accentColor: "#4ade80", showGamification: "on", cycleStartDay: "1" };

  it("saves a valid set of preferences", async () => {
    await updatePreferences(form(validFields));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { accentColor: "#4ade80", showGamification: true, cycleStartDay: 1 },
    });
  });

  it("treats an absent gamification checkbox as off", async () => {
    const fields = { ...validFields };
    delete (fields as Partial<typeof fields>).showGamification;
    await updatePreferences(form(fields));
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ showGamification: false }) }),
    );
  });

  it("rejects a colour that is not a 6-digit hex", async () => {
    for (const accentColor of ["4ade80", "#fff", "red", "#12345g"]) {
      await updatePreferences(form({ ...validFields, accentColor }));
    }
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("accepts uppercase hex", async () => {
    await updatePreferences(form({ ...validFields, accentColor: "#4ADE80" }));
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("rejects a cycle start day outside 1-31", async () => {
    for (const cycleStartDay of ["0", "32"]) {
      await updatePreferences(form({ ...validFields, cycleStartDay }));
    }
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("silently ignores invalid input rather than throwing", async () => {
    await expect(updatePreferences(form({ ...validFields, accentColor: "nope" }))).resolves.toBeUndefined();
  });
});
