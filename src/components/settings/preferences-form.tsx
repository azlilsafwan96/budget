"use client";

import { useState } from "react";
import { updatePreferences } from "@/lib/actions/settings";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

const ACCENT_OPTIONS = ["#2f9e6e", "#3b6fd6", "#7a5cd6", "#1f9b96"];

export function PreferencesForm({
  accentColor,
  showGamification,
  cycleStartDay,
}: {
  accentColor: string;
  showGamification: boolean;
  cycleStartDay: number;
}) {
  const [accent, setAccent] = useState(accentColor);
  const { showToast } = useToast();

  async function handleSubmit(formData: FormData) {
    await updatePreferences(formData);
    showToast("Preferences saved");
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
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
                className="block w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110"
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
        <label className="text-xs font-semibold text-muted-strong">Budget cycle start day</label>
        <input
          type="number"
          name="cycleStartDay"
          min="1"
          max="31"
          defaultValue={cycleStartDay}
          className="w-full mt-1 border border-border rounded-md px-3 py-2 text-sm bg-transparent"
        />
        <div className="text-xs mt-1 text-muted">
          Day of month your salary/budget cycle begins. Use 1 for a standard calendar month.
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-strong">
        <input name="showGamification" type="checkbox" defaultChecked={showGamification} />
        Show gamification (streaks &amp; badges)
      </label>

      <SubmitButton
        pendingText="Saving…"
        className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-md py-2.5 w-fit px-5 transition disabled:cursor-not-allowed hover:not-disabled:brightness-90"
        style={{ background: "var(--accent)" }}
      >
        Save preferences
      </SubmitButton>
    </form>
  );
}
