'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  minOrderQty: number;
  originCity: string;
  isActive: boolean;
  approvalStatus: string;
  rejectionReason: string | null;
};

const approvalStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const approvalLabels: Record<string, string> = {
  PENDING: 'En revisión',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado'
};

export default function ProductManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo crear el producto');
      return;
    }
    setShowForm(false);
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm('¿Retirar el producto del catálogo?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nuevo producto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input name="name" required className="input" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <input
                name="category"
                required
                className="input"
                placeholder="Alimentos, Frutas, ..."
              />
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea name="description" rows={3} required className="input" />
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Unidad</label>
              <input name="unit" required className="input" placeholder="kg, caja..." />
            </div>
            <div>
              <label className="label">Precio USD</label>
              <input
                name="pricePerUnit"
                type="number"
                step="0.01"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Pedido mínimo</label>
              <input
                name="minOrderQty"
                type="number"
                min={1}
                defaultValue={1}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Ciudad origen</label>
              <input name="originCity" required className="input" />
            </div>
          </div>
          <div>
            <label className="label">URL de imagen (opcional)</label>
            <input name="imageUrl" type="url" className="input" />
          </div>
          <input type="hidden" name="originCountry" value="Colombia" />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Publicar producto'}
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-slate-500 text-sm">Aún no has publicado productos.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left p-3">Producto</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-left p-3">Precio</th>
                <th className="text-left p-3">Aprobación</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-3 font-medium text-slate-900">{p.name}</td>
                  <td className="p-3 text-slate-600">{p.category}</td>
                  <td className="p-3 text-slate-600">
                    USD {p.pricePerUnit.toFixed(2)}/{p.unit}
                  </td>
                  <td className="p-3">
                    <span className={`badge ${approvalStyles[p.approvalStatus]}`}>
                      {approvalLabels[p.approvalStatus] ?? p.approvalStatus}
                    </span>
                    {p.approvalStatus === 'REJECTED' && p.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">{p.rejectionReason}</p>
                    )}
                  </td>
                  <td className="p-3">
                    {p.isActive ? (
                      <span className="badge bg-green-100 text-green-700">Activo</span>
                    ) : (
                      <span className="badge bg-slate-200 text-slate-600">Retirado</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {p.isActive && (
                      <button
                        onClick={() => onDelete(p.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Retirar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
