"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteCategory,
  updateCategory,
  type CategoryFormState,
} from "@/lib/actions/settings";
import { fmt } from "@/lib/currency";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { AmountInput } from "@/components/ui/amount-input";

export function CategoryRow({
  id,
  name,
  monthlyLimit,
}: {
  id: string;
  name: string;
  monthlyLimit: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(
    updateCategory,
    undefined,
  );
  const { showToast } = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors && !state?.message) {
      setIsEditing(false);
      showToast("Category updated");
    }
    wasPending.current = pending;
  }, [pending, state, showToast]);

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        showToast("Category deleted");
      }
    });
  }

  if (isEditing) {
    return (
      <div className="border-t border-border py-3">
        <form action={action} className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <input type="hidden" name="id" value={id} />
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted-strong">Category name</label>
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
            <label className="text-xs font-semibold text-muted-strong">Limit (RM/mo)</label>
            <AmountInput
              name="monthlyLimit"
              required
              defaultCents={monthlyLimit}
              className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
            />
            {state?.errors?.monthlyLimit && (
              <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                {state.errors.monthlyLimit[0]}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm font-semibold px-4 py-2 rounded-md text-muted transition-colors hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-md px-4 py-2 transition disabled:cursor-not-allowed hover:not-disabled:brightness-90"
              style={{ background: "var(--accent)" }}
            >
              {pending && <Spinner className="w-4 h-4" />}
              {pending ? "Saving…" : "Save"}
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
    <div className="flex justify-between items-center flex-wrap gap-3 border-t border-border py-3">
      <div className="text-sm font-semibold">{name}</div>
      <div className="flex items-center gap-4">
        <div className="text-sm tabular-nums text-muted-strong">{fmt(monthlyLimit)}/mo</div>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => setIsEditing(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-md text-muted-strong transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-black/5"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-[color-mix(in_oklch,var(--over-budget)_12%,transparent)]"
          style={{ color: "var(--over-budget)" }}
        >
          {isDeleting && <Spinner className="w-3.5 h-3.5" />}
          Delete
        </button>
      </div>
      {deleteError && (
        <p className="text-xs w-full" style={{ color: "var(--over-budget)" }}>
          {deleteError}
        </p>
      )}
    </div>
  );
}
