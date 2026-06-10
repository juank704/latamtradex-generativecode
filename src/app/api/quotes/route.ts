import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { QuoteSchema } from '@/lib/validation';

export async function POST(req: Request) {
  let session;
  try {
    session = await requireRole('BUYER');
  } catch {
    return NextResponse.json(
      { error: 'Solo los compradores pueden solicitar cotizaciones' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId }
  });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: 'Producto no disponible' }, { status: 404 });
  }
  if (parsed.data.quantity < product.minOrderQty) {
    return NextResponse.json(
      { error: `La cantidad minima para este producto es ${product.minOrderQty}` },
      { status: 400 }
    );
  }

  const quote = await prisma.quote.create({
    data: {
      productId: parsed.data.productId,
      buyerId: session.userId,
      quantity: parsed.data.quantity,
      destinationCity: parsed.data.destinationCity,
      destinationCountry: parsed.data.destinationCountry,
      incoterm: parsed.data.incoterm,
      paymentMethod: parsed.data.paymentMethod,
      paymentCondition: parsed.data.paymentCondition,
      notes: parsed.data.notes || null
    }
  });

  return NextResponse.json(quote, { status: 201 });
}
