import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ModerationSchema } from '@/lib/validation';

// Moderacion del administrador: aprobar o rechazar un documento.
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

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const updated = await prisma.document.update({
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

// Eliminar documento (proveedor dueno o admin).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await requireRole(['PROVIDER', 'ADMIN']);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (session.role !== 'ADMIN' && doc.providerId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await prisma.document.delete({ where: { id: params.id } });
  try {
    const filepath = path.join(process.cwd(), 'public', doc.fileUrl);
    await unlink(filepath);
  } catch {
    // archivo ya inexistente, ignorar
  }
  return NextResponse.json({ ok: true });
}
