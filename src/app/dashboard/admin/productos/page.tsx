import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProductModeration from './ProductModeration';

export const dynamic = 'force-dynamic';

export default async function AdminProductosPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
    include: {
      provider: { select: { name: true, companyName: true, country: true } }
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Moderación de productos</h1>
      <p className="text-sm text-slate-600 mb-6">
        Aprueba o rechaza los productos enviados por los proveedores. Solo los productos
        aprobados aparecen en el catálogo público.
      </p>
      <ProductModeration
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          pricePerUnit: p.pricePerUnit,
          unit: p.unit,
          originCity: p.originCity,
          imageUrl: p.imageUrl,
          approvalStatus: p.approvalStatus,
          rejectionReason: p.rejectionReason,
          provider: p.provider
        }))}
      />
    </div>
  );
}
