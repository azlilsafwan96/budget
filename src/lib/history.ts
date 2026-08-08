import "server-only";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/currency";
import { getCycleWindowsSince, formatCycleWindowLabel } from "@/lib/cycle";

export type HistoryCategoryRow = {
  id: string;
  name: string;
  spentLabel: string;
  limitLabel: string;
  statusColor: string;
};

export type HistoryCycle = {
  label: string;
  shortLabel: string;
  totalSpent: number;
  totalSpentLabel: string;
  isOverBudget: boolean;
  categories: HistoryCategoryRow[];
  uncategorizedLabel: string | null;
  barPct: number;
};

export async function getHistoryData(
  userId: string,
  cycleStartDay: number,
): Promise<{ cycles: HistoryCycle[] }> {
  const [earliest, categories] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId }, _min: { date: true } }),
    prisma.category.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  if (!earliest._min.date) {
    return { cycles: [] };
  }

  const windows = getCycleWindowsSince(cycleStartDay, earliest._min.date);
  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: windows[0].start } },
    select: { amount: true, date: true, categoryId: true },
  });

  const near = "var(--near-limit)";
  const over = "var(--over-budget)";
  const onTrack = "var(--accent)";
  const totalBudget = categories.reduce((sum, c) => sum + c.monthlyLimit, 0);

  const cycles = windows.map(({ start, end }) => {
    const inCycle = transactions.filter((t) => t.date >= start && t.date < end);
    const totalSpent = inCycle.reduce((sum, t) => sum + t.amount, 0);

    const categoryRows = categories.map((c) => {
      const spent = inCycle
        .filter((t) => t.categoryId === c.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = c.monthlyLimit > 0 ? Math.round((spent / c.monthlyLimit) * 100) : 0;
      const isOver = spent > c.monthlyLimit;
      const isNear = !isOver && pct >= 90;
      return {
        id: c.id,
        name: c.name,
        spentLabel: fmt(spent),
        limitLabel: fmt(c.monthlyLimit),
        statusColor: isOver ? over : isNear ? near : onTrack,
      };
    });

    const uncategorizedSpent = inCycle
      .filter((t) => t.categoryId === null)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      label: formatCycleWindowLabel(start, end, cycleStartDay),
      shortLabel: start.toLocaleDateString("en-MY", { month: "short", day: "numeric" }),
      totalSpent,
      totalSpentLabel: fmt(totalSpent),
      isOverBudget: totalBudget > 0 && totalSpent > totalBudget,
      categories: categoryRows,
      uncategorizedLabel: uncategorizedSpent > 0 ? fmt(uncategorizedSpent) : null,
    };
  });

  const maxSpent = Math.max(...cycles.map((c) => c.totalSpent), 1);

  return {
    cycles: cycles.map((c) => ({
      ...c,
      barPct: Math.max(4, Math.round((c.totalSpent / maxSpent) * 100)),
    })),
  };
}
