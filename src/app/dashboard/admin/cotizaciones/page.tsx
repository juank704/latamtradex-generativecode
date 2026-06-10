import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QuoteAdminList from './QuoteAdminList';

export const dynamic = 'force-dynamic';

export default async function AdminCotizacionesPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const quotes = await prisma.quote.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      product: { select: { name: true, unit: true, pricePerUnit: true } },
      buyer: { select: { name: true, email: true, companyName: true, country: true } }
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Gestión de cotizaciones</h1>
      <p className="text-sm text-slate-600 mb-6">
        Calcula los costos logísticos y aduaneros que Latamtradex sumará al precio del proveedor.
      </p>
      <QuoteAdminList
        quotes={quotes.map((q) => ({
          id: q.id,
          status: q.status,
          quantity: q.quantity,
          incoterm: q.incoterm,
          destinationCity: q.destinationCity,
          destinationCountry: q.destinationCountry,
          paymentMethod: q.paymentMethod,
          paymentCondition: q.paymentCondition,
          notes: q.notes,
          logisticsCost: q.logisticsCost,
          customsCost: q.customsCost,
          totalEstimated: q.totalEstimated,
          adminNotes: q.adminNotes,
          createdAt: q.createdAt.toISOString(),
          product: q.product,
          buyer: q.buyer
        }))}
      />
    </div>
  );
}
