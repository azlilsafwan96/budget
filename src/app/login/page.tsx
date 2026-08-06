"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/lib/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-8">
        <div className="text-xl font-bold">Log in</div>
        <div className="text-sm text-muted mt-1">Personal Budget Dashboard</div>

        <form action={action} className="flex flex-col gap-3 mt-6">
          <div>
            <label className="text-xs font-semibold text-muted-strong">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-strong">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
            />
          </div>

          {state?.message && (
            <p className="text-xs" style={{ color: "var(--over-budget)" }}>
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="text-white text-sm font-semibold rounded-md py-2.5 mt-2"
            style={{ background: "var(--accent, #2f9e6e)" }}
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border" />
          <div className="text-xs text-muted">or</div>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton />

        <div className="text-sm text-muted mt-5">
          No account?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "var(--accent, #2f9e6e)" }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
