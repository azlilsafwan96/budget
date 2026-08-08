"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";

export function SubmitButton({
  children,
  pendingText,
  className,
  style,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} style={style}>
      {pending && <Spinner className="w-4 h-4" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
