import { NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  await authorize(session, 'corporate-sales:read');

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const where = q
    ? {
        isActive: true,
        OR: [
          { sku: { equals: q, mode: 'insensitive' as const } },
          { barcode: { equals: q } },
          { name: { contains: q, mode: 'insensitive' as const } },
          { sku: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : { isActive: true };
  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 40,
    select: {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      unit: true,
      sellPrice: true,
      taxRate: true,
      imageUrl: true,
    },
  });
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
