import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return { userId: session.user.id };
});

export const getCurrentUser = cache(async () => {
  const { userId } = await verifySession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return user;
});
