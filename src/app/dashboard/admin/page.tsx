import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const [pendingProducts, pendingDocs, pendingQuotes, purchaseOrders] = await Promise.all([
    prisma.product.count({ where: { approvalStatus: 'PENDING', isActive: true } }),
    prisma.document.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.quote.count({ where: { status: 'PENDING' } }),
    prisma.purchaseOrder.count()
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel Latamtradex</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Productos por aprobar" value={pendingProducts} highlight={pendingProducts > 0} />
        <Stat label="Documentos por aprobar" value={pendingDocs} highlight={pendingDocs > 0} />
        <Stat label="Cotizaciones pendientes" value={pendingQuotes} highlight={pendingQuotes > 0} />
        <Stat label="Órdenes de compra" value={purchaseOrders} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <ActionCard
          title="Moderar productos"
          count={pendingProducts}
          href="/dashboard/admin/productos"
          cta="Revisar productos"
        />
        <ActionCard
          title="Moderar documentos"
          count={pendingDocs}
          href="/dashboard/admin/documentos"
          cta="Revisar documentos"
        />
        <ActionCard
          title="Cotizaciones"
          count={pendingQuotes}
          href="/dashboard/admin/cotizaciones"
          cta="Procesar cotizaciones"
        />
      </div>
    </div>
  );
}

function ActionCard({
  title,
  count,
  href,
  cta
}: {
  title: string;
  count: number;
  href: string;
  cta: string;
}) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 my-2">
        {count > 0 ? `${count} pendiente(s) de revisar.` : 'Todo al día.'}
      </p>
      <Link href={href} className="btn-primary">
        {cta}
      </Link>
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
