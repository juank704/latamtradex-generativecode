import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ProveedorHomePage() {
  const session = await getSession();
  if (!session || session.role !== 'PROVIDER') redirect('/login');

  const [productCount, documentCount, quoteCount, pendingOrders] = await Promise.all([
    prisma.product.count({ where: { providerId: session.userId, isActive: true } }),
    prisma.document.count({ where: { providerId: session.userId } }),
    prisma.quote.count({
      where: { product: { providerId: session.userId } }
    }),
    prisma.purchaseOrder.count({
      where: { providerId: session.userId, status: 'GENERATED' }
    })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Hola, {session.name}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Productos activos" value={productCount} />
        <Stat label="Documentos cargados" value={documentCount} />
        <Stat label="Cotizaciones recibidas" value={quoteCount} />
        <Stat label="Órdenes por agendar" value={pendingOrders} highlight={pendingOrders > 0} />
      </div>
      {pendingOrders > 0 && (
        <div className="card p-4 mb-8 bg-amber-50 ring-amber-200">
          <p className="text-sm text-amber-800">
            Tienes {pendingOrders} orden(es) de compra sin fecha límite.{' '}
            <Link href="/dashboard/proveedor/ordenes" className="font-medium underline">
              Fíjala ahora
            </Link>
            .
          </p>
        </div>
      )}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-2">Próximos pasos</h2>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>
            <Link
              href="/dashboard/proveedor/productos"
              className="text-brand-700 hover:underline"
            >
              Publica nuevos productos
            </Link>{' '}
            para aparecer en el catálogo público.
          </li>
          <li>
            <Link
              href="/dashboard/proveedor/documentos"
              className="text-brand-700 hover:underline"
            >
              Sube documentación
            </Link>{' '}
            que certifique calidad y viabilidad de exportación.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-4 ${highlight ? 'ring-2 ring-accent-500' : ''}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
