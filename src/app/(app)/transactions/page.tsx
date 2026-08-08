import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TransactionRow } from "@/components/transactions/transaction-row";

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="text-2xl md:text-[28px] font-bold tracking-tight">Transactions</div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mt-6 max-w-2xl">
        <div className="flex flex-col">
          {transactions.length === 0 && (
            <div className="text-sm text-muted py-2">No transactions yet.</div>
          )}
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              id={tx.id}
              merchant={tx.merchant}
              categoryId={tx.categoryId}
              categories={categories}
              dateISO={tx.date.toISOString().slice(0, 10)}
              amount={tx.amount}
            />
          ))}
        </div>
      </div>
    </>
  );
}
