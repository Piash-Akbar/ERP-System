-- CreateEnum
CREATE TYPE "CorporateQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "CorporateOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'INVOICED', 'CLOSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CorporateDeliveryStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'DELIVERED', 'VOIDED');

-- CreateEnum
CREATE TYPE "CorporateInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOIDED');

-- CreateTable
CREATE TABLE "CorporateQuote" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesRepId" TEXT,
    "quoteDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "currency" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "subtotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "CorporateQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "rejectReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateQuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT,
    "unit" "UnitOfMeasure" NOT NULL DEFAULT 'PCS',
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "CorporateQuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteId" TEXT,
    "salesRepId" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NET_30',
    "currency" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "subtotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "CorporateOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "cancelReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT,
    "unit" "UnitOfMeasure" NOT NULL DEFAULT 'PCS',
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,4) NOT NULL,
    "deliveredQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "invoicedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "CorporateOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateDelivery" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CorporateDeliveryStatus" NOT NULL DEFAULT 'DELIVERED',
    "trackingNo" TEXT,
    "carrier" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateDeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "CorporateDeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "currency" "CurrencyCode" NOT NULL DEFAULT 'BDT',
    "subtotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "paidTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "CorporateInvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateInvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "CorporateInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateInvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" "PosPaymentMethod" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateInvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorporateQuote_number_key" ON "CorporateQuote"("number");

-- CreateIndex
CREATE INDEX "CorporateQuote_branchId_status_quoteDate_idx" ON "CorporateQuote"("branchId", "status", "quoteDate");

-- CreateIndex
CREATE INDEX "CorporateQuote_customerId_quoteDate_idx" ON "CorporateQuote"("customerId", "quoteDate");

-- CreateIndex
CREATE INDEX "CorporateQuoteItem_quoteId_idx" ON "CorporateQuoteItem"("quoteId");

-- CreateIndex
CREATE INDEX "CorporateQuoteItem_productId_idx" ON "CorporateQuoteItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateOrder_number_key" ON "CorporateOrder"("number");

-- CreateIndex
CREATE INDEX "CorporateOrder_branchId_status_orderDate_idx" ON "CorporateOrder"("branchId", "status", "orderDate");

-- CreateIndex
CREATE INDEX "CorporateOrder_customerId_orderDate_idx" ON "CorporateOrder"("customerId", "orderDate");

-- CreateIndex
CREATE INDEX "CorporateOrderItem_orderId_idx" ON "CorporateOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "CorporateOrderItem_productId_idx" ON "CorporateOrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateDelivery_number_key" ON "CorporateDelivery"("number");

-- CreateIndex
CREATE INDEX "CorporateDelivery_branchId_deliveryDate_idx" ON "CorporateDelivery"("branchId", "deliveryDate");

-- CreateIndex
CREATE INDEX "CorporateDelivery_orderId_idx" ON "CorporateDelivery"("orderId");

-- CreateIndex
CREATE INDEX "CorporateDeliveryItem_deliveryId_idx" ON "CorporateDeliveryItem"("deliveryId");

-- CreateIndex
CREATE INDEX "CorporateDeliveryItem_orderItemId_idx" ON "CorporateDeliveryItem"("orderItemId");

-- CreateIndex
CREATE INDEX "CorporateDeliveryItem_productId_idx" ON "CorporateDeliveryItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateInvoice_number_key" ON "CorporateInvoice"("number");

-- CreateIndex
CREATE INDEX "CorporateInvoice_branchId_status_invoiceDate_idx" ON "CorporateInvoice"("branchId", "status", "invoiceDate");

-- CreateIndex
CREATE INDEX "CorporateInvoice_customerId_invoiceDate_idx" ON "CorporateInvoice"("customerId", "invoiceDate");

-- CreateIndex
CREATE INDEX "CorporateInvoice_orderId_idx" ON "CorporateInvoice"("orderId");

-- CreateIndex
CREATE INDEX "CorporateInvoice_dueDate_idx" ON "CorporateInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "CorporateInvoiceItem_invoiceId_idx" ON "CorporateInvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "CorporateInvoiceItem_orderItemId_idx" ON "CorporateInvoiceItem"("orderItemId");

-- CreateIndex
CREATE INDEX "CorporateInvoicePayment_invoiceId_idx" ON "CorporateInvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "CorporateInvoicePayment_method_idx" ON "CorporateInvoicePayment"("method");

-- AddForeignKey
ALTER TABLE "CorporateQuote" ADD CONSTRAINT "CorporateQuote_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateQuote" ADD CONSTRAINT "CorporateQuote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateQuoteItem" ADD CONSTRAINT "CorporateQuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "CorporateQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateQuoteItem" ADD CONSTRAINT "CorporateQuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateOrder" ADD CONSTRAINT "CorporateOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateOrder" ADD CONSTRAINT "CorporateOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateOrder" ADD CONSTRAINT "CorporateOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateOrder" ADD CONSTRAINT "CorporateOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "CorporateQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateOrderItem" ADD CONSTRAINT "CorporateOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CorporateOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateOrderItem" ADD CONSTRAINT "CorporateOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateDelivery" ADD CONSTRAINT "CorporateDelivery_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateDelivery" ADD CONSTRAINT "CorporateDelivery_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateDelivery" ADD CONSTRAINT "CorporateDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CorporateOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateDeliveryItem" ADD CONSTRAINT "CorporateDeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "CorporateDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateDeliveryItem" ADD CONSTRAINT "CorporateDeliveryItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "CorporateOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateDeliveryItem" ADD CONSTRAINT "CorporateDeliveryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoice" ADD CONSTRAINT "CorporateInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoice" ADD CONSTRAINT "CorporateInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoice" ADD CONSTRAINT "CorporateInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CorporateOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoiceItem" ADD CONSTRAINT "CorporateInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "CorporateInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoiceItem" ADD CONSTRAINT "CorporateInvoiceItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "CorporateOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoiceItem" ADD CONSTRAINT "CorporateInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateInvoicePayment" ADD CONSTRAINT "CorporateInvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "CorporateInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
