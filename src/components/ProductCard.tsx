import Link from 'next/link';

type ProductCardProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  originCity: string;
  originCountry: string;
  imageUrl: string | null;
  provider?: { companyName?: string | null; country?: string | null } | null;
};

export default function ProductCard({ product }: { product: ProductCardProduct }) {
  return (
    <Link href={`/productos/${product.id}`} className="card hover:shadow-md transition block">
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
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
      <div className="p-4">
        <span className="badge bg-brand-50 text-brand-700 mb-2">{product.category}</span>
        <h3 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-slate-500 mt-1">
          Origen: {product.originCity}, {product.originCountry}
        </p>
        {product.provider?.companyName && (
          <p className="text-xs text-slate-500">
            Proveedor: {product.provider.companyName}
          </p>
        )}
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-lg font-bold text-slate-900">
            USD {product.pricePerUnit.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500">/{product.unit}</span>
        </div>
      </div>
    </Link>
  );
}
