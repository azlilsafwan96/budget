"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlan } from "@/lib/actions/plans";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function PlanRow({
  id,
  name,
  description,
  itemCount,
  totalLabel,
}: {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  totalLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await deletePlan(id);
      showToast("Plan deleted");
    });
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/plans/${id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/plans/${id}`);
      }}
      className="flex justify-between items-center flex-wrap gap-3 border-t border-border cursor-pointer transition-colors hover:bg-black/5"
      style={{ padding: "var(--row-pad) 0", opacity: isPending ? 0.6 : 1 }}
    >
      <div>
        <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {name}
        </div>
        <div className="text-xs mt-0.5 text-muted">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </div>
        {description && (
          <div className="text-xs mt-0.5 text-muted-strong line-clamp-1 max-w-[280px]">
            {description}
          </div>
        )}
      </div>
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
