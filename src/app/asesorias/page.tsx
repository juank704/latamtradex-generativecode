import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isStripeConfigured } from '@/lib/stripe';
import CheckoutButton from './CheckoutButton';

export const dynamic = 'force-dynamic';

const categoryLabel: Record<string, string> = {
  CERTIFICATION: 'Certificación',
  NEW_MARKETS: 'Nuevos Mercados'
};

export default async function AsesoriasPage() {
  const services = await prisma.advisoryService.findMany({
    where: { isActive: true },
    orderBy: { priceUsd: 'asc' }
  });
  const session = await getSession();
  const stripeReady = isStripeConfigured();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Asesorías especializadas</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Acompañamiento experto para certificaciones, apertura de nuevos mercados y
          optimización logística. Contrata en línea con pago seguro.
        </p>
        {!stripeReady && (
          <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
            ⚠ Stripe está en modo demo. Configura <code>STRIPE_SECRET_KEY</code> en{' '}
            <code>.env</code> para habilitar pagos reales.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <div key={s.id} className="card p-6 flex flex-col">
            <span className="badge bg-brand-50 text-brand-700 mb-3 w-fit">
              {categoryLabel[s.category] ?? s.category}
            </span>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">{s.title}</h3>
            <p className="text-sm text-slate-600 mb-4 flex-1">{s.description}</p>
            <div className="border-t border-slate-200 pt-4 flex items-baseline justify-between mb-4">
              <span className="text-2xl font-bold text-slate-900">
                USD {s.priceUsd.toFixed(0)}
              </span>
              <span className="text-xs text-slate-500">{s.durationHrs} h estimadas</span>
            </div>
            {session?.role === 'BUYER' || session?.role === 'PROVIDER' ? (
              <CheckoutButton serviceId={s.id} stripeReady={stripeReady} />
            ) : session ? (
              <p className="text-xs text-slate-500 text-center">
                Inicia sesión con cuenta de comprador o proveedor.
              </p>
            ) : (
              <Link href="/login" className="btn-primary w-full">
                Iniciar sesión para contratar
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
