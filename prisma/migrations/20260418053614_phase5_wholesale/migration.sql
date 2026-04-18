-- CreateEnum
CREATE TYPE "WholesaleInvoiceStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOIDED', 'PARTIALLY_RETURNED', 'RETURNED');

-- CreateEnum
CREATE TYPE "WholesaleReturnStatus" AS ENUM ('COMPLETED', 'VOIDED');

-- CreateTable
CREATE TABLE "WholesaleInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesRepId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "currency" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "subtotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "paidTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "WholesaleInvoiceStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleInvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT,
    "unit" "UnitOfMeasure" NOT NULL DEFAULT 'PCS',
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,4) NOT NULL,
    "returnedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "WholesaleInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesalePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" "PosPaymentMethod" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WholesalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleReturn" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "refundToBalance" BOOLEAN NOT NULL DEFAULT true,
    "refundMethod" "PosPaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "WholesaleReturnStatus" NOT NULL DEFAULT 'COMPLETED',
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "invoiceItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "WholesaleReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleInvoice_number_key" ON "WholesaleInvoice"("number");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_branchId_status_invoiceDate_idx" ON "WholesaleInvoice"("branchId", "status", "invoiceDate");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_customerId_invoiceDate_idx" ON "WholesaleInvoice"("customerId", "invoiceDate");

-- CreateIndex
CREATE INDEX "WholesaleInvoice_dueDate_idx" ON "WholesaleInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "WholesaleInvoiceItem_invoiceId_idx" ON "WholesaleInvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "WholesaleInvoiceItem_productId_idx" ON "WholesaleInvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "WholesalePayment_invoiceId_idx" ON "WholesalePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "WholesalePayment_method_idx" ON "WholesalePayment"("method");

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleReturn_number_key" ON "WholesaleReturn"("number");

-- CreateIndex
CREATE INDEX "WholesaleReturn_branchId_returnDate_idx" ON "WholesaleReturn"("branchId", "returnDate");

-- CreateIndex
CREATE INDEX "WholesaleReturn_invoiceId_idx" ON "WholesaleReturn"("invoiceId");

-- CreateIndex
CREATE INDEX "WholesaleReturnItem_returnId_idx" ON "WholesaleReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "WholesaleReturnItem_invoiceItemId_idx" ON "WholesaleReturnItem"("invoiceItemId");

-- CreateIndex
CREATE INDEX "WholesaleReturnItem_productId_idx" ON "WholesaleReturnItem"("productId");

-- AddForeignKey
ALTER TABLE "WholesaleInvoice" ADD CONSTRAINT "WholesaleInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleInvoice" ADD CONSTRAINT "WholesaleInvoice_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleInvoice" ADD CONSTRAINT "WholesaleInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleInvoiceItem" ADD CONSTRAINT "WholesaleInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "WholesaleInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleInvoiceItem" ADD CONSTRAINT "WholesaleInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesalePayment" ADD CONSTRAINT "WholesalePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "WholesaleInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleReturn" ADD CONSTRAINT "WholesaleReturn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleReturn" ADD CONSTRAINT "WholesaleReturn_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleReturn" ADD CONSTRAINT "WholesaleReturn_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "WholesaleInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleReturnItem" ADD CONSTRAINT "WholesaleReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "WholesaleReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleReturnItem" ADD CONSTRAINT "WholesaleReturnItem_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "WholesaleInvoiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleReturnItem" ADD CONSTRAINT "WholesaleReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
