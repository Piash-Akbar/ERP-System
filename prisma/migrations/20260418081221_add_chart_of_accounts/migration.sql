-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountNormalSide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "ChartAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "normalSide" "AccountNormalSide" NOT NULL,
    "parentId" TEXT,
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "isPosting" BOOLEAN NOT NULL DEFAULT true,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "branchId" TEXT,
    "openingBalance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChartAccount_code_key" ON "ChartAccount"("code");

-- CreateIndex
CREATE INDEX "ChartAccount_type_idx" ON "ChartAccount"("type");

-- CreateIndex
CREATE INDEX "ChartAccount_parentId_idx" ON "ChartAccount"("parentId");

-- CreateIndex
CREATE INDEX "ChartAccount_path_idx" ON "ChartAccount"("path");

-- CreateIndex
CREATE INDEX "ChartAccount_branchId_idx" ON "ChartAccount"("branchId");

-- CreateIndex
CREATE INDEX "ChartAccount_isActive_idx" ON "ChartAccount"("isActive");

-- AddForeignKey
ALTER TABLE "ChartAccount" ADD CONSTRAINT "ChartAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartAccount" ADD CONSTRAINT "ChartAccount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
