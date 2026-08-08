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
  const { start, end } = getCurrentCycleWindow(cycleStartDay, now);
  return formatCycleWindowLabel(start, end, cycleStartDay);
}

export function formatCycleWindowLabel(start: Date, end: Date, cycleStartDay: number): string {
  if (cycleStartDay === 1) {
    return start.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
  }
  const displayEnd = new Date(end);
  displayEnd.setDate(displayEnd.getDate() - 1);

  const startLabel = start.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
  const endLabel = displayEnd.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}, ${displayEnd.getFullYear()}`;
}

/**
 * All cycle windows from `since` through the current cycle, oldest first.
 * Walks backward one cycle at a time from "now".
 */
export function getCycleWindowsSince(
  cycleStartDay: number,
  since: Date,
  now: Date = new Date(),
): { start: Date; end: Date }[] {
  const windows: { start: Date; end: Date }[] = [];
  let { start, end } = getCurrentCycleWindow(cycleStartDay, now);

  while (true) {
    windows.unshift({ start, end });
    if (start <= since) break;
    ({ start, end } = getCurrentCycleWindow(cycleStartDay, new Date(start.getTime() - 1)));
  }

  return windows;
}
