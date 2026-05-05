-- CreateEnum
CREATE TYPE "ProductionMaterialType" AS ENUM ('LEATHER', 'ACCESSORY', 'OTHER');

-- AlterTable
ALTER TABLE "CorporateInvoiceItem" ADD COLUMN     "colorDesign" TEXT;

-- AlterTable
ALTER TABLE "ProductionMaterial" ADD COLUMN     "materialType" "ProductionMaterialType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "unitCost" DECIMAL(18,4);

-- AlterTable
ALTER TABLE "ProductionOrder" ADD COLUMN     "batchName" TEXT,
ADD COLUMN     "buyerName" TEXT,
ADD COLUMN     "saleAmount" DECIMAL(18,4);
