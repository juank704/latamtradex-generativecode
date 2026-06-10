import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ModerationSchema } from '@/lib/validation';

// Moderacion del administrador: aprobar o rechazar un producto.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await requireRole('ADMIN');
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      approvalStatus: parsed.data.approvalStatus,
      rejectionReason:
        parsed.data.approvalStatus === 'REJECTED' ? parsed.data.rejectionReason ?? null : null,
      reviewedAt: new Date(),
      reviewedById: session.userId
    }
  });
  return NextResponse.json(updated);
}

// Retiro suave del producto (proveedor dueno o admin).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await requireRole(['PROVIDER', 'ADMIN']);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (session.role !== 'ADMIN' && product.providerId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await prisma.product.update({
    where: { id: params.id },
    data: { isActive: false }
  });
  return NextResponse.json({ ok: true });
}
