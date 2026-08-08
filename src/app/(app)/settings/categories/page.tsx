import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { CategoryList } from "@/components/settings/category-list";

export default async function CategorySettingsPage() {
  const user = await getCurrentUser();
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div className="text-2xl md:text-[28px] font-bold tracking-tight">Settings</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mt-6">
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
          <div className="text-[15px] font-semibold mb-4">Preferences</div>
          <PreferencesForm
            accentColor={user.accentColor}
            showGamification={user.showGamification}
            cycleStartDay={user.cycleStartDay}
          />
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
          <div className="text-[15px] font-semibold mb-4">Budget categories</div>
          <CategoryList
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              monthlyLimit: c.monthlyLimit,
            }))}
          />
        </div>
      </div>
    </>
  );
}
