import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/currency";
import { AddBill } from "@/components/bills/add-bill";
import { BillRow } from "@/components/bills/bill-row";

export default async function BillsPage() {
  const user = await getCurrentUser();
  const bills = await prisma.bill.findMany({
    where: { userId: user.id },
    orderBy: { dueDay: "asc" },
  });

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
              due={`Day ${bill.dueDay}`}
              amountLabel={fmt(bill.amount)}
              paid={bill.paid}
              statusLabel={bill.paid ? "Paid" : bill.autopay ? "Autopay" : "Manual"}
            />
          ))}
        </div>
      </div>
    </>
  );
}
