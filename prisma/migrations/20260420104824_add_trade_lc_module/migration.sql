-- CreateEnum
CREATE TYPE "TradeOrderType" AS ENUM ('EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "TradeOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'AT_CUSTOMS', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TradeShipmentStatus" AS ENUM ('PENDING', 'BOOKING_CONFIRMED', 'IN_TRANSIT', 'AT_PORT', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LCType" AS ENUM ('SIGHT', 'USANCE', 'RED_CLAUSE', 'REVOLVING', 'STANDBY', 'TRANSFERABLE');

-- CreateEnum
CREATE TYPE "LCStatus" AS ENUM ('DRAFT', 'ISSUED', 'ADVISED', 'CONFIRMED', 'ACTIVE', 'AMENDED', 'PARTIALLY_UTILIZED', 'FULLY_UTILIZED', 'EXPIRED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LCPaymentMode" AS ENUM ('AT_SIGHT', 'USANCE_30', 'USANCE_60', 'USANCE_90', 'USANCE_120', 'USANCE_180', 'DEFERRED');

-- CreateEnum
CREATE TYPE "LCDrawdownStatus" AS ENUM ('DRAFT', 'DOCUMENTS_SUBMITTED', 'DOCUMENTS_ACCEPTED', 'PAYMENT_RECEIVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TradePaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "TradeOrderType" NOT NULL,
    "status" "TradeOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT,
    "supplierId" TEXT,
    "contractRef" TEXT,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "totalValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "exchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "localValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "incoterms" TEXT,
    "latestShipDate" DATE,
    "expectedArrival" DATE,
    "goodsDescription" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeOrderItem" (
    "id" TEXT NOT NULL,
    "tradeOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "hsCode" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "TradeOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeShipment" (
    "id" TEXT NOT NULL,
    "tradeOrderId" TEXT NOT NULL,
    "status" "TradeShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "carrierName" TEXT,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "blNumber" TEXT,
    "blDate" DATE,
    "bookingRef" TEXT,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "etd" DATE,
    "eta" DATE,
    "actualDeparture" DATE,
    "actualArrival" DATE,
    "containerNumbers" TEXT,
    "sealNumbers" TEXT,
    "grossWeight" DECIMAL(18,4),
    "netWeight" DECIMAL(18,4),
    "volume" DECIMAL(18,4),
    "packages" INTEGER,
    "freightCost" DECIMAL(18,4),
    "insuranceCost" DECIMAL(18,4),
    "notes" TEXT,
    "customsClearedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LetterOfCredit" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "tradeOrderId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "LCType" NOT NULL DEFAULT 'SIGHT',
    "status" "LCStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentMode" "LCPaymentMode" NOT NULL DEFAULT 'AT_SIGHT',
    "applicantName" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "issuingBank" TEXT NOT NULL,
    "issuingBankSwift" TEXT,
    "advisingBank" TEXT,
    "advisingBankSwift" TEXT,
    "confirmingBank" TEXT,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "lcAmount" DECIMAL(18,4) NOT NULL,
    "tolerancePlus" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "toleranceMinus" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "utilizedAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "availableAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "issueDate" DATE NOT NULL,
    "expiryDate" DATE NOT NULL,
    "expiryPlace" TEXT,
    "latestShipDate" DATE,
    "presentationDays" INTEGER NOT NULL DEFAULT 21,
    "partialShipment" BOOLEAN NOT NULL DEFAULT false,
    "transhipmentAllowed" BOOLEAN NOT NULL DEFAULT false,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "goodsDescription" TEXT,
    "specialConditions" TEXT,
    "swiftMt700Ref" TEXT,
    "issuedById" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LetterOfCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LCAmendment" (
    "id" TEXT NOT NULL,
    "lcId" TEXT NOT NULL,
    "amendmentNumber" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "newExpiryDate" DATE,
    "newLcAmount" DECIMAL(18,4),
    "newLatestShipDate" DATE,
    "newSpecialConditions" TEXT,
    "reason" TEXT NOT NULL,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionNote" TEXT,
    "swiftMt707Ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LCAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LCDrawdown" (
    "id" TEXT NOT NULL,
    "lcId" TEXT NOT NULL,
    "drawdownNumber" INTEGER NOT NULL,
    "status" "LCDrawdownStatus" NOT NULL DEFAULT 'DRAFT',
    "presentationDate" DATE NOT NULL,
    "documentsDueBy" DATE,
    "amount" DECIMAL(18,4) NOT NULL,
    "commercialInvoiceRef" TEXT,
    "blRef" TEXT,
    "packingListRef" TEXT,
    "certificateOfOrigin" BOOLEAN NOT NULL DEFAULT false,
    "inspectionCert" BOOLEAN NOT NULL DEFAULT false,
    "otherDocs" TEXT,
    "paymentDueDate" DATE,
    "paymentReceivedAt" DATE,
    "bankCharges" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "discrepancyNote" TEXT,
    "rejectionReason" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LCDrawdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradePayment" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "tradeOrderId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "status" "TradePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(18,4) NOT NULL,
    "exchangeRate" DECIMAL(18,6) NOT NULL,
    "localAmount" DECIMAL(18,4) NOT NULL,
    "bankName" TEXT,
    "bankReference" TEXT,
    "swiftRef" TEXT,
    "paymentDate" DATE,
    "valueDate" DATE,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TradeOrder_number_key" ON "TradeOrder"("number");

-- CreateIndex
CREATE INDEX "TradeOrder_branchId_status_idx" ON "TradeOrder"("branchId", "status");

-- CreateIndex
CREATE INDEX "TradeOrder_branchId_type_idx" ON "TradeOrder"("branchId", "type");

-- CreateIndex
CREATE INDEX "TradeOrder_createdAt_idx" ON "TradeOrder"("createdAt");

-- CreateIndex
CREATE INDEX "TradeOrderItem_tradeOrderId_idx" ON "TradeOrderItem"("tradeOrderId");

-- CreateIndex
CREATE INDEX "TradeShipment_tradeOrderId_status_idx" ON "TradeShipment"("tradeOrderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LetterOfCredit_number_key" ON "LetterOfCredit"("number");

-- CreateIndex
CREATE UNIQUE INDEX "LetterOfCredit_tradeOrderId_key" ON "LetterOfCredit"("tradeOrderId");

-- CreateIndex
CREATE INDEX "LetterOfCredit_branchId_status_idx" ON "LetterOfCredit"("branchId", "status");

-- CreateIndex
CREATE INDEX "LetterOfCredit_expiryDate_idx" ON "LetterOfCredit"("expiryDate");

-- CreateIndex
CREATE INDEX "LCAmendment_lcId_status_idx" ON "LCAmendment"("lcId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LCAmendment_lcId_amendmentNumber_key" ON "LCAmendment"("lcId", "amendmentNumber");

-- CreateIndex
CREATE INDEX "LCDrawdown_lcId_status_idx" ON "LCDrawdown"("lcId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LCDrawdown_lcId_drawdownNumber_key" ON "LCDrawdown"("lcId", "drawdownNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TradePayment_number_key" ON "TradePayment"("number");

-- CreateIndex
CREATE INDEX "TradePayment_tradeOrderId_idx" ON "TradePayment"("tradeOrderId");

-- CreateIndex
CREATE INDEX "TradePayment_branchId_status_idx" ON "TradePayment"("branchId", "status");

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrderItem" ADD CONSTRAINT "TradeOrderItem_tradeOrderId_fkey" FOREIGN KEY ("tradeOrderId") REFERENCES "TradeOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrderItem" ADD CONSTRAINT "TradeOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeShipment" ADD CONSTRAINT "TradeShipment_tradeOrderId_fkey" FOREIGN KEY ("tradeOrderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterOfCredit" ADD CONSTRAINT "LetterOfCredit_tradeOrderId_fkey" FOREIGN KEY ("tradeOrderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterOfCredit" ADD CONSTRAINT "LetterOfCredit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LCAmendment" ADD CONSTRAINT "LCAmendment_lcId_fkey" FOREIGN KEY ("lcId") REFERENCES "LetterOfCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LCDrawdown" ADD CONSTRAINT "LCDrawdown_lcId_fkey" FOREIGN KEY ("lcId") REFERENCES "LetterOfCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradePayment" ADD CONSTRAINT "TradePayment_tradeOrderId_fkey" FOREIGN KEY ("tradeOrderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradePayment" ADD CONSTRAINT "TradePayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
