import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PurchaseOrderTracker from './PurchaseOrderTracker';

export const dynamic = 'force-dynamic';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  QUOTED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  QUOTED: 'Cotizado',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado'
};

const paymentMethodLabels: Record<string, string> = {
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  CASH: 'Efectivo'
};

const paymentConditionLabels: Record<string, string> = {
  UPFRONT: 'Al contado (anticipado)',
  ON_DELIVERY: 'A la entrega de la carga',
  CREDIT_30: 'Crédito a 30 días'
};

export default async function CompradorPage() {
  const session = await getSession();
  if (!session || session.role !== 'BUYER') redirect('/login');

  const [quotes, orders] = await Promise.all([
    prisma.quote.findMany({
      where: { buyerId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, unit: true } } }
    }),
    prisma.purchaseOrder.findMany({
      where: { buyerId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true, unit: true } } }
    })
  ]);

  return (
    <div className="space-y-12">
      {/* ---------- Seguimiento de Ordenes de Compra ---------- */}
      <section>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Seguimiento de pedidos</h1>
        <p className="text-sm text-slate-600 mb-6">
          Estado en tiempo real de tus órdenes de compra. Aquí sabrás cuándo se preparará y
          enviará tu carga según las condiciones de pago acordadas.
        </p>
        {orders.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 text-sm">
            Todavía no tienes órdenes de compra. Se generan automáticamente cuando Latamtradex
            acepta una de tus cotizaciones.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {o.orderNumber ?? `OC ${o.id.slice(0, 8)}`} · {o.product.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {o.quantity} {o.product.unit} · USD {o.totalAmount.toFixed(2)} ·{' '}
                      {o.incoterm} → {o.destinationCity}, {o.destinationCountry}
                    </p>
                    {o.preparationDeadline && (
                      <p className="text-xs text-slate-500">
                        Fecha límite de preparación:{' '}
                        <strong>
                          {new Date(o.preparationDeadline).toLocaleDateString('es-CO')}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
                <PurchaseOrderTracker status={o.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Mis cotizaciones ---------- */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Mis cotizaciones</h2>
          <Link href="/catalogo" className="btn-primary">
            Explorar catálogo
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500 mb-4">
              Aún no has solicitado cotizaciones. Explora el catálogo y solicita la primera.
            </p>
            <Link href="/catalogo" className="btn-primary">
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((q) => (
              <div key={q.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/productos/${q.product.id}`}
                      className="font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {q.product.name}
                    </Link>
                    <p className="text-sm text-slate-600 mt-1">
                      {q.quantity} {q.product.unit} · Destino: {q.destinationCity},{' '}
                      {q.destinationCountry} · Incoterm: {q.incoterm}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Pago: {paymentMethodLabels[q.paymentMethod] ?? q.paymentMethod} ·{' '}
                      {paymentConditionLabels[q.paymentCondition] ?? q.paymentCondition}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Solicitada: {new Date(q.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <span className={`badge ${statusStyles[q.status]}`}>
                    {statusLabels[q.status] ?? q.status}
                  </span>
                </div>
                {q.status === 'QUOTED' && (
                  <div className="mt-4 p-3 rounded-md bg-slate-50 ring-1 ring-slate-200 grid sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Logística</p>
                      <p className="font-semibold">USD {q.logisticsCost?.toFixed(2) ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Aduanas</p>
                      <p className="font-semibold">USD {q.customsCost?.toFixed(2) ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total estimado</p>
                      <p className="font-bold text-brand-700">
                        USD {q.totalEstimated?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                    {q.adminNotes && (
                      <p className="sm:col-span-3 text-xs text-slate-600 italic">
                        Nota: {q.adminNotes}
                      </p>
                    )}
                  </div>
                )}
                {q.status === 'ACCEPTED' && (
                  <p className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                    Cotización aceptada. Revisa el seguimiento de tu orden de compra arriba.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
