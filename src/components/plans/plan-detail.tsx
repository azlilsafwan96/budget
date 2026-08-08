"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/currency";
import { PlanItemRow } from "@/components/plans/plan-item-row";
import { AddPlanItem } from "@/components/plans/add-plan-item";

type Item = { id: string; name: string; amount: number; bought: boolean; tags: string[] };

export function PlanDetail({
  planId,
  planName,
  planDescription,
  items,
  allTags,
}: {
  planId: string;
  planName: string;
  planDescription: string | null;
  items: Item[];
  allTags: string[];
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tagsInPlan = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) return items;
    return items.filter((i) => selectedTags.every((t) => i.tags.includes(t)));
  }, [items, selectedTags]);

  const filteredTotal = filteredItems.reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <Link
        href="/plans"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted no-underline transition-colors hover:text-foreground w-fit"
      >
        ← Back to plans
      </Link>

      <div className="flex justify-between items-end flex-wrap gap-4 mt-4">
        <div>
          <div className="text-2xl md:text-[28px] font-bold tracking-tight">{planName}</div>
          {planDescription && (
            <div className="text-sm mt-1 text-muted max-w-prose">{planDescription}</div>
          )}
        </div>
        <AddPlanItem planId={planId} allTags={allTags} />
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6 max-w-2xl">
        <div className="text-[13px] font-semibold text-muted">
          {selectedTags.length > 0 ? "Filtered total" : "Total"}
        </div>
        <div className="text-[32px] font-bold mt-2.5 tabular-nums">{fmt(filteredTotal)}</div>
        <div className="text-[13px] mt-1 text-muted">
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
        </div>

        {tagsInPlan.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tagsInPlan.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="text-[11.5px] font-semibold px-2.5 py-[5px] rounded-full transition-colors cursor-pointer"
                  style={{
                    background: isSelected ? "var(--foreground)" : "var(--pill-bg)",
                    color: isSelected ? "white" : "var(--muted-strong)",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6 max-w-2xl">
        <div className="flex flex-col">
          {filteredItems.length === 0 && (
            <div className="text-sm text-muted py-2">
              {items.length === 0 ? "No items yet." : "No items match the selected tags."}
            </div>
          )}
          {filteredItems.map((item) => (
            <PlanItemRow
              key={item.id}
              id={item.id}
              planId={planId}
              name={item.name}
              amount={item.amount}
              amountLabel={fmt(item.amount)}
              bought={item.bought}
              tags={item.tags}
              allTags={allTags}
            />
          ))}
        </div>
      </div>
    </>
  );
}
