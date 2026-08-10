"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCategory, type CategoryFormState } from "@/lib/actions/settings";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { CategoryRow } from "@/components/settings/category-row";
import { AmountInput } from "@/components/ui/amount-input";

export function CategoryList({
  categories,
}: {
  categories: { id: string; name: string; monthlyLimit: number }[];
}) {
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(
    addCategory,
    undefined,
  );
  const { showToast } = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors && !state?.message) {
      showToast("Category created");
    }
    wasPending.current = pending;
  }, [pending, state, showToast]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        {categories.length === 0 && <div className="text-sm text-muted py-2">No categories yet.</div>}
        {categories.map((c) => (
          <CategoryRow key={c.id} id={c.id} name={c.name} monthlyLimit={c.monthlyLimit} />
        ))}
      </div>

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
          <AmountInput
            name="monthlyLimit"
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
