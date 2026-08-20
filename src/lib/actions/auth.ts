"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

// Trim before validating, not after. Chaining `.trim()` onto a rule applies it
// to the *output*, so the rule sees the untrimmed input: "  " passed min(2) and
// became an empty name, and "  abc   " passed min(8) and was stored as a 3-char
// password. The password is deliberately not trimmed at all — `authorize()` in
// src/auth.ts compares what the user types, so trimming here would store a hash
// they could never log in against.
const RegisterSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  email: z.string().trim().pipe(z.email({ error: "Enter a valid email." })),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
});

export type AuthFormState =
  | { errors?: { name?: string[]; email?: string[]; password?: string[] }; message?: string }
  | undefined;

export async function register(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { message: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
}

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid email or password." };
    }
    throw error;
  }
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
