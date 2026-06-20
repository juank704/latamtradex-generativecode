import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function CatalogoPage({
  searchParams
}: {
  searchParams: { q?: string; cat?: string };
}) {
  const q = searchParams.q?.trim() ?? '';
  const cat = searchParams.cat?.trim() ?? '';

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      approvalStatus: 'APPROVED',
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q } },
                { description: { contains: q } },
                { originCity: { contains: q } }
              ]
            }
          : {},
        cat ? { category: cat } : {}
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: { provider: { select: { companyName: true, country: true } } }
  });

  const categoriesRaw = await prisma.product.findMany({
    where: { isActive: true, approvalStatus: 'APPROVED' },
    select: { category: true },
    distinct: ['category']
  });
  const categories = categoriesRaw.map((c) => c.category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Catálogo público</h1>
        <p className="text-slate-600 mt-2">
          Productos latinoamericanos certificados, listos para exportación.
        </p>
      </div>

      <form className="card p-4 mb-8 grid sm:grid-cols-3 gap-3" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar producto, descripción o ciudad..."
          className="input sm:col-span-2"
          data-testid="catalogo-search"
        />
        <select name="cat" defaultValue={cat} className="input">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary sm:col-span-3">
          Filtrar
        </button>
      </form>

      {products.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No se encontraron productos con esos filtros.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
