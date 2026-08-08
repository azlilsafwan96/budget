"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const TransactionSchema = z.object({
  merchant: z.string().min(1, { error: "Merchant is required." }).trim(),
  categoryId: z.string().min(1, { error: "Choose a category." }),
  amount: z.coerce.number().positive({ error: "Amount must be greater than 0." }),
  date: z.string().min(1, { error: "Date is required." }),
});

export type TransactionFormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

export async function addTransaction(
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const { userId } = await verifySession();

  const validated = TransactionSchema.safeParse({
    merchant: formData.get("merchant"),
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const category = await prisma.category.findFirst({
    where: { id: validated.data.categoryId, userId },
  });
  if (!category) {
    return { message: "That category no longer exists." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId,
        categoryId: category.id,
        merchant: validated.data.merchant,
        amount: Math.round(validated.data.amount * 100),
        date: new Date(validated.data.date),
      },
    }),
    prisma.streakLog.upsert({
      where: { userId_date: { userId, date: today } },
      update: {},
      create: { userId, date: today },
    }),
  ]);

  revalidatePath("/dashboard");
}

export async function deleteTransaction(transactionId: string) {
  const { userId } = await verifySession();
  await prisma.transaction.deleteMany({ where: { id: transactionId, userId } });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
