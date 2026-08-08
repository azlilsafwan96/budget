function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampedCycleDate(year: number, month: number, cycleStartDay: number): Date {
  const day = Math.min(cycleStartDay, daysInMonth(year, month));
  return new Date(year, month, day);
}

export function getCurrentCycleWindow(
  cycleStartDay: number,
  now: Date = new Date(),
): { start: Date; end: Date } {
  const year = now.getFullYear();
  const month = now.getMonth();
  const thisMonthStart = clampedCycleDate(year, month, cycleStartDay);

  if (now >= thisMonthStart) {
    return { start: thisMonthStart, end: clampedCycleDate(year, month + 1, cycleStartDay) };
  }
  return { start: clampedCycleDate(year, month - 1, cycleStartDay), end: thisMonthStart };
}

export function formatCycleLabel(cycleStartDay: number, now: Date = new Date()): string {
  if (cycleStartDay === 1) {
    return now.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
  }
  const { start, end } = getCurrentCycleWindow(cycleStartDay, now);
  const displayEnd = new Date(end);
  displayEnd.setDate(displayEnd.getDate() - 1);

  const startLabel = start.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
  const endLabel = displayEnd.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}, ${displayEnd.getFullYear()}`;
}
