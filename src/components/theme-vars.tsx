import type { CSSProperties } from "react";

export function ThemeVars({
  accentColor,
  children,
}: {
  accentColor: string;
  children: React.ReactNode;
}) {
  const style = { "--accent": accentColor } as CSSProperties;

  return <div style={style}>{children}</div>;
}
