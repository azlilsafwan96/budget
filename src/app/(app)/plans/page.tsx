import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/currency";
import { AddPlan } from "@/components/plans/add-plan";
import { PlanRow } from "@/components/plans/plan-row";

export default async function PlansPage() {
  const user = await getCurrentUser();
  const plans = await prisma.plan.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="text-2xl md:text-[28px] font-bold tracking-tight">Plans</div>
        <AddPlan />
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6 max-w-2xl">
        <div className="flex flex-col">
          {plans.length === 0 && <div className="text-sm text-muted py-2">No plans yet.</div>}
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              id={plan.id}
              name={plan.name}
              description={plan.description}
              itemCount={plan.items.length}
              totalLabel={fmt(plan.items.reduce((sum, i) => sum + i.amount, 0))}
            />
          ))}
        </div>
      </div>
    </>
  );
}
