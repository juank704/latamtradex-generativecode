import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(req: Request) {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Debes iniciar sesion' }, { status: 401 });
  }

  const { serviceId } = (await req.json().catch(() => ({}))) as { serviceId?: string };
  if (!serviceId) {
    return NextResponse.json({ error: 'serviceId requerido' }, { status: 400 });
  }

  const service = await prisma.advisoryService.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 404 });
  }

  const order = await prisma.advisoryOrder.create({
    data: {
      serviceId: service.id,
      buyerId: session.userId,
      amountUsd: service.priceUsd,
      status: 'PENDING'
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Modo demo cuando Stripe no esta configurado: marca el pedido como pagado y redirige.
  if (!isStripeConfigured()) {
    await prisma.advisoryOrder.update({
      where: { id: order.id },
      data: { status: 'PAID', stripeSessionId: `demo_${order.id}` }
    });
    return NextResponse.json({
      url: `${appUrl}/checkout/success?orderId=${order.id}&demo=1`
    });
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(service.priceUsd * 100),
          product_data: {
            name: service.title,
            description: service.description.slice(0, 200)
          }
        }
      }
    ],
    customer_email: session.email,
    client_reference_id: order.id,
    success_url: `${appUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/asesorias?canceled=1`,
    metadata: { orderId: order.id, serviceId: service.id, buyerId: session.userId }
  });

  await prisma.advisoryOrder.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id }
  });

  return NextResponse.json({ url: checkoutSession.url });
}
