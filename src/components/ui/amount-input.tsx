"use client";

import { useRef, useState } from "react";

const MAX_CENTS = 99_999_999;

export function AmountInput({
  name,
  defaultCents,
  required,
  className,
}: {
  name: string;
  defaultCents?: number;
  required?: boolean;
  className?: string;
}) {
  const [cents, setCents] = useState(defaultCents ?? 0);
  const inputRef = useRef<HTMLInputElement>(null);

  function moveCaretToEnd() {
    const input = inputRef.current;
    if (!input) return;
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const next = digits === "" ? 0 : parseInt(digits, 10);
    if (next <= MAX_CENTS) {
      setCents(next);
    }
    moveCaretToEnd();
  }

  return (
    <input
      ref={inputRef}
      name={name}
      type="text"
      inputMode="numeric"
      required={required}
      value={(cents / 100).toFixed(2)}
      onChange={handleChange}
      onClick={moveCaretToEnd}
      onFocus={moveCaretToEnd}
      className={className}
    />
  );
}
