import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PurchaseOrderManager from './PurchaseOrderManager';

export const dynamic = 'force-dynamic';

export default async function ProveedorOrdenesPage() {
  const session = await getSession();
  if (!session || session.role !== 'PROVIDER') redirect('/login');

  const orders = await prisma.purchaseOrder.findMany({
    where: { providerId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true, unit: true } },
      buyer: { select: { name: true, companyName: true, country: true } }
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Órdenes de compra</h1>
      <p className="text-sm text-slate-600 mb-6">
        Cuando Latamtradex acepta una cotización se genera una orden de compra. Debes fijar la{' '}
        <strong>fecha límite de preparación</strong> y mantener actualizado el estado del pedido.
      </p>
      <PurchaseOrderManager
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          quantity: o.quantity,
          unitPrice: o.unitPrice,
          totalAmount: o.totalAmount,
          incoterm: o.incoterm,
          destinationCity: o.destinationCity,
          destinationCountry: o.destinationCountry,
          preparationDeadline: o.preparationDeadline?.toISOString() ?? null,
          providerNotes: o.providerNotes,
          createdAt: o.createdAt.toISOString(),
          productName: o.product.name,
          unit: o.product.unit,
          buyerName: o.buyer.companyName ?? o.buyer.name,
          buyerCountry: o.buyer.country
        }))}
      />
    </div>
  );
}
