"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bills", label: "Bills" },
  { href: "/settings/categories", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1.5 bg-surface border border-border rounded-[10px] p-[5px] w-fit">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-[13px] font-semibold px-4 py-2 rounded-[7px] no-underline"
            style={{
              color: isActive ? "white" : "var(--muted)",
              background: isActive ? "var(--foreground)" : "transparent",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
