-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('BANK', 'CASH', 'INVESTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "accounts"
ALTER COLUMN "type" TYPE "AccountType"
USING "type"::"AccountType";

ALTER TABLE "accounts"
ALTER COLUMN "type" SET NOT NULL;

-- AlterForeignKey
ALTER TABLE "transactions"
DROP CONSTRAINT "transactions_accountId_fkey";

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_accountId_fkey"
FOREIGN KEY ("accountId")
REFERENCES "accounts"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
