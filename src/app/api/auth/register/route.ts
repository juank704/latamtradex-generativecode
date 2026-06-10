import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { RegisterSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, name, role, companyName, country, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta con ese correo.' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      companyName: companyName || null,
      country: country || null,
      phone: phone || null
    }
  });

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as 'ADMIN' | 'PROVIDER' | 'BUYER',
    name: user.name
  });

  return NextResponse.json({ ok: true, role: user.role });
}
