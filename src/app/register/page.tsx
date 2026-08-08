"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthFormState } from "@/lib/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(register, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 sm:p-8">
        <div className="text-xl font-bold">Create an account</div>
        <div className="text-sm text-muted mt-1">Personal Budget Dashboard</div>

        <form action={action} className="flex flex-col gap-3 mt-6">
          <div>
            <label className="text-xs font-semibold text-muted-strong">Name</label>
            <input
              name="name"
              required
              className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
            />
            {state?.errors?.name && (
              <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                {state.errors.name[0]}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-strong">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
            />
            {state?.errors?.email && (
              <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-strong">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
            />
            {state?.errors?.password && (
              <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {state?.message && (
            <p className="text-xs" style={{ color: "var(--over-budget)" }}>
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-md py-2.5 mt-2 transition disabled:cursor-not-allowed hover:not-disabled:brightness-90"
            style={{ background: "var(--accent, #2f9e6e)" }}
          >
            {pending && <Spinner className="w-4 h-4" />}
            {pending ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border" />
          <div className="text-xs text-muted">or</div>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton />

        <div className="text-sm text-muted mt-5">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold hover:underline transition-colors"
            style={{ color: "var(--accent, #2f9e6e)" }}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
