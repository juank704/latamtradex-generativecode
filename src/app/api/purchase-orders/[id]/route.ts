import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { PurchaseOrderDeadlineSchema, PurchaseOrderStatusSchema } from '@/lib/validation';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await requireRole(['PROVIDER', 'ADMIN']);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const po = await prisma.purchaseOrder.findUnique({ where: { id: params.id } });
  if (!po) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  // El proveedor solo puede gestionar sus propias ordenes.
  if (session.role !== 'ADMIN' && po.providerId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  // Caso 1: el proveedor fija la fecha limite de preparacion (regla de negocio).
  if (body && body.preparationDeadline !== undefined) {
    const parsed = PurchaseOrderDeadlineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Fecha invalida', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    if (parsed.data.preparationDeadline.getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'La fecha limite debe ser futura' },
        { status: 400 }
      );
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        preparationDeadline: parsed.data.preparationDeadline,
        deadlineSetAt: new Date(),
        providerNotes: parsed.data.providerNotes ?? po.providerNotes,
        // Al fijar la fecha por primera vez, la orden pasa a SCHEDULED.
        status: po.status === 'GENERATED' ? 'SCHEDULED' : po.status
      }
    });
    return NextResponse.json(updated);
  }

  // Caso 2: avanzar el estado de la orden.
  const parsed = PurchaseOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // No se puede avanzar mas alla de GENERATED sin haber fijado la fecha limite.
  if (po.status === 'GENERATED' && parsed.data.status !== 'CANCELED') {
    return NextResponse.json(
      { error: 'Primero debes fijar la fecha limite de preparacion.' },
      { status: 400 }
    );
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: params.id },
    data: { status: parsed.data.status }
  });
  return NextResponse.json(updated);
}
