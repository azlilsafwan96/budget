-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill: preserve currently-paid bills as paid-as-of-now, so they still
-- read as paid for the current cycle instead of flipping to unpaid on deploy.
UPDATE "Bill" SET "paidAt" = NOW() WHERE "paid" = true;

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "paid";
