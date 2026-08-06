"use client";

import { useActionState, useState } from "react";
import { addTransaction, type TransactionFormState } from "@/lib/actions/transactions";

export function AddTransaction({ categories }: { categories: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<TransactionFormState, FormData>(
    addTransaction,
    undefined,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-white px-5 py-[11px] rounded-lg text-sm font-semibold cursor-pointer"
        style={{ background: "var(--accent)" }}
      >
        + Add transaction
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm">
            <div className="text-[15px] font-semibold mb-4">Add transaction</div>
            <form
              action={async (formData) => {
                await action(formData);
                setOpen(false);
              }}
              className="flex flex-col gap-3"
            >
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
                  className="text-sm font-semibold px-4 py-2 rounded-md text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="text-sm font-semibold px-4 py-2 rounded-md text-white"
                  style={{ background: "var(--accent)" }}
                >
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
