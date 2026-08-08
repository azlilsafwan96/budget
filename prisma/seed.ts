import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "aiman@example.com" },
    update: {},
    create: {
      email: "aiman@example.com",
      passwordHash,
      name: "Aiman",
      accentColor: "#2f9e6e",
      showGamification: true,
    },
  });

  const categoryDefs = [
    { name: "Groceries", monthlyLimit: 90000 },
    { name: "Dining Out", monthlyLimit: 35000 },
    { name: "Transport", monthlyLimit: 40000 },
    { name: "Entertainment", monthlyLimit: 20000 },
    { name: "Utilities", monthlyLimit: 35000 },
    { name: "Shopping", monthlyLimit: 60000 },
  ];

  const categories = new Map<string, string>();
  for (const c of categoryDefs) {
    const category = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: c.name } },
      update: { monthlyLimit: c.monthlyLimit },
      create: { userId: user.id, name: c.name, monthlyLimit: c.monthlyLimit },
    });
    categories.set(c.name, category.id);
  }

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.bill.deleteMany({ where: { userId: user.id } });

  const transactionDefs = [
    { merchant: "Village Grocer", category: "Groceries", date: "2026-08-04", amount: 8640 },
    { merchant: "Grab", category: "Transport", date: "2026-08-04", amount: 1850 },
    { merchant: "Netflix", category: "Entertainment", date: "2026-08-03", amount: 4500 },
    { merchant: "Din Tai Fung", category: "Dining Out", date: "2026-08-02", amount: 11200 },
    { merchant: "TNB", category: "Utilities", date: "2026-08-01", amount: 18930 },
    { merchant: "Zara", category: "Shopping", date: "2026-07-31", amount: 24500 },
  ];

  for (const t of transactionDefs) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: categories.get(t.category)!,
        merchant: t.merchant,
        amount: t.amount,
        date: new Date(t.date),
      },
    });
  }

  const billDefs = [
    { name: "Rent", amount: 180000, dueDay: 1, autopay: false, paidAt: new Date() },
    { name: "Internet (Unifi)", amount: 12900, dueDay: 10, autopay: true },
    { name: "Car Insurance", amount: 9500, dueDay: 15, autopay: true },
    { name: "Netflix", amount: 4500, dueDay: 20, autopay: true },
  ];

  for (const b of billDefs) {
    await prisma.bill.create({ data: { ...b, userId: user.id } });
  }

  await prisma.savingsGoal.upsert({
    where: { id: `${user.id}-emergency-fund` },
    update: {},
    create: {
      id: `${user.id}-emergency-fund`,
      userId: user.id,
      name: "Emergency Fund",
      targetAmount: 1000000,
      currentAmount: 680000,
    },
  });

  const today = new Date("2026-08-05");
  const activeOffsets = [0, 1, 2, 4, 5, 6]; // matches design's [true,true,true,false,true,true,true] pattern (day 3 skipped)
  for (const offset of activeOffsets) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    await prisma.streakLog.upsert({
      where: { userId_date: { userId: user.id, date: d } },
      update: {},
      create: { userId: user.id, date: d },
    });
  }

  console.log(`Seeded user ${user.email} (password: password123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
