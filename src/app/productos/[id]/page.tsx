import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import QuoteForm from './QuoteForm';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      provider: { select: { companyName: true, country: true, name: true } },
      documents: {
        where: { approvalStatus: 'APPROVED' },
        select: { id: true, title: true, type: true }
      }
    }
  });
  if (!product || !product.isActive || product.approvalStatus !== 'APPROVED') notFound();

  const session = await getSession();
  const canQuote = session?.role === 'BUYER';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-10">
      <div>
        <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden ring-1 ring-slate-200">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Sin imagen
            </div>
          )}
        </div>
        {product.documents.length > 0 && (
          <div className="card p-4 mt-6">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm">
              Documentación técnica disponible
            </h3>
            <ul className="text-sm text-slate-600 space-y-1">
              {product.documents.map((d) => (
                <li key={d.id}>
                  • {d.title} <span className="text-xs text-slate-400">({d.type})</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-2">
              Las certificaciones se entregan tras la cotización formal.
            </p>
          </div>
        )}
      </div>

      <div>
        <span className="badge bg-brand-50 text-brand-700 mb-2">{product.category}</span>
        <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Origen: {product.originCity}, {product.originCountry}
        </p>
        {product.provider?.companyName && (
          <p className="text-sm text-slate-500">
            Proveedor: {product.provider.companyName}
          </p>
        )}
        <div className="mt-4 p-4 rounded-md bg-slate-50 ring-1 ring-slate-200">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              USD {product.pricePerUnit.toFixed(2)}
            </span>
            <span className="text-slate-500">/{product.unit}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pedido mínimo: {product.minOrderQty} {product.unit}
          </p>
        </div>
        <p className="text-slate-700 mt-6 whitespace-pre-line">{product.description}</p>

        <div className="mt-8 border-t pt-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Solicitar cotización logística integral
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Latamtradex aporta los costos aduaneros, flete internacional y entrega final.
          </p>
          {canQuote ? (
            <QuoteForm
              productId={product.id}
              minOrderQty={product.minOrderQty}
              unit={product.unit}
            />
          ) : (
            <div className="card p-4 text-sm text-slate-600">
              {session ? (
                <>
                  Necesitas una cuenta de <strong>comprador</strong> para solicitar
                  cotizaciones. Estás registrado como <strong>{session.role}</strong>.
                </>
              ) : (
                <>
                  <Link href="/login" className="text-brand-700 font-medium hover:underline">
                    Inicia sesión
                  </Link>{' '}
                  o{' '}
                  <Link
                    href="/registro?role=BUYER"
                    className="text-brand-700 font-medium hover:underline"
                  >
                    regístrate como comprador
                  </Link>{' '}
                  para solicitar una cotización.
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
