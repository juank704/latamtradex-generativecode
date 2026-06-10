import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { QuoteUpdateSchema } from '@/lib/validation';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole('ADMIN');
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = QuoteUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { product: true }
  });
  if (!quote) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const updated = await prisma.quote.update({
    where: { id: params.id },
    data: parsed.data
  });

  // Regla de negocio: al ACEPTAR una cotizacion se genera automaticamente una
  // Orden de Compra vinculada al proveedor (si no existe ya).
  let purchaseOrder = null;
  if (parsed.data.status === 'ACCEPTED') {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { quoteId: quote.id }
    });
    if (!existing) {
      const count = await prisma.purchaseOrder.count();
      const year = new Date().getFullYear();
      const orderNumber = `OC-${year}-${String(count + 1).padStart(4, '0')}`;

      const unitPrice = quote.product.pricePerUnit;
      const totalAmount =
        updated.totalEstimated ??
        unitPrice * quote.quantity +
          (updated.logisticsCost ?? 0) +
          (updated.customsCost ?? 0);

      purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          quoteId: quote.id,
          productId: quote.productId,
          providerId: quote.product.providerId,
          buyerId: quote.buyerId,
          quantity: quote.quantity,
          unitPrice,
          totalAmount,
          incoterm: quote.incoterm,
          destinationCity: quote.destinationCity,
          destinationCountry: quote.destinationCountry,
          status: 'GENERATED'
        }
      });
    } else {
      purchaseOrder = existing;
    }
  }

  return NextResponse.json({ quote: updated, purchaseOrder });
}
