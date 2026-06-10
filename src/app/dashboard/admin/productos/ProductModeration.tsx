'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  pricePerUnit: number;
  unit: string;
  originCity: string;
  imageUrl: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  provider: { name: string; companyName: string | null; country: string | null };
};

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado'
};

export default function ProductModeration({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-slate-500 text-sm">No hay productos para moderar.</p>;
  }
  return (
    <div className="space-y-4">
      {products.map((p) => (
        <ProductRow key={p.id} product={p} />
      ))}
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState(product.rejectionReason ?? '');

  async function moderate(approvalStatus: 'APPROVED' | 'REJECTED') {
    setError(null);
    setLoading(approvalStatus);
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approvalStatus,
        rejectionReason: approvalStatus === 'REJECTED' ? reason : undefined
      })
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo actualizar');
      return;
    }
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-16 w-16 rounded object-cover ring-1 ring-slate-200"
            />
          )}
          <div>
            <p className="font-semibold text-slate-900">{product.name}</p>
            <p className="text-xs text-slate-500">
              {product.category} · USD {product.pricePerUnit.toFixed(2)}/{product.unit} ·{' '}
              {product.originCity}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Proveedor: {product.provider.companyName ?? product.provider.name} (
              {product.provider.country ?? '—'})
            </p>
          </div>
        </div>
        <span className={`badge ${statusStyles[product.approvalStatus]}`}>
          {statusLabels[product.approvalStatus] ?? product.approvalStatus}
        </span>
      </div>

      <p className="text-sm text-slate-600 mt-3">{product.description}</p>

      {product.approvalStatus === 'REJECTED' && product.rejectionReason && (
        <p className="text-xs text-red-600 mt-2">Motivo del rechazo: {product.rejectionReason}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (si rechazas)"
          className="input max-w-xs"
        />
        <button
          onClick={() => moderate('APPROVED')}
          disabled={loading !== null}
          className="btn-primary"
        >
          {loading === 'APPROVED' ? '...' : 'Aprobar'}
        </button>
        <button
          onClick={() => moderate('REJECTED')}
          disabled={loading !== null}
          className="btn-danger"
        >
          {loading === 'REJECTED' ? '...' : 'Rechazar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
