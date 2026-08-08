function IconBase({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M3 11 12 3l9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </IconBase>
  );
}

export function TransactionsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </IconBase>
  );
}

export function BillsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </IconBase>
  );
}

export function PlansIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <polyline points="7.5,8 8.5,9 10.5,7" />
      <line x1="12.5" y1="8" x2="17" y2="8" />
      <polyline points="7.5,14 8.5,15 10.5,13" />
      <line x1="12.5" y1="14" x2="17" y2="14" />
    </IconBase>
  );
}

export function HistoryIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="7" x2="12" y2="12" />
      <line x1="12" y1="12" x2="15.5" y2="14" />
    </IconBase>
  );
}

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="15" cy="6" r="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="9" cy="12" r="2" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="13" cy="18" r="2" />
    </IconBase>
  );
}
