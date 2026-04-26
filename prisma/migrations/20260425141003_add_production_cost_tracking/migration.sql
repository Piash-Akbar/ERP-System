-- CreateEnum
CREATE TYPE "ProductionCostType" AS ENUM ('OVERHEAD', 'WEDGE', 'LABOUR');

-- AlterTable
ALTER TABLE "ProductionOrder" ADD COLUMN     "overheadRate" DECIMAL(7,4);

-- CreateTable
CREATE TABLE "ProductionCostEntry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "ProductionCostType" NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "hours" DECIMAL(10,4),
    "rate" DECIMAL(18,4),
    "amount" DECIMAL(18,4) NOT NULL,
    "note" VARCHAR(500),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionCostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionCostEntry_orderId_type_idx" ON "ProductionCostEntry"("orderId", "type");

-- CreateIndex
CREATE INDEX "ProductionCostEntry_createdAt_idx" ON "ProductionCostEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductionCostEntry" ADD CONSTRAINT "ProductionCostEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
