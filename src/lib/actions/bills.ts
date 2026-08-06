"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const BillSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  amount: z.coerce.number().positive({ error: "Amount must be greater than 0." }),
  dueDay: z.coerce.number().int().min(1).max(31, { error: "Due day must be 1-31." }),
  autopay: z.union([z.literal("on"), z.undefined()]).optional(),
});

export type BillFormState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function addBill(_state: BillFormState, formData: FormData): Promise<BillFormState> {
  const { userId } = await verifySession();

  const validated = BillSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dueDay: formData.get("dueDay"),
    autopay: formData.get("autopay") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await prisma.bill.create({
    data: {
      userId,
      name: validated.data.name,
      amount: Math.round(validated.data.amount * 100),
      dueDay: validated.data.dueDay,
      autopay: validated.data.autopay === "on",
    },
  });

  revalidatePath("/bills");
  revalidatePath("/dashboard");
}

export async function toggleBillPaid(billId: string) {
  const { userId } = await verifySession();

  const bill = await prisma.bill.findFirst({ where: { id: billId, userId } });
  if (!bill) return;

  await prisma.bill.update({ where: { id: billId }, data: { paid: !bill.paid } });
  revalidatePath("/bills");
  revalidatePath("/dashboard");
}

export async function deleteBill(billId: string) {
  const { userId } = await verifySession();
  await prisma.bill.deleteMany({ where: { id: billId, userId } });
  revalidatePath("/bills");
  revalidatePath("/dashboard");
}
