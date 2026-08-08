import { getCurrentUser } from "@/lib/dal";
import { ThemeVars } from "@/components/theme-vars";
import { TopNav } from "@/components/top-nav";
import { logout } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <ThemeVars accentColor={user.accentColor}>
      <div
        className="min-h-screen"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="max-w-[1360px] mx-auto flex flex-col gap-5 md:gap-7 px-4 sm:px-6 md:px-12 pt-6 md:pt-11 pb-10 md:pb-20">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <TopNav />
            <form action={logout}>
              <SubmitButton
                pendingText="Logging out…"
                className="inline-flex items-center gap-2 text-[13px] font-semibold px-3 py-2 rounded-lg transition-colors hover:not-disabled:bg-black/5 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                Log out
              </SubmitButton>
            </form>
          </div>
          {children}
        </div>
      </div>
    </ThemeVars>
  );
}
