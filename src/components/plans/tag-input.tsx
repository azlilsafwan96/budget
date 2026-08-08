"use client";

import { useState } from "react";

export function TagInput({
  allTags,
  initialTags = [],
}: {
  allTags: string[];
  initialTags?: string[];
}) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions =
    input.trim().length === 0
      ? []
      : allTags.filter(
          (t) =>
            t.toLowerCase().includes(input.trim().toLowerCase()) &&
            !tags.includes(t.toLowerCase()),
        );

  function addTag(raw: string) {
    const name = raw.trim().toLowerCase();
    if (!name) return;
    setTags((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setInput("");
    setShowSuggestions(false);
  }

  function removeTag(name: string) {
    setTags((prev) => prev.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold text-muted-strong">Tags</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-strong bg-pill-bg px-2.5 py-[3px] rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted-strong hover:text-[color:var(--over-budget)] transition-colors leading-none"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-1.5">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          placeholder="Type a tag and press Enter"
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-transparent"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <button
                type="button"
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {tags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
    </div>
  );
}
