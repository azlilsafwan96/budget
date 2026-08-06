import { getCurrentUser } from "@/lib/dal";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { AddTransaction } from "@/components/dashboard/add-transaction";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [data, categories] = await Promise.all([
    getDashboardData(user.id),
    prisma.category.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
  ]);

  const monthLabel = new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" });

  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="text-[28px] font-bold tracking-tight">Good afternoon, {user.name}</div>
          <div className="text-sm mt-1 text-muted">{monthLabel} · Personal Budget</div>
        </div>
        <div className="flex items-center gap-3">
          {user.showGamification && (
            <div className="flex items-center gap-2 bg-surface border border-border rounded-full pl-3 pr-4 py-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="text-[13px] font-semibold">{data.streakCount}-day streak</span>
            </div>
          )}
          <AddTransaction categories={categories} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-7">
        <Card>
          <CardLabel>Spent this month</CardLabel>
          <div className="text-[32px] font-bold mt-2.5 tabular-nums">{data.totalSpent}</div>
          <div className="text-[13px] mt-1 text-muted">of {data.totalBudget} budgeted</div>
          <Progress pct={data.spentPct} color="var(--accent)" />
        </Card>

        <Card>
          <CardLabel>Remaining budget</CardLabel>
          <div className="text-[32px] font-bold mt-2.5 tabular-nums">{data.remaining}</div>
          <div className="text-[13px] mt-1 text-muted">{data.spentPct}% of budget used</div>
          <div
            className="inline-flex items-center gap-1.5 mt-3.5 text-xs font-semibold px-2.5 py-1.5 rounded-md"
            style={{ background: "var(--success-bg)", color: "var(--success-fg)" }}
          >
            {data.spentPct <= 100 ? "On pace for the month" : "Over budget this month"}
          </div>
        </Card>

        <Card className="flex gap-4 items-center">
          <div
            className="w-[76px] h-[76px] rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `conic-gradient(var(--accent) ${data.savingsPct}%, var(--track) 0)`,
            }}
          >
            <div className="w-[58px] h-[58px] rounded-full bg-surface flex items-center justify-center text-sm font-bold">
              {data.savingsPct}%
            </div>
          </div>
          <div>
            <CardLabel>{data.savingsGoalName}</CardLabel>
            <div className="text-lg font-bold mt-1.5 tabular-nums">{data.savingsCurrent}</div>
            <div className="text-xs mt-0.5 text-muted">of {data.savingsTarget} goal</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start mt-6">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="text-[15px] font-semibold mb-4.5">Budget categories</div>
            <div className="flex flex-col" style={{ gap: "var(--row-gap)" }}>
              {data.categories.length === 0 && (
                <EmptyState text="No categories yet. Add one in Settings." />
              )}
              {data.categories.map((cat) => (
                <div key={cat.id}>
                  <div className="flex justify-between items-baseline">
                    <div className="text-sm font-semibold">{cat.name}</div>
                    <div className="text-[13px] tabular-nums text-muted-strong">
                      {cat.spentLabel} <span className="text-muted">/ {cat.limitLabel}</span>
                    </div>
                  </div>
                  <Progress pct={cat.barPct} color={cat.statusColor} />
                  <div className="text-xs mt-1.5 font-semibold" style={{ color: cat.statusColor }}>
                    {cat.statusLabel}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-[15px] font-semibold mb-3.5">Recent transactions</div>
            <div className="flex flex-col">
              {data.transactions.length === 0 && <EmptyState text="No transactions yet." />}
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center border-t border-border"
                  style={{ padding: "var(--row-pad) 0" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="text-sm font-semibold">{tx.merchant}</div>
                    <div className="text-[11.5px] font-semibold text-muted-strong bg-pill-bg px-2.5 py-[3px] rounded-full">
                      {tx.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-[13px] text-muted">{tx.date}</div>
                    <div className="text-sm font-semibold tabular-nums min-w-[90px] text-right">
                      -{tx.amountLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {user.showGamification ? (
            <Card>
              <div className="text-[15px] font-semibold">Logging streak</div>
              <div className="text-[30px] font-bold mt-2">{data.streakCount} days</div>
              <div className="text-[13px] mt-0.5 text-muted">
                Keep it up — log today&apos;s spending.
              </div>
              <div className="flex gap-2 mt-4">
                {data.streakDays.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-[11px] h-[11px] rounded-full"
                      style={{ background: d.active ? "var(--accent)" : "var(--track)" }}
                    />
                    <div className="text-[10.5px] text-muted">{d.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-[15px] font-semibold">Insights</div>
              <div className="text-[13px] mt-2.5 leading-relaxed text-muted-strong">
                You&apos;ve spent {data.spentPct}% of this month&apos;s budget so far.
              </div>
            </Card>
          )}

          <Card>
            <div className="text-[15px] font-semibold mb-1.5">Upcoming bills</div>
            <div className="flex flex-col">
              {data.bills.length === 0 && <EmptyState text="No bills yet." />}
              {data.bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex justify-between items-center border-t border-border"
                  style={{ padding: "var(--row-pad) 0" }}
                >
                  <div>
                    <div className="text-[13.5px] font-semibold">{bill.name}</div>
                    <div className="text-xs mt-0.5 text-muted">Due {bill.due}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13.5px] font-semibold tabular-nums">{bill.amountLabel}</div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: bill.statusColor }}>
                      {bill.statusLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-6 ${className}`}>{children}</div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[13px] font-semibold text-muted">{children}</div>;
}

function Progress({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 bg-track rounded-full mt-3.5 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, pct)}%`, background: color }}
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-muted py-2">{text}</div>;
}
