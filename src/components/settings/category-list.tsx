"use client";

import { useActionState, useState, useTransition } from "react";
import { addCategory, deleteCategory, type CategoryFormState } from "@/lib/actions/settings";
import { fmt } from "@/lib/currency";

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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        {categories.length === 0 && <div className="text-sm text-muted py-2">No categories yet.</div>}
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex justify-between items-center border-t border-border py-3"
          >
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="flex items-center gap-4">
              <div className="text-sm tabular-nums text-muted-strong">{fmt(c.monthlyLimit)}/mo</div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(c.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md"
                style={{ color: "var(--over-budget)" }}
              >
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

      <form action={action} className="flex gap-2 items-end border-t border-border pt-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-strong">Category name</label>
          <input
            name="name"
            required
            className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
          />
        </div>
        <div className="w-32">
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
          className="text-white text-sm font-semibold rounded-md px-4 py-2"
          style={{ background: "var(--accent)" }}
        >
          Add
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
