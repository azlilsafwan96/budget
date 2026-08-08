"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  TransactionsIcon,
  BillsIcon,
  PlansIcon,
  HistoryIcon,
  SettingsIcon,
} from "@/components/icons";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: DashboardIcon },
  { href: "/transactions", label: "Transactions", Icon: TransactionsIcon },
  { href: "/bills", label: "Bills", Icon: BillsIcon },
  { href: "/plans", label: "Plans", Icon: PlansIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/settings/categories", label: "Settings", Icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-surface border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const color = isActive ? "var(--accent)" : "var(--muted)";
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 no-underline transition-colors"
            style={{ color }}
          >
            <tab.Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
