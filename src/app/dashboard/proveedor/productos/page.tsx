import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProductManager from './ProductManager';

export const dynamic = 'force-dynamic';

export default async function ProveedorProductosPage() {
  const session = await getSession();
  if (!session || session.role !== 'PROVIDER') redirect('/login');

  const products = await prisma.product.findMany({
    where: { providerId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mis productos</h1>
      <ProductManager products={products} />
    </div>
  );
}
