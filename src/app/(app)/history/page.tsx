import { getCurrentUser } from "@/lib/dal";
import { getHistoryData } from "@/lib/history";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const { cycles } = await getHistoryData(user.id, user.cycleStartDay);

  return (
    <>
      <div className="text-2xl md:text-[28px] font-bold tracking-tight">History</div>
      <div className="text-sm mt-1 text-muted">
        Spending trend across every budget cycle since your first transaction.
      </div>

      {cycles.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6">
          <div className="text-sm text-muted py-2">No spending history yet.</div>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6">
            <div className="text-[15px] font-semibold">Spending trend</div>
            <div className="overflow-x-auto mt-6">
              <div className="flex items-end gap-3 h-40 pt-6 w-fit">
                {cycles.map((c, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-end h-full shrink-0 w-11"
                  >
                    <div className="text-[11px] font-semibold tabular-nums mb-1.5 whitespace-nowrap">
                      {c.totalSpentLabel}
                    </div>
                    <div
                      className="w-6 rounded-t-[4px]"
                      style={{
                        height: `${c.barPct}%`,
                        background: c.isOverBudget ? "var(--over-budget)" : "var(--accent)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 w-fit mt-2">
                {cycles.map((c, i) => (
                  <div
                    key={i}
                    className="text-[10.5px] text-muted text-center shrink-0 w-11 whitespace-nowrap"
                  >
                    {c.shortLabel}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6 max-w-2xl">
            <div className="text-[15px] font-semibold mb-1">By category</div>
            <div className="text-xs text-muted mb-2">
              Status reflects your current category limits, not what they were at the time.
            </div>
            <div className="flex flex-col">
              {[...cycles].reverse().map((c, i) => (
                <div key={i} className="border-t border-border py-4">
                  <div className="flex justify-between items-baseline">
                    <div className="text-sm font-semibold">{c.label}</div>
                    <div className="text-sm font-semibold tabular-nums">{c.totalSpentLabel}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-3">
                    {c.categories.map((cat) => (
                      <div key={cat.id} className="flex justify-between items-center">
                        <div className="text-[13px] text-muted-strong">{cat.name}</div>
                        <div
                          className="text-[13px] tabular-nums font-semibold"
                          style={{ color: cat.statusColor }}
                        >
                          {cat.spentLabel}{" "}
                          <span className="text-muted font-normal">/ {cat.limitLabel}</span>
                        </div>
                      </div>
                    ))}
                    {c.uncategorizedLabel && (
                      <div className="flex justify-between items-center">
                        <div className="text-[13px] text-muted-strong">Uncategorized</div>
                        <div className="text-[13px] tabular-nums font-semibold text-muted-strong">
                          {c.uncategorizedLabel}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
