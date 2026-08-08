"use client";

import { useFormStatus } from "react-dom";
import { loginWithGoogle } from "@/lib/actions/auth";
import { Spinner } from "@/components/ui/spinner";

function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-md py-2.5 border border-border transition-colors disabled:cursor-not-allowed disabled:opacity-70 hover:not-disabled:bg-black/5 hover:not-disabled:border-foreground/20"
    >
      {pending ? (
        <Spinner className="w-4 h-4" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.2l6-6C34.9 3 29.7 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22c11 0 21-8 21-22 0-1.5-.2-2.6-.4-2.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.3 0 6.3 1.2 8.6 3.2l6-6C34.9 6 29.7 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.6 0 10.7-1.9 14.6-5.2l-6.7-5.7C29.8 34.6 27 35.5 24 35.5c-5.4 0-9.9-3.5-11.5-8.2l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-2.9 5.1-5.4 6.7l6.7 5.7C39.9 37.4 44 31.3 44 23c0-1.5-.2-2.6-.4-2.5z"
          />
        </svg>
      )}
      {pending ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

export function GoogleButton() {
  return (
    <form action={loginWithGoogle}>
      <GoogleSubmitButton />
    </form>
  );
}
