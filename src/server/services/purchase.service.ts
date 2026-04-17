import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type {
  RequisitionCreateInput,
  RequisitionDecisionInput,
  PurchaseOrderCreateInput,
  GrnCreateInput,
  InvoiceCreateInput,
} from '@/server/validators/purchase';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { nextDocumentNumber } from '@/lib/document-number';

function computeLineTotal(
  qty: Prisma.Decimal,
  price: Prisma.Decimal,
  taxRate: Prisma.Decimal,
  discountRate: Prisma.Decimal,
) {
  const gross = qty.mul(price);
  const discount = gross.mul(discountRate).div(100);
  const afterDiscount = gross.minus(discount);
  const tax = afterDiscount.mul(taxRate).div(100);
  return { gross, discount, tax, total: afterDiscount.plus(tax) };
}

export const purchaseService = {
  // ─── PR ────────────────────────────────────────────────────────────────────
  async listRequisitions(
    session: AppSession | null,
    filters: { branchId?: string; status?: string } = {},
  ) {
    await authorize(session, 'purchase:read');
    return prisma.purchaseRequisition.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as
          | 'DRAFT'
          | 'PENDING'
          | 'APPROVED'
          | 'REJECTED'
          | 'CANCELLED'
          | 'CLOSED'
          | undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { select: { id: true } },
      },
    });
  },

  async getRequisition(session: AppSession | null, id: string) {
    await authorize(session, 'purchase:read');
    const pr = await prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, currency: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
        },
        purchaseOrders: { select: { id: true, number: true, status: true } },
      },
    });
    if (!pr) throw new NotFoundError('Requisition not found');
    return pr;
  },

  async createRequisition(session: AppSession | null, input: RequisitionCreateInput) {
    const actor = await authorize(session, 'purchase:write');

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const yearCount = await tx.purchaseRequisition.count({
        where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      });
      const number = nextDocumentNumber('PR', year, yearCount);

      const pr = await tx.purchaseRequisition.create({
        data: {
          branchId: input.branchId,
          number,
          department: input.department,
          requestedBy: input.requestedBy,
          priority: input.priority,
          status: 'PENDING',
          requiredDate: input.requiredDate,
          notes: input.notes || null,
          createdById: actor.userId,
          items: {
            create: input.items.map((it) => ({
              productId: it.productId || null,
              productName: it.productName,
              unit: it.unit,
              quantity: new Prisma.Decimal(it.quantity),
              estimatedPrice: new Prisma.Decimal(it.estimatedPrice),
              note: it.note || null,
            })),
          },
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: pr.branchId,
          module: 'purchase',
          action: 'requisition.create',
          entityType: 'PurchaseRequisition',
          entityId: pr.id,
          after: {
            number,
            department: pr.department,
            priority: pr.priority,
            itemCount: input.items.length,
          },
        },
        tx,
      );

      return pr;
    });
  },

  async decideRequisition(session: AppSession | null, input: RequisitionDecisionInput) {
    const actor = await authorize(
      session,
      input.decision === 'APPROVE' ? 'purchase:approve' : 'purchase:write',
    );
    const existing = await prisma.purchaseRequisition.findUnique({
      where: { id: input.id },
    });
    if (!existing) throw new NotFoundError('Requisition not found');
    if (existing.status !== 'PENDING' && existing.status !== 'DRAFT') {
      throw new ValidationError(
        `Cannot ${input.decision.toLowerCase()} requisition in ${existing.status} state`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseRequisition.update({
        where: { id: input.id },
        data:
          input.decision === 'APPROVE'
            ? {
                status: 'APPROVED',
                approvedById: actor.userId,
                approvedAt: new Date(),
                rejectedReason: null,
              }
            : {
                status: 'REJECTED',
                approvedById: actor.userId,
                approvedAt: new Date(),
                rejectedReason: input.reason || 'Rejected',
              },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: updated.branchId,
          module: 'purchase',
          action: `requisition.${input.decision.toLowerCase()}`,
          entityType: 'PurchaseRequisition',
          entityId: updated.id,
          before: { status: existing.status },
          after: { status: updated.status, reason: input.reason ?? null },
        },
        tx,
      );
      return updated;
    });
  },

  // ─── PO ────────────────────────────────────────────────────────────────────
  async listPurchaseOrders(
    session: AppSession | null,
    filters: { branchId?: string; status?: string; supplierId?: string } = {},
  ) {
    await authorize(session, 'purchase:read');
    return prisma.purchaseOrder.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as
          | 'DRAFT'
          | 'PENDING'
          | 'APPROVED'
          | 'PARTIALLY_RECEIVED'
          | 'COMPLETED'
          | 'CANCELLED'
          | undefined,
        supplierId: filters.supplierId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        requisition: { select: { id: true, number: true } },
        items: { select: { id: true } },
      },
    });
  },

  async getPurchaseOrder(session: AppSession | null, id: string) {
    await authorize(session, 'purchase:read');
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, currency: true } },
        supplier: true,
        requisition: { select: { id: true, number: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
        },
        grns: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!po) throw new NotFoundError('Purchase order not found');
    return po;
  },

  async createPurchaseOrder(session: AppSession | null, input: PurchaseOrderCreateInput) {
    const actor = await authorize(session, 'purchase:write');

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const yearCount = await tx.purchaseOrder.count({
        where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      });
      const number = nextDocumentNumber('PO', year, yearCount);

      let subtotal = new Prisma.Decimal(0);
      let taxTotal = new Prisma.Decimal(0);
      let discountTotal = new Prisma.Decimal(0);
      const itemRows = input.items.map((it) => {
        const qty = new Prisma.Decimal(it.orderedQty);
        const price = new Prisma.Decimal(it.unitPrice);
        const tax = new Prisma.Decimal(it.taxRate);
        const disc = new Prisma.Decimal(it.discountRate);
        const totals = computeLineTotal(qty, price, tax, disc);
        subtotal = subtotal.plus(totals.gross);
        taxTotal = taxTotal.plus(totals.tax);
        discountTotal = discountTotal.plus(totals.discount);
        return {
          productId: it.productId,
          description: it.description || null,
          unit: it.unit,
          orderedQty: qty,
          receivedQty: new Prisma.Decimal(0),
          unitPrice: price,
          taxRate: tax,
          discountRate: disc,
          lineTotal: totals.total,
        };
      });
      const grandTotal = subtotal.minus(discountTotal).plus(taxTotal);

      const po = await tx.purchaseOrder.create({
        data: {
          branchId: input.branchId,
          number,
          supplierId: input.supplierId,
          requisitionId: input.requisitionId || null,
          status: 'PENDING',
          orderDate: input.orderDate ?? new Date(),
          deliveryDate: input.deliveryDate,
          currency: input.currency,
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          notes: input.notes || null,
          createdById: actor.userId,
          items: { create: itemRows },
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: po.branchId,
          module: 'purchase',
          action: 'po.create',
          entityType: 'PurchaseOrder',
          entityId: po.id,
          after: {
            number,
            supplierId: po.supplierId,
            grandTotal: grandTotal.toString(),
            itemCount: itemRows.length,
          },
        },
        tx,
      );

      return po;
    });
  },

  async approvePurchaseOrder(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'purchase:approve');
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Purchase order not found');
    if (existing.status !== 'PENDING' && existing.status !== 'DRAFT') {
      throw new ValidationError(`Cannot approve PO in ${existing.status} state`);
    }
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: actor.userId,
          approvedAt: new Date(),
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: po.branchId,
          module: 'purchase',
          action: 'po.approve',
          entityType: 'PurchaseOrder',
          entityId: po.id,
          before: { status: existing.status },
          after: { status: po.status },
        },
        tx,
      );
      return po;
    });
  },

  async cancelPurchaseOrder(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'purchase:write');
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Purchase order not found');
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new ValidationError(`Cannot cancel PO in ${existing.status} state`);
    }
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: po.branchId,
          module: 'purchase',
          action: 'po.cancel',
          entityType: 'PurchaseOrder',
          entityId: po.id,
          before: { status: existing.status },
        },
        tx,
      );
      return po;
    });
  },

  // ─── GRN ───────────────────────────────────────────────────────────────────
  async listGrns(session: AppSession | null) {
    await authorize(session, 'purchase:read');
    return prisma.goodsReceiving.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        purchaseOrder: { select: { id: true, number: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        items: { select: { id: true } },
      },
    });
  },

  async getGrn(session: AppSession | null, id: string) {
    await authorize(session, 'purchase:read');
    const grn = await prisma.goodsReceiving.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        purchaseOrder: true,
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true, unit: true } },
            purchaseOrderItem: { select: { id: true, orderedQty: true, receivedQty: true } },
          },
        },
      },
    });
    if (!grn) throw new NotFoundError('GRN not found');
    return grn;
  },

  async createGrn(session: AppSession | null, input: GrnCreateInput) {
    const actor = await authorize(session, 'purchase:receive');

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: input.purchaseOrderId },
      include: { items: true, supplier: true },
    });
    if (!po) throw new NotFoundError('Purchase order not found');
    if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED') {
      throw new ValidationError(`Cannot receive goods on PO in ${po.status} state`);
    }
    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse || warehouse.branchId !== po.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    const poItemById = new Map(po.items.map((i) => [i.id, i]));

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const yearCount = await tx.goodsReceiving.count({
        where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      });
      const number = nextDocumentNumber('GRN', year, yearCount);

      const grn = await tx.goodsReceiving.create({
        data: {
          branchId: po.branchId,
          number,
          purchaseOrderId: po.id,
          supplierId: po.supplierId,
          warehouseId: input.warehouseId,
          status: 'COMPLETED',
          receivedDate: input.receivedDate,
          receivedById: actor.userId,
          notes: input.notes || null,
        },
      });

      let totalReceived = 0;
      for (const item of input.items) {
        const poItem = poItemById.get(item.purchaseOrderItemId);
        if (!poItem) throw new ValidationError('Invalid PO item');
        const receivedQty = new Prisma.Decimal(item.receivedQty);
        if (receivedQty.lte(0)) continue;

        const remaining = poItem.orderedQty.minus(poItem.receivedQty);
        if (receivedQty.gt(remaining)) {
          throw new ValidationError(
            `Received qty ${receivedQty.toString()} exceeds remaining ${remaining.toString()} for product ${poItem.productId}`,
          );
        }

        await tx.goodsReceivingItem.create({
          data: {
            grnId: grn.id,
            purchaseOrderItemId: poItem.id,
            productId: poItem.productId,
            receivedQty,
            rejectedQty: new Prisma.Decimal(item.rejectedQty),
            unitCost: new Prisma.Decimal(item.unitCost),
            note: item.note || null,
          },
        });

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQty: poItem.receivedQty.plus(receivedQty) },
        });

        // Inventory ledger IN (golden rule: no inventory without GRN)
        await tx.inventoryLedger.create({
          data: {
            branchId: po.branchId,
            warehouseId: input.warehouseId,
            productId: poItem.productId,
            direction: 'IN',
            quantity: receivedQty,
            costPerUnit: new Prisma.Decimal(item.unitCost),
            refType: 'GRN',
            refId: grn.id,
            note: `${number} (${po.number})`,
            createdById: actor.userId,
          },
        });

        totalReceived += 1;
      }

      // Recompute PO status
      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      });
      const allReceived = refreshedItems.every((i) => i.receivedQty.gte(i.orderedQty));
      const anyReceived = refreshedItems.some((i) => i.receivedQty.gt(0));
      const newStatus = allReceived
        ? 'COMPLETED'
        : anyReceived
          ? 'PARTIALLY_RECEIVED'
          : po.status;
      if (newStatus !== po.status) {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: newStatus },
        });
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: po.branchId,
          module: 'purchase',
          action: 'grn.create',
          entityType: 'GoodsReceiving',
          entityId: grn.id,
          after: {
            number,
            poNumber: po.number,
            warehouseId: input.warehouseId,
            itemsPosted: totalReceived,
          },
        },
        tx,
      );

      return grn;
    });
  },

  // ─── Purchase Invoice ──────────────────────────────────────────────────────
  async listInvoices(session: AppSession | null, filters: { supplierId?: string } = {}) {
    await authorize(session, 'purchase:read');
    return prisma.purchaseInvoice.findMany({
      where: { supplierId: filters.supplierId },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        purchaseOrder: { select: { id: true, number: true } },
        grn: { select: { id: true, number: true } },
      },
    });
  },

  async getInvoice(session: AppSession | null, id: string) {
    await authorize(session, 'purchase:read');
    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseOrder: true,
        grn: true,
        items: {
          include: { product: { select: { id: true, sku: true, name: true } } },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
  },

  async createInvoice(session: AppSession | null, input: InvoiceCreateInput) {
    const actor = await authorize(session, 'purchase:invoice');

    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const yearCount = await tx.purchaseInvoice.count({
        where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      });
      const number = `SUPI-${String(yearCount + 1).padStart(3, '0')}-${year}`;

      let subtotal = new Prisma.Decimal(0);
      let taxTotal = new Prisma.Decimal(0);
      const itemRows = input.items.map((it) => {
        const qty = new Prisma.Decimal(it.quantity);
        const price = new Prisma.Decimal(it.unitPrice);
        const tax = new Prisma.Decimal(it.taxRate);
        const gross = qty.mul(price);
        const taxAmount = gross.mul(tax).div(100);
        subtotal = subtotal.plus(gross);
        taxTotal = taxTotal.plus(taxAmount);
        return {
          productId: it.productId,
          description: it.description || null,
          unit: it.unit,
          quantity: qty,
          unitPrice: price,
          taxRate: tax,
          lineTotal: gross.plus(taxAmount),
        };
      });
      const discountTotal = new Prisma.Decimal(input.discountTotal);
      const grandTotal = subtotal.plus(taxTotal).minus(discountTotal);

      let matching: 'MATCHED' | 'UNMATCHED' = 'UNMATCHED';
      if (input.purchaseOrderId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: input.purchaseOrderId },
          select: { grandTotal: true },
        });
        if (po && po.grandTotal.equals(grandTotal)) matching = 'MATCHED';
      }

      const invoice = await tx.purchaseInvoice.create({
        data: {
          branchId: supplier.branchId,
          number,
          supplierId: supplier.id,
          purchaseOrderId: input.purchaseOrderId || null,
          grnId: input.grnId || null,
          status: 'PENDING',
          matching,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate,
          currency: input.currency,
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          paidAmount: new Prisma.Decimal(0),
          notes: input.notes || null,
          createdById: actor.userId,
          items: { create: itemRows },
        },
      });

      // Post supplier payable (ledger debit)
      await tx.supplierLedger.create({
        data: {
          branchId: supplier.branchId,
          supplierId: supplier.id,
          entryType: 'PURCHASE',
          refType: 'INVOICE',
          refId: invoice.id,
          description: `Invoice ${number}${input.purchaseOrderId ? ` (${input.purchaseOrderId})` : ''}`,
          debit: grandTotal,
          credit: new Prisma.Decimal(0),
          entryDate: input.invoiceDate,
          createdById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: supplier.branchId,
          module: 'purchase',
          action: 'invoice.create',
          entityType: 'PurchaseInvoice',
          entityId: invoice.id,
          after: {
            number,
            grandTotal: grandTotal.toString(),
            matching,
            supplierId: supplier.id,
          },
        },
        tx,
      );

      return invoice;
    });
  },

  // ─── Dashboard aggregates ──────────────────────────────────────────────────
  async dashboardSummary(session: AppSession | null) {
    await authorize(session, 'purchase:read');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAgg, monthAgg, activePOs, pendingPR, pendingPO, pendingGRN, payableAgg] =
      await Promise.all([
        prisma.purchaseOrder.aggregate({
          _sum: { grandTotal: true },
          where: { orderDate: { gte: todayStart } },
        }),
        prisma.purchaseOrder.aggregate({
          _sum: { grandTotal: true },
          where: { orderDate: { gte: monthStart } },
        }),
        prisma.purchaseOrder.count({
          where: { status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
        }),
        prisma.purchaseRequisition.count({ where: { status: 'PENDING' } }),
        prisma.purchaseOrder.count({ where: { status: 'PENDING' } }),
        prisma.purchaseOrder.count({
          where: { status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
        }),
        prisma.$queryRaw<{ total: number }[]>`SELECT COALESCE(SUM(debit - credit), 0)::numeric AS total FROM "SupplierLedger"`,
      ]);

    return {
      todayTotal: todayAgg._sum.grandTotal ?? new Prisma.Decimal(0),
      monthTotal: monthAgg._sum.grandTotal ?? new Prisma.Decimal(0),
      activePOs,
      pendingPR,
      pendingPO,
      pendingGRN,
      totalPayable: new Prisma.Decimal(payableAgg[0]?.total ?? 0),
    };
  },
};
