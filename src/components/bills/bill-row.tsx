"use client";

import { useTransition } from "react";
import { toggleBillPaid, deleteBill } from "@/lib/actions/bills";

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

  return (
    <div
      className="flex justify-between items-center border-t border-border"
      style={{ padding: "var(--row-pad) 0", opacity: isPending ? 0.6 : 1 }}
    >
      <div>
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs mt-0.5 text-muted">Due {due}</div>
      </div>
      <div className="flex items-center gap-4">
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
          onClick={() => startTransition(() => toggleBillPaid(id))}
          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border text-muted-strong"
        >
          {paid ? "Mark unpaid" : "Mark paid"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteBill(id))}
          className="text-xs font-semibold px-3 py-1.5 rounded-md"
          style={{ color: "var(--over-budget)" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
