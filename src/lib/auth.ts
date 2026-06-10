import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

export type UserRole = 'ADMIN' | 'PROVIDER' | 'BUYER';

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface SessionUser extends SessionPayload {}

const COOKIE_NAME = 'lt_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET no esta definido o es demasiado corto (minimo 32 caracteres).'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role: payload.role as UserRole,
      name: String(payload.name)
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}

export async function requireRole(role: UserRole | UserRole[]): Promise<SessionUser> {
  const session = await requireUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(session.role)) throw new Error('FORBIDDEN');
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}
