"use client";

import { useState } from "react";
import { updatePreferences } from "@/lib/actions/settings";

const ACCENT_OPTIONS = ["#2f9e6e", "#3b6fd6", "#7a5cd6", "#1f9b96"];

export function PreferencesForm({
  accentColor,
  density,
  showGamification,
}: {
  accentColor: string;
  density: "comfortable" | "compact";
  showGamification: boolean;
}) {
  const [accent, setAccent] = useState(accentColor);

  return (
    <form action={updatePreferences} className="flex flex-col gap-5">
      <div>
        <label className="text-xs font-semibold text-muted-strong">Accent color</label>
        <div className="flex gap-2 mt-2">
          {ACCENT_OPTIONS.map((color) => (
            <label key={color}>
              <input
                type="radio"
                name="accentColor"
                value={color}
                checked={accent === color}
                onChange={() => setAccent(color)}
                className="sr-only"
              />
              <span
                className="block w-8 h-8 rounded-full cursor-pointer"
                style={{
                  background: color,
                  outline: accent === color ? `2px solid ${color}` : "none",
                  outlineOffset: 2,
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-strong">Density</label>
        <select
          name="density"
          defaultValue={density}
          className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-strong">
        <input name="showGamification" type="checkbox" defaultChecked={showGamification} />
        Show gamification (streaks &amp; badges)
      </label>

      <button
        type="submit"
        className="text-white text-sm font-semibold rounded-md py-2.5 w-fit px-5"
        style={{ background: "var(--accent)" }}
      >
        Save preferences
      </button>
    </form>
  );
}
