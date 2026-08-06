import type { CSSProperties } from "react";

export function ThemeVars({
  accentColor,
  density,
  children,
}: {
  accentColor: string;
  density: "comfortable" | "compact";
  children: React.ReactNode;
}) {
  const style = {
    "--accent": accentColor,
    "--row-gap": density === "compact" ? "14px" : "20px",
    "--row-pad": density === "compact" ? "9px" : "15px",
  } as CSSProperties;

  return (
    <div style={style} data-density={density}>
      {children}
    </div>
  );
}
