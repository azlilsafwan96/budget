"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deletePlan } from "@/lib/actions/plans";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function PlanRow({
  id,
  name,
  itemCount,
  totalLabel,
}: {
  id: string;
  name: string;
  itemCount: number;
  totalLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleDelete() {
    startTransition(async () => {
      await deletePlan(id);
      showToast("Plan deleted");
    });
  }

  return (
    <div
      className="flex justify-between items-center flex-wrap gap-3 border-t border-border"
      style={{ padding: "var(--row-pad) 0", opacity: isPending ? 0.6 : 1 }}
    >
      <Link href={`/plans/${id}`} className="no-underline">
        <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {name}
        </div>
        <div className="text-xs mt-0.5 text-muted">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </div>
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-sm font-semibold tabular-nums">{totalLabel}</div>
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
