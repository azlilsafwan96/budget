import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PlanDetail } from "@/components/plans/plan-detail";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [plan, allTags] = await Promise.all([
    prisma.plan.findFirst({
      where: { id, userId: user.id },
      include: { items: { include: { tags: true }, orderBy: { createdAt: "desc" } } },
    }),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  if (!plan) notFound();

  return (
    <PlanDetail
      planId={plan.id}
      planName={plan.name}
      planDescription={plan.description}
      items={plan.items.map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        bought: item.bought,
        tags: item.tags.map((t) => t.name),
      }))}
      allTags={allTags.map((t) => t.name)}
    />
  );
}
