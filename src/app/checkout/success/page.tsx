import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: { orderId?: string; session_id?: string; demo?: string };
}) {
  const { orderId, session_id, demo } = searchParams;

  if (orderId && session_id && isStripeConfigured() && !demo) {
    try {
      const stripe = getStripe();
      const cs = await stripe.checkout.sessions.retrieve(session_id);
      if (cs.payment_status === 'paid') {
        await prisma.advisoryOrder.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            stripePaymentIntentId:
              typeof cs.payment_intent === 'string' ? cs.payment_intent : null
          }
        });
      }
    } catch (e) {
      console.error('Error verificando Stripe:', e);
    }
  }

  const order = orderId
    ? await prisma.advisoryOrder.findUnique({
        where: { id: orderId },
        include: { service: true }
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 text-3xl mb-6">
        ✓
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">¡Pago confirmado!</h1>
      <p className="text-slate-600 mb-6">
        Gracias por contratar a Latamtradex. Un asesor te contactará en las próximas 24 horas.
      </p>
      {order && (
        <div className="card p-6 text-left mb-6">
          <h3 className="font-semibold text-slate-900 mb-2">{order.service.title}</h3>
          <p className="text-sm text-slate-600 mb-1">Monto: USD {order.amountUsd.toFixed(2)}</p>
          <p className="text-sm text-slate-600 mb-1">Estado: {order.status}</p>
          <p className="text-xs text-slate-500">Orden #{order.id}</p>
          {demo === '1' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-3">
              Pago simulado en modo demo (Stripe no configurado).
            </p>
          )}
        </div>
      )}
      <div className="flex justify-center gap-3">
        <Link href="/dashboard/comprador/asesorias" className="btn-primary">
          Ver mis asesorías
        </Link>
        <Link href="/" className="btn-secondary">
          Inicio
        </Link>
      </div>
    </div>
  );
}
