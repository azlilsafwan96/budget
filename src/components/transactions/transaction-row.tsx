"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteTransaction,
  updateTransaction,
  type TransactionFormState,
} from "@/lib/actions/transactions";
import { fmt } from "@/lib/currency";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { AmountInput } from "@/components/ui/amount-input";

export function TransactionRow({
  id,
  merchant,
  categoryId,
  categories,
  dateISO,
  amount,
}: {
  id: string;
  merchant: string;
  categoryId: string | null;
  categories: { id: string; name: string }[];
  dateISO: string;
  amount: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, action, editPending] = useActionState<TransactionFormState, FormData>(
    updateTransaction,
    undefined,
  );
  const { showToast } = useToast();
  const wasEditPending = useRef(false);

  useEffect(() => {
    if (wasEditPending.current && !editPending && !state?.errors && !state?.message) {
      setIsEditing(false);
      showToast("Transaction updated");
    }
    wasEditPending.current = editPending;
  }, [editPending, state, showToast]);

  function handleDelete() {
    startTransition(async () => {
      await deleteTransaction(id);
      showToast("Transaction deleted");
    });
  }

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";
  const displayDate = new Date(dateISO).toLocaleDateString("en-MY", {
    month: "short",
    day: "numeric",
  });

  if (isEditing) {
    return (
      <div className="border-t border-border" style={{ padding: "var(--row-pad) 0" }}>
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <div>
            <label className="text-xs font-semibold text-muted-strong">Merchant</label>
            <input
              name="merchant"
              required
              defaultValue={merchant}
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
              defaultValue={categoryId ?? ""}
              className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
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
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-strong">Date</label>
              <input
                name="date"
                type="date"
                required
                defaultValue={dateISO}
                className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
              />
            </div>
          </div>
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
      className="flex justify-between items-center flex-wrap gap-x-3 gap-y-2 border-t border-border"
      style={{ padding: "var(--row-pad) 0", opacity: isPending ? 0.6 : 1 }}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="text-sm font-semibold">{merchant}</div>
        <div className="text-[11.5px] font-semibold text-muted-strong bg-pill-bg px-2.5 py-[3px] rounded-full">
          {categoryName}
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="text-[13px] text-muted">{displayDate}</div>
        <div className="text-sm font-semibold tabular-nums min-w-[90px] text-right">
          -{fmt(amount)}
        </div>
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
