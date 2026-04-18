import { NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { posService } from '@/server/services/pos.service';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q') ?? '';

  const activeSession = await prisma.posSession.findFirst({
    where: { cashierId: session.userId, status: 'OPEN' },
    select: { branchId: true },
  });
  const branchId = activeSession?.branchId ?? session.activeBranchId;
  if (!branchId) return Response.json([]);

  const products = await posService.searchProducts(session, branchId, q, 40);
  return Response.json(
    products.map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      unit: p.unit,
      sellPrice: p.sellPrice.toString(),
      taxRate: p.taxRate.toString(),
      imageUrl: p.imageUrl,
    })),
  );
}
