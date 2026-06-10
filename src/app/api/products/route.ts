import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ProductSchema } from '@/lib/validation';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  let session;
  try {
    session = await requireRole(['PROVIDER', 'ADMIN']);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
      providerId: session.userId
    }
  });
  return NextResponse.json(product, { status: 201 });
}
