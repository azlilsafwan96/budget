"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addCategory, deleteCategory, type CategoryFormState } from "@/lib/actions/settings";
import { fmt } from "@/lib/currency";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function CategoryList({
  categories,
}: {
  categories: { id: string; name: string; monthlyLimit: number }[];
}) {
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(
    addCategory,
    undefined,
  );
  const [isDeleting, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { showToast } = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors && !state?.message) {
      showToast("Category created");
    }
    wasPending.current = pending;
  }, [pending, state, showToast]);

  function handleDelete(id: string) {
    setDeleteError(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        showToast("Category deleted");
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        {categories.length === 0 && <div className="text-sm text-muted py-2">No categories yet.</div>}
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex justify-between items-center flex-wrap gap-3 border-t border-border py-3"
          >
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="flex items-center gap-4">
              <div className="text-sm tabular-nums text-muted-strong">{fmt(c.monthlyLimit)}/mo</div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(c.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:cursor-not-allowed hover:not-disabled:bg-[color-mix(in_oklch,var(--over-budget)_12%,transparent)]"
                style={{ color: "var(--over-budget)" }}
              >
                {deletingId === c.id && <Spinner className="w-3.5 h-3.5" />}
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteError && (
        <p className="text-xs" style={{ color: "var(--over-budget)" }}>
          {deleteError}
        </p>
      )}

      <form
        action={action}
        className="flex flex-col sm:flex-row gap-2 sm:items-end border-t border-border pt-4"
      >
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-strong">Category name</label>
          <input
            name="name"
            required
            className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
          />
        </div>
        <div className="sm:w-32">
          <label className="text-xs font-semibold text-muted-strong">Limit (RM/mo)</label>
          <input
            name="monthlyLimit"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-md px-4 py-2 transition disabled:cursor-not-allowed hover:not-disabled:brightness-90"
          style={{ background: "var(--accent)" }}
        >
          {pending && <Spinner className="w-4 h-4" />}
          {pending ? "Adding…" : "Add"}
        </button>
      </form>
      {(state?.errors || state?.message) && (
        <p className="text-xs" style={{ color: "var(--over-budget)" }}>
          {state.message ?? Object.values(state.errors ?? {})[0]?.[0]}
        </p>
      )}
    </div>
  );
}
