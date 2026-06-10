import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  let session;
  try {
    session = await requireRole(['PROVIDER', 'ADMIN']);
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const title = String(formData.get('title') || '').trim();
  const type = String(formData.get('type') || 'OTHER');
  const productId = formData.get('productId')
    ? String(formData.get('productId'))
    : null;

  if (!file || !title) {
    return NextResponse.json(
      { error: 'Archivo y titulo son obligatorios' },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido (PDF, DOC, DOCX, PNG, JPG)' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Archivo demasiado grande (max 8MB)' }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filename = `${randomUUID()}-${safeName}`;
  const filepath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const document = await prisma.document.create({
    data: {
      title,
      type,
      fileUrl: `/uploads/${filename}`,
      fileSize: file.size,
      mimeType: file.type,
      providerId: session.userId,
      productId
    }
  });

  return NextResponse.json(document, { status: 201 });
}
