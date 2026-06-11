/**
 * @jest-environment node
 */
// Pruebas del modelo de Roles y Autenticacion.
// Verifican que la sesion JWT distingue ADMIN / PROVIDER / BUYER y que
// requireRole aplica correctamente el control de acceso.

// Mock en memoria del almacen de cookies de Next.js.
jest.mock('next/headers', () => {
  const store = new Map<string, string>();
  return {
    cookies: () => ({
      get: (k: string) => (store.has(k) ? { value: store.get(k) } : undefined),
      set: (k: string, v: string) => {
        store.set(k, v);
      },
      delete: (k: string) => {
        store.delete(k);
      }
    }),
    __resetCookies: () => store.clear()
  };
});

import * as headers from 'next/headers';
import {
  createSession,
  getSession,
  destroySession,
  requireUser,
  requireRole,
  type SessionPayload
} from '@/lib/auth';

beforeAll(() => {
  // AUTH_SECRET debe tener al menos 32 caracteres.
  process.env.AUTH_SECRET = 'secreto-de-pruebas-suficientemente-largo-32+';
});

beforeEach(() => {
  (headers as unknown as { __resetCookies: () => void }).__resetCookies();
});

function session(role: SessionPayload['role']): SessionPayload {
  return { userId: `user_${role}`, email: `${role}@latamtradex.com`, role, name: `Test ${role}` };
}

describe('Sesión y diferenciación de roles', () => {
  it('crea y recupera una sesión preservando el rol ADMIN', async () => {
    await createSession(session('ADMIN'));
    const s = await getSession();
    expect(s).not.toBeNull();
    expect(s?.role).toBe('ADMIN');
    expect(s?.email).toBe('ADMIN@latamtradex.com');
  });

  it('distingue correctamente PROVIDER y BUYER', async () => {
    await createSession(session('PROVIDER'));
    expect((await getSession())?.role).toBe('PROVIDER');

    await createSession(session('BUYER'));
    expect((await getSession())?.role).toBe('BUYER');
  });

  it('devuelve null cuando no hay sesión', async () => {
    expect(await getSession()).toBeNull();
  });

  it('destruye la sesión (logout)', async () => {
    await createSession(session('BUYER'));
    await destroySession();
    expect(await getSession()).toBeNull();
  });
});

describe('requireUser / requireRole (control de acceso)', () => {
  it('requireUser falla sin sesión', async () => {
    await expect(requireUser()).rejects.toThrow('UNAUTHENTICATED');
  });

  it('ADMIN puede acceder a recursos de ADMIN', async () => {
    await createSession(session('ADMIN'));
    await expect(requireRole('ADMIN')).resolves.toMatchObject({ role: 'ADMIN' });
  });

  it('BUYER NO puede acceder a recursos de ADMIN', async () => {
    await createSession(session('BUYER'));
    await expect(requireRole('ADMIN')).rejects.toThrow('FORBIDDEN');
  });

  it('PROVIDER NO puede solicitar cotizaciones (rol BUYER)', async () => {
    await createSession(session('PROVIDER'));
    await expect(requireRole('BUYER')).rejects.toThrow('FORBIDDEN');
  });

  it('acepta una lista de roles permitidos (PROVIDER o ADMIN)', async () => {
    await createSession(session('PROVIDER'));
    await expect(requireRole(['PROVIDER', 'ADMIN'])).resolves.toMatchObject({
      role: 'PROVIDER'
    });
  });

  it('rechaza si el rol no está en la lista permitida', async () => {
    await createSession(session('BUYER'));
    await expect(requireRole(['PROVIDER', 'ADMIN'])).rejects.toThrow('FORBIDDEN');
  });
});
