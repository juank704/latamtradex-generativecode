import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { PurchaseOrderDeadlineSchema, PurchaseOrderStatusSchema } from '@/lib/validation';
import {
  canTransition,
  requiresDeadlineBeforeAdvancing,
  statusAfterDeadlineSet,
  type PurchaseOrderStatus
} from '@/lib/purchaseOrder';

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
        status: statusAfterDeadlineSet(po.status as PurchaseOrderStatus)
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

  const from = po.status as PurchaseOrderStatus;
  const to = parsed.data.status as PurchaseOrderStatus;

  // No se puede avanzar mas alla de GENERATED sin haber fijado la fecha limite.
  if (requiresDeadlineBeforeAdvancing(from) && to !== 'CANCELED') {
    return NextResponse.json(
      { error: 'Primero debes fijar la fecha limite de preparacion.' },
      { status: 400 }
    );
  }

  // La transicion debe ser valida segun la maquina de estados.
  if (!canTransition(from, to)) {
    return NextResponse.json(
      { error: `Transicion no permitida: ${from} -> ${to}` },
      { status: 400 }
    );
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: params.id },
    data: { status: to }
  });
  return NextResponse.json(updated);
}
