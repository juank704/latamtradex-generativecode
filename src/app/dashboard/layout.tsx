import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

const menuByRole: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: '/dashboard/admin', label: 'Resumen' },
    { href: '/dashboard/admin/productos', label: 'Moderar productos' },
    { href: '/dashboard/admin/documentos', label: 'Moderar documentos' },
    { href: '/dashboard/admin/cotizaciones', label: 'Cotizaciones' },
    { href: '/dashboard/admin/usuarios', label: 'Usuarios' }
  ],
  PROVIDER: [
    { href: '/dashboard/proveedor', label: 'Resumen' },
    { href: '/dashboard/proveedor/productos', label: 'Mis productos' },
    { href: '/dashboard/proveedor/documentos', label: 'Documentación' },
    { href: '/dashboard/proveedor/ordenes', label: 'Órdenes de compra' }
  ],
  BUYER: [
    { href: '/dashboard/comprador', label: 'Mis cotizaciones' },
    { href: '/dashboard/comprador/asesorias', label: 'Mis asesorías' },
    { href: '/catalogo', label: 'Ver catálogo' }
  ]
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const menu = menuByRole[session.role] ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[220px_1fr] gap-8">
      <aside className="lg:sticky lg:top-20 self-start">
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Panel</p>
          <p className="font-semibold text-slate-900">{session.name}</p>
          <p className="text-xs text-slate-500 mb-4">{session.role}</p>
          <nav className="flex flex-col gap-1">
            {menu.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="text-sm text-slate-700 hover:bg-slate-100 rounded px-2 py-1.5"
              >
                {m.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <section>{children}</section>
    </div>
  );
}
