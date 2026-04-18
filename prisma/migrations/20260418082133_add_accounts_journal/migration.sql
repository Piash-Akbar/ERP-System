-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "SystemAccountKey" AS ENUM ('CASH', 'BANK_DEFAULT', 'AR_CONTROL', 'AP_CONTROL', 'INVENTORY', 'COGS', 'SALES_REVENUE', 'SALES_RETURNS', 'DISCOUNT_GIVEN', 'TAX_PAYABLE', 'TAX_RECOVERABLE', 'PURCHASE_EXPENSE', 'FX_GAIN', 'FX_LOSS', 'RETAINED_EARNINGS', 'OPENING_BALANCE_EQUITY', 'ROUNDING');

-- CreateTable
CREATE TABLE "SystemAccountMapping" (
    "id" TEXT NOT NULL,
    "key" "SystemAccountKey" NOT NULL,
    "branchId" TEXT,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemAccountMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "reference" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceModule" TEXT,
    "sourceRefType" TEXT,
    "sourceRefId" TEXT,
    "reversesId" TEXT,
    "totalDebit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalCredit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "postedById" TEXT,
    "postedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntryLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "fxRate" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "costCenter" TEXT,
    "memo" TEXT,

    CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemAccountMapping_accountId_idx" ON "SystemAccountMapping"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemAccountMapping_key_branchId_key" ON "SystemAccountMapping"("key", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_number_key" ON "JournalEntry"("number");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_reversesId_key" ON "JournalEntry"("reversesId");

-- CreateIndex
CREATE INDEX "JournalEntry_branchId_date_idx" ON "JournalEntry"("branchId", "date");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalEntry_periodId_idx" ON "JournalEntry"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_sourceModule_sourceRefType_sourceRefId_key" ON "JournalEntry"("sourceModule", "sourceRefType", "sourceRefId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_entryId_idx" ON "JournalEntryLine"("entryId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_accountId_idx" ON "JournalEntryLine"("accountId");

-- AddForeignKey
ALTER TABLE "SystemAccountMapping" ADD CONSTRAINT "SystemAccountMapping_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_reversesId_fkey" FOREIGN KEY ("reversesId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
