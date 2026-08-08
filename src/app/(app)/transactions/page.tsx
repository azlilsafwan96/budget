import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/currency";
import { TransactionRow } from "@/components/transactions/transaction-row";

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="text-[28px] font-bold tracking-tight">Transactions</div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 mt-6 max-w-2xl">
        <div className="flex flex-col">
          {transactions.length === 0 && (
            <div className="text-sm text-muted py-2">No transactions yet.</div>
          )}
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              id={tx.id}
              merchant={tx.merchant}
              category={tx.category?.name ?? "Uncategorized"}
              date={tx.date.toLocaleDateString("en-MY", { month: "short", day: "numeric" })}
              amountLabel={fmt(tx.amount)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
