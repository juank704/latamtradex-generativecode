import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { LoginSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as 'ADMIN' | 'PROVIDER' | 'BUYER',
    name: user.name
  });

  return NextResponse.json({ ok: true, role: user.role });
}
