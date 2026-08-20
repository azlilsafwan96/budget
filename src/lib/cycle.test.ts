import { describe, expect, it } from "vitest";
import {
  formatCycleLabel,
  formatCycleWindowLabel,
  getCurrentCycleWindow,
  getCycleWindowsSince,
} from "@/lib/cycle";

/** Local-time date helper — the cycle maths is all local-time based. */
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("getCurrentCycleWindow", () => {
  it("uses calendar months when the cycle starts on the 1st", () => {
    const { start, end } = getCurrentCycleWindow(1, d(2026, 3, 15));
    expect(start).toEqual(d(2026, 3, 1));
    expect(end).toEqual(d(2026, 4, 1));
  });

  it("starts the window this month once the start day has passed", () => {
    const { start, end } = getCurrentCycleWindow(25, d(2026, 3, 27));
    expect(start).toEqual(d(2026, 3, 25));
    expect(end).toEqual(d(2026, 4, 25));
  });

  it("falls back to last month's window before the start day", () => {
    const { start, end } = getCurrentCycleWindow(25, d(2026, 3, 10));
    expect(start).toEqual(d(2026, 2, 25));
    expect(end).toEqual(d(2026, 3, 25));
  });

  it("includes the start day itself in the new cycle", () => {
    const { start } = getCurrentCycleWindow(25, d(2026, 3, 25));
    expect(start).toEqual(d(2026, 3, 25));
  });

  it("clamps a day-31 cycle to the last day of a short month", () => {
    // Jan 31 → Feb has no 31st, so the cycle ends on Feb 28.
    const { start, end } = getCurrentCycleWindow(31, d(2026, 2, 5));
    expect(start).toEqual(d(2026, 1, 31));
    expect(end).toEqual(d(2026, 2, 28));
  });

  it("clamps to Feb 29 in a leap year", () => {
    const { end } = getCurrentCycleWindow(31, d(2028, 2, 5));
    expect(end).toEqual(d(2028, 2, 29));
  });

  it("rolls back across the year boundary", () => {
    const { start, end } = getCurrentCycleWindow(25, d(2026, 1, 5));
    expect(start).toEqual(d(2025, 12, 25));
    expect(end).toEqual(d(2026, 1, 25));
  });

  it("rolls forward across the year boundary", () => {
    const { start, end } = getCurrentCycleWindow(25, d(2025, 12, 30));
    expect(start).toEqual(d(2025, 12, 25));
    expect(end).toEqual(d(2026, 1, 25));
  });

  it("never produces an empty or inverted window", () => {
    for (let day = 1; day <= 31; day++) {
      for (let month = 1; month <= 12; month++) {
        const { start, end } = getCurrentCycleWindow(day, d(2026, month, 15));
        expect(start.getTime()).toBeLessThan(end.getTime());
      }
    }
  });
});

describe("formatCycleWindowLabel", () => {
  it("shows just the month for a day-1 cycle", () => {
    expect(formatCycleWindowLabel(d(2026, 3, 1), d(2026, 4, 1), 1)).toBe("March 2026");
  });

  it("shows an inclusive range for a custom start day", () => {
    // End is exclusive, so the label must read Apr 24, not Apr 25.
    const label = formatCycleWindowLabel(d(2026, 3, 25), d(2026, 4, 25), 25);
    expect(label).toBe("25 Mar – 24 Apr, 2026");
  });

  it("does not mutate the end date it was given", () => {
    const end = d(2026, 4, 25);
    formatCycleWindowLabel(d(2026, 3, 25), end, 25);
    expect(end).toEqual(d(2026, 4, 25));
  });
});

describe("formatCycleLabel", () => {
  it("labels the cycle containing `now`", () => {
    expect(formatCycleLabel(1, d(2026, 3, 15))).toBe("March 2026");
  });
});

describe("getCycleWindowsSince", () => {
  it("returns a single window when `since` is inside the current cycle", () => {
    const windows = getCycleWindowsSince(1, d(2026, 3, 10), d(2026, 3, 20));
    expect(windows).toHaveLength(1);
    expect(windows[0].start).toEqual(d(2026, 3, 1));
  });

  it("returns every cycle back to `since`, oldest first", () => {
    const windows = getCycleWindowsSince(1, d(2026, 1, 10), d(2026, 3, 20));
    expect(windows.map((w) => w.start)).toEqual([d(2026, 1, 1), d(2026, 2, 1), d(2026, 3, 1)]);
  });

  it("produces contiguous windows with no gaps or overlaps", () => {
    const windows = getCycleWindowsSince(25, d(2025, 10, 3), d(2026, 3, 20));
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].start).toEqual(windows[i - 1].end);
    }
  });

  it("covers `since` through `now` end to end", () => {
    const since = d(2025, 10, 3);
    const now = d(2026, 3, 20);
    const windows = getCycleWindowsSince(25, since, now);
    expect(windows[0].start.getTime()).toBeLessThanOrEqual(since.getTime());
    expect(windows.at(-1)!.end.getTime()).toBeGreaterThan(now.getTime());
  });

  it("terminates on a clamped day-31 cycle spanning short months", () => {
    const windows = getCycleWindowsSince(31, d(2025, 12, 1), d(2026, 4, 15));
    expect(windows.length).toBeGreaterThan(0);
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].start).toEqual(windows[i - 1].end);
    }
  });
});
