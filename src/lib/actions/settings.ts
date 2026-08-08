"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const CategorySchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  monthlyLimit: z.coerce.number().positive({ error: "Limit must be greater than 0." }),
});

export type CategoryFormState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function addCategory(
  _state: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { userId } = await verifySession();

  const validated = CategorySchema.safeParse({
    name: formData.get("name"),
    monthlyLimit: formData.get("monthlyLimit"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId, name: validated.data.name } },
  });
  if (existing) {
    return { message: "You already have a category with that name." };
  }

  await prisma.category.create({
    data: {
      userId,
      name: validated.data.name,
      monthlyLimit: Math.round(validated.data.monthlyLimit * 100),
    },
  });

  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
}

const UpdateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { error: "Name is required." }).trim(),
  monthlyLimit: z.coerce.number().positive({ error: "Limit must be greater than 0." }),
});

export async function updateCategory(
  _state: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { userId } = await verifySession();

  const validated = UpdateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    monthlyLimit: formData.get("monthlyLimit"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId, name: validated.data.name } },
  });
  if (existing && existing.id !== validated.data.id) {
    return { message: "You already have a category with that name." };
  }

  const result = await prisma.category.updateMany({
    where: { id: validated.data.id, userId },
    data: {
      name: validated.data.name,
      monthlyLimit: Math.round(validated.data.monthlyLimit * 100),
    },
  });
  if (result.count === 0) {
    return { message: "That category no longer exists." };
  }

  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
}

export async function deleteCategory(categoryId: string): Promise<{ error?: string }> {
  const { userId } = await verifySession();

  // Transaction.categoryId is ON DELETE SET NULL, so existing transactions
  // survive as "Uncategorized" instead of blocking the delete.
  await prisma.category.deleteMany({ where: { id: categoryId, userId } });
  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
  return {};
}

const PreferencesSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Invalid color." }),
  showGamification: z.union([z.literal("on"), z.undefined()]).optional(),
  cycleStartDay: z.coerce.number().int().min(1).max(31, { error: "Cycle start day must be 1-31." }),
});

export async function updatePreferences(formData: FormData) {
  const { userId } = await verifySession();

  const validated = PreferencesSchema.safeParse({
    accentColor: formData.get("accentColor"),
    showGamification: formData.get("showGamification") ?? undefined,
    cycleStartDay: formData.get("cycleStartDay"),
  });

  if (!validated.success) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      accentColor: validated.data.accentColor,
      showGamification: validated.data.showGamification === "on",
      cycleStartDay: validated.data.cycleStartDay,
    },
  });

  revalidatePath("/settings/categories");
  revalidatePath("/dashboard");
}
