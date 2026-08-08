import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getCurrentCycleWindow } from "@/lib/cycle";
import { AddBill } from "@/components/bills/add-bill";
import { BillRow } from "@/components/bills/bill-row";

export default async function BillsPage() {
  const user = await getCurrentUser();
  const bills = await prisma.bill.findMany({
    where: { userId: user.id },
    orderBy: { dueDay: "asc" },
  });
  const { start: cycleStart } = getCurrentCycleWindow(user.cycleStartDay);

  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="text-2xl md:text-[28px] font-bold tracking-tight">Bills</div>
        <AddBill />
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6 max-w-2xl">
        <div className="flex flex-col">
          {bills.length === 0 && <div className="text-sm text-muted py-2">No bills yet.</div>}
          {bills.map((bill) => (
            <BillRow
              key={bill.id}
              id={bill.id}
              name={bill.name}
              amount={bill.amount}
              dueDay={bill.dueDay}
              autopay={bill.autopay}
              paid={bill.paidAt !== null && bill.paidAt >= cycleStart}
            />
          ))}
        </div>
      </div>
    </>
  );
}
