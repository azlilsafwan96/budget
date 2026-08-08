"use client";

import { useState, useTransition } from "react";
import { toggleBillPaid, deleteBill } from "@/lib/actions/bills";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function BillRow({
  id,
  name,
  due,
  amountLabel,
  paid,
  statusLabel,
}: {
  id: string;
  name: string;
  due: string;
  amountLabel: string;
  paid: boolean;
  statusLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"toggle" | "delete" | null>(null);
  const { showToast } = useToast();

  function handleToggle() {
    setPendingAction("toggle");
    startTransition(async () => {
      await toggleBillPaid(id);
      showToast(paid ? "Bill marked unpaid" : "Bill marked paid");
    });
  }

  function handleDelete() {
    setPendingAction("delete");
    startTransition(async () => {
      await deleteBill(id);
      showToast("Bill deleted");
    });
  }

  return (
    <div
      className="flex justify-between items-center flex-wrap gap-3 border-t border-border"
      style={{ padding: "var(--row-pad) 0", opacity: isPending ? 0.6 : 1 }}
    >
      <div>
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs mt-0.5 text-muted">Due {due}</div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums">{amountLabel}</div>
          <div
            className="text-[11px] font-semibold mt-0.5"
            style={{ color: paid ? "var(--accent)" : "var(--muted)" }}
          >
            {statusLabel}
          </div>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border text-muted-strong transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-black/5"
        >
          {isPending && pendingAction === "toggle" && <Spinner className="w-3.5 h-3.5" />}
          {paid ? "Mark unpaid" : "Mark paid"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-[color-mix(in_oklch,var(--over-budget)_12%,transparent)]"
          style={{ color: "var(--over-budget)" }}
        >
          {isPending && pendingAction === "delete" && <Spinner className="w-3.5 h-3.5" />}
          Delete
        </button>
      </div>
    </div>
  );
}
