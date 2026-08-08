"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTransaction, type TransactionFormState } from "@/lib/actions/transactions";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function AddTransaction({ categories }: { categories: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<TransactionFormState, FormData>(
    addTransaction,
    undefined,
  );
  const { showToast } = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors && !state?.message) {
      setOpen(false);
      showToast("Transaction added");
    }
    wasPending.current = pending;
  }, [pending, state, showToast]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-white px-5 py-[11px] rounded-lg text-sm font-semibold cursor-pointer transition hover:brightness-90"
        style={{ background: "var(--accent)" }}
      >
        + Add transaction
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="text-[15px] font-semibold mb-4">Add transaction</div>
            <form action={action} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-strong">Merchant</label>
                <input
                  name="merchant"
                  required
                  className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
                />
                {state?.errors?.merchant && (
                  <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                    {state.errors.merchant[0]}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-strong">Category</label>
                <select
                  name="categoryId"
                  required
                  className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-strong">Amount (RM)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
                />
                {state?.errors?.amount && (
                  <p className="text-xs mt-1" style={{ color: "var(--over-budget)" }}>
                    {state.errors.amount[0]}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-strong">Date</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
                />
              </div>

              {state?.message && (
                <p className="text-xs" style={{ color: "var(--over-budget)" }}>
                  {state.message}
                </p>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold px-4 py-2 rounded-md text-muted transition-colors hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-md text-white transition disabled:cursor-not-allowed hover:not-disabled:brightness-90"
                  style={{ background: "var(--accent)" }}
                >
                  {pending && <Spinner className="w-4 h-4" />}
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
