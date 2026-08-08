"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function TransactionRow({
  id,
  merchant,
  category,
  date,
  amountLabel,
}: {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amountLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleDelete() {
    startTransition(async () => {
      await deleteTransaction(id);
      showToast("Transaction deleted");
    });
  }

  return (
    <div
      className="flex justify-between items-center border-t border-border"
      style={{ padding: "var(--row-pad) 0", opacity: isPending ? 0.6 : 1 }}
    >
      <div className="flex items-center gap-2.5">
        <div className="text-sm font-semibold">{merchant}</div>
        <div className="text-[11.5px] font-semibold text-muted-strong bg-pill-bg px-2.5 py-[3px] rounded-full">
          {category}
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-[13px] text-muted">{date}</div>
        <div className="text-sm font-semibold tabular-nums min-w-[90px] text-right">
          -{amountLabel}
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-[color-mix(in_oklch,var(--over-budget)_12%,transparent)]"
          style={{ color: "var(--over-budget)" }}
        >
          {isPending && <Spinner className="w-3.5 h-3.5" />}
          Delete
        </button>
      </div>
    </div>
  );
}
