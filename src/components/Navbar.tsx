import Link from 'next/link';
import type { SessionUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';

const dashboardHref: Record<SessionUser['role'], string> = {
  ADMIN: '/dashboard/admin',
  PROVIDER: '/dashboard/proveedor',
  BUYER: '/dashboard/comprador'
};

export default function Navbar({ session }: { session: SessionUser | null }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white font-bold">
              L
            </span>
            <span className="font-semibold text-slate-900">Latamtradex</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <Link href="/catalogo" className="hover:text-brand-700">
              Catálogo
            </Link>
            <Link href="/asesorias" className="hover:text-brand-700">
              Asesorías
            </Link>
            <Link href="/#nosotros" className="hover:text-brand-700">
              Cómo funciona
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href={dashboardHref[session.role]}
                className="text-sm text-slate-700 hover:text-brand-700"
              >
                Panel
              </Link>
              <span className="hidden sm:inline text-xs text-slate-500">
                {session.name} · {session.role}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-700 hover:text-brand-700">
                Ingresar
              </Link>
              <Link href="/registro" className="btn-primary">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
