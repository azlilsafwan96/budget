import "server-only";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/currency";
import { getCurrentCycleWindow } from "@/lib/cycle";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export async function getDashboardData(userId: string, cycleStartDay: number) {
  const now = new Date();
  const { start: monthStart, end: monthEnd } = getCurrentCycleWindow(cycleStartDay, now);

  const [categories, monthTransactions, recentTransactions, bills, savingsGoal, streakLogs] =
    await Promise.all([
      prisma.category.findMany({
        where: { userId },
        include: {
          transactions: { where: { date: { gte: monthStart, lt: monthEnd } } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: monthStart, lt: monthEnd } },
        select: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: "desc" },
        take: 6,
      }),
      prisma.bill.findMany({ where: { userId }, orderBy: { dueDay: "asc" } }),
      prisma.savingsGoal.findFirst({ where: { userId } }),
      prisma.streakLog.findMany({
        where: { userId, date: { gte: daysAgo(6) } },
        orderBy: { date: "asc" },
      }),
    ]);

  const near = "var(--near-limit)";
  const over = "var(--over-budget)";
  const onTrack = "var(--accent)";

  const categoryRows = categories.map((c) => {
    const spent = c.transactions.reduce((sum, t) => sum + t.amount, 0);
    const pct = c.monthlyLimit > 0 ? Math.round((spent / c.monthlyLimit) * 100) : 0;
    const isOver = spent > c.monthlyLimit;
    const isNear = !isOver && pct >= 90;
    return {
      id: c.id,
      name: c.name,
      spentLabel: fmt(spent),
      limitLabel: fmt(c.monthlyLimit),
      barPct: Math.min(100, pct),
      statusColor: isOver ? over : isNear ? near : onTrack,
      statusLabel: isOver ? "Over budget" : isNear ? "Near limit" : "On track",
    };
  });

  const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalBudget = categories.reduce((sum, c) => sum + c.monthlyLimit, 0);
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const savingsPct = savingsGoal && savingsGoal.targetAmount > 0
    ? Math.round((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100)
    : 0;

  const streakDates = new Set(streakLogs.map((s) => s.date.toISOString().slice(0, 10)));
  const streakDays = Array.from({ length: 7 }).map((_, i) => {
    const d = daysAgo(6 - i);
    const active = streakDates.has(d.toISOString().slice(0, 10));
    return { label: DAY_LABELS[d.getDay()], active };
  });
  const streakCount = countCurrentStreak(streakDates);

  return {
    categories: categoryRows,
    transactions: recentTransactions.map((t) => ({
      id: t.id,
      merchant: t.merchant,
      category: t.category?.name ?? "Uncategorized",
      date: t.date.toLocaleDateString("en-MY", { month: "short", day: "numeric" }),
      amountLabel: fmt(t.amount),
    })),
    bills: bills.map((b) => {
      const isPaid = b.paidAt !== null && b.paidAt >= monthStart;
      return {
        id: b.id,
        name: b.name,
        due: `Day ${b.dueDay}`,
        amountLabel: fmt(b.amount),
        statusLabel: isPaid ? "Paid" : b.autopay ? "Autopay" : "Manual",
        statusColor: isPaid ? "var(--accent)" : "var(--muted)",
      };
    }),
    totalSpent: fmt(totalSpent),
    totalBudget: fmt(totalBudget),
    totalBills: fmt(totalBills),
    remaining: fmt(totalBudget - totalSpent),
    spentPct,
    savingsGoalName: savingsGoal?.name ?? "No goal set",
    savingsCurrent: fmt(savingsGoal?.currentAmount ?? 0),
    savingsTarget: fmt(savingsGoal?.targetAmount ?? 0),
    savingsPct,
    streakDays,
    streakCount,
  };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function countCurrentStreak(streakDates: Set<string>): number {
  let count = 0;
  for (let i = 0; ; i++) {
    const d = daysAgo(i);
    if (!streakDates.has(d.toISOString().slice(0, 10))) break;
    count++;
  }
  return count;
}
