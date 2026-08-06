import { getCurrentUser } from "@/lib/dal";
import { ThemeVars } from "@/components/theme-vars";
import { TopNav } from "@/components/top-nav";
import { logout } from "@/lib/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <ThemeVars accentColor={user.accentColor} density={user.density}>
      <div
        className="min-h-screen"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="max-w-[1360px] mx-auto flex flex-col gap-7 px-12 pt-11 pb-20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TopNav />
            <form action={logout}>
              <button
                type="submit"
                className="text-[13px] font-semibold px-3 py-2 rounded-lg"
                style={{ color: "var(--muted)" }}
              >
                Log out
              </button>
            </form>
          </div>
          {children}
        </div>
      </div>
    </ThemeVars>
  );
}
