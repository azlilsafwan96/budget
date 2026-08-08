"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const PlanSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
});

export type PlanFormState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createPlan(
  _state: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const { userId } = await verifySession();

  const validated = PlanSchema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.plan.create({ data: { userId, name: validated.data.name } });

  revalidatePath("/plans");
}

export async function deletePlan(planId: string) {
  const { userId } = await verifySession();
  await prisma.plan.deleteMany({ where: { id: planId, userId } });
  revalidatePath("/plans");
}

const PlanItemSchema = z.object({
  planId: z.string().min(1),
  name: z.string().min(1, { error: "Name is required." }).trim(),
  amount: z.coerce.number().positive({ error: "Amount must be greater than 0." }),
  bought: z.union([z.literal("on"), z.undefined()]).optional(),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
});

export type PlanItemFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function addPlanItem(
  _state: PlanItemFormState,
  formData: FormData,
): Promise<PlanItemFormState> {
  const { userId } = await verifySession();

  const validated = PlanItemSchema.safeParse({
    planId: formData.get("planId"),
    name: formData.get("name"),
    amount: formData.get("amount"),
    bought: formData.get("bought") ?? undefined,
    tags: formData.getAll("tags"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const plan = await prisma.plan.findFirst({
    where: { id: validated.data.planId, userId },
  });
  if (!plan) {
    return { message: "That plan no longer exists." };
  }

  const tagNames = [...new Set(validated.data.tags.map((t) => t.toLowerCase()))];
  const tagIds = await Promise.all(
    tagNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name },
      });
      return tag.id;
    }),
  );

  await prisma.planItem.create({
    data: {
      planId: plan.id,
      name: validated.data.name,
      amount: Math.round(validated.data.amount * 100),
      bought: validated.data.bought === "on",
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
  });

  revalidatePath(`/plans/${plan.id}`);
  revalidatePath("/plans");
}

async function findOwnedPlanItem(itemId: string, userId: string) {
  return prisma.planItem.findFirst({
    where: { id: itemId, plan: { userId } },
  });
}

export async function toggleItemBought(itemId: string, planId: string) {
  const { userId } = await verifySession();
  const item = await findOwnedPlanItem(itemId, userId);
  if (!item) return;

  await prisma.planItem.update({ where: { id: itemId }, data: { bought: !item.bought } });
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/plans");
}

export async function deletePlanItem(itemId: string, planId: string) {
  const { userId } = await verifySession();
  const item = await findOwnedPlanItem(itemId, userId);
  if (!item) return;

  await prisma.planItem.delete({ where: { id: itemId } });
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/plans");
}
