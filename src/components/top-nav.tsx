"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/bills", label: "Bills" },
  { href: "/plans", label: "Plans" },
  { href: "/history", label: "History" },
  { href: "/settings/categories", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex gap-1.5 bg-surface border border-border rounded-[10px] p-[5px] w-fit max-w-full overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-[13px] font-semibold px-3 sm:px-4 py-2 rounded-[7px] no-underline whitespace-nowrap transition-colors ${
              isActive ? "" : "hover:bg-black/5"
            }`}
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
