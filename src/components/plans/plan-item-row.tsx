"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  toggleItemBought,
  deletePlanItem,
  updatePlanItem,
  type PlanItemFormState,
} from "@/lib/actions/plans";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { TagInput } from "@/components/plans/tag-input";
import { AmountInput } from "@/components/ui/amount-input";

export function PlanItemRow({
  id,
  planId,
  name,
  amount,
  amountLabel,
  bought,
  tags,
  allTags,
}: {
  id: string;
  planId: string;
  name: string;
  amount: number;
  amountLabel: string;
  bought: boolean;
  tags: string[];
  allTags: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"toggle" | "delete" | null>(null);
  const [state, action, editPending] = useActionState<PlanItemFormState, FormData>(
    updatePlanItem,
    undefined,
  );
  const { showToast } = useToast();
  const wasEditPending = useRef(false);

  useEffect(() => {
    if (wasEditPending.current && !editPending && !state?.errors && !state?.message) {
      setIsEditing(false);
      showToast("Item updated");
    }
    wasEditPending.current = editPending;
  }, [editPending, state, showToast]);

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

  if (isEditing) {
    return (
      <div className="border-t border-border" style={{ padding: "var(--row-pad) 0" }}>
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="planId" value={planId} />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-strong">Name</label>
              <input
                name="name"
                required
                defaultValue={name}
                className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
              />
              {state?.errors?.name && (
                <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                  {state.errors.name[0]}
                </p>
              )}
            </div>
            <div className="sm:w-32">
              <label className="text-xs font-semibold text-muted-strong">Amount (RM)</label>
              <AmountInput
                name="amount"
                required
                defaultCents={amount}
                className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
              />
              {state?.errors?.amount && (
                <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                  {state.errors.amount[0]}
                </p>
              )}
            </div>
          </div>

          <TagInput allTags={allTags} initialTags={tags} />

          <label className="flex items-center gap-2 text-sm text-muted-strong">
            <input name="bought" type="checkbox" defaultChecked={bought} />
            Already bought
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm font-semibold px-4 py-2 rounded-md text-muted transition-colors hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editPending}
              className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-md px-4 py-2 transition disabled:cursor-not-allowed hover:not-disabled:brightness-90"
              style={{ background: "var(--accent)" }}
            >
              {editPending && <Spinner className="w-4 h-4" />}
              {editPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
        {state?.message && (
          <p className="text-xs mt-2" style={{ color: "var(--over-budget)" }}>
            {state.message}
          </p>
        )}
      </div>
    );
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
          onClick={() => setIsEditing(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-md text-muted-strong transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-black/5"
        >
          Edit
        </button>
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
