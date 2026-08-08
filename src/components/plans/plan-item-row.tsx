"use client";

import { useState, useTransition } from "react";
import { toggleItemBought, deletePlanItem } from "@/lib/actions/plans";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function PlanItemRow({
  id,
  planId,
  name,
  amountLabel,
  bought,
  tags,
}: {
  id: string;
  planId: string;
  name: string;
  amountLabel: string;
  bought: boolean;
  tags: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"toggle" | "delete" | null>(null);
  const { showToast } = useToast();

  function handleToggle() {
    setPendingAction("toggle");
    startTransition(async () => {
      await toggleItemBought(id, planId);
      showToast(bought ? "Item marked pending" : "Item marked bought");
    });
  }

  function handleDelete() {
    setPendingAction("delete");
    startTransition(async () => {
      await deletePlanItem(id, planId);
      showToast("Item deleted");
    });
  }

  return (
    <div
      className="flex justify-between items-center flex-wrap gap-3 border-t border-border"
      style={{ padding: "var(--row-pad) 0", opacity: isPending ? 0.6 : 1 }}
    >
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-sm font-semibold">{name}</div>
          {tags.map((tag) => (
            <div
              key={tag}
              className="text-[11.5px] font-semibold text-muted-strong bg-pill-bg px-2.5 py-[3px] rounded-full"
            >
              {tag}
            </div>
          ))}
        </div>
        <div
          className="text-[11px] font-semibold mt-1"
          style={{ color: bought ? "var(--accent)" : "var(--muted)" }}
        >
          {bought ? "Bought" : "Pending"}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <div className="text-sm font-semibold tabular-nums">{amountLabel}</div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-border text-muted-strong transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-black/5"
        >
          {isPending && pendingAction === "toggle" && <Spinner className="w-3.5 h-3.5" />}
          {bought ? "Mark pending" : "Mark bought"}
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
