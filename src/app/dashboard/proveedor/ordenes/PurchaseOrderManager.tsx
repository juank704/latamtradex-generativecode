'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNextStates,
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrderStatus
} from '@/lib/purchaseOrder';

type Order = {
  id: string;
  orderNumber: string | null;
  status: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  incoterm: string;
  destinationCity: string;
  destinationCountry: string;
  preparationDeadline: string | null;
  providerNotes: string | null;
  createdAt: string;
  productName: string;
  unit: string;
  buyerName: string;
  buyerCountry: string | null;
};

const statusStyles: Record<string, string> = {
  GENERATED: 'bg-yellow-100 text-yellow-800',
  SCHEDULED: 'bg-indigo-100 text-indigo-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  READY: 'bg-cyan-100 text-cyan-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-slate-200 text-slate-600'
};

// Etiquetas y transiciones provienen del modulo de maquina de estados compartido.
const statusLabels = PURCHASE_ORDER_STATUS_LABELS;

export default function PurchaseOrderManager({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center text-slate-500">
        Aún no tienes órdenes de compra. Se generan cuando Latamtradex acepta una cotización de
        tus productos.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <OrderRow key={o.id} order={o} />
      ))}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState(order.providerNotes ?? '');

  async function setDeadlineFn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/purchase-orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preparationDeadline: deadline, providerNotes: notes })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo guardar la fecha');
      return;
    }
    router.refresh();
  }

  async function advance(status: string) {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/purchase-orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo actualizar el estado');
      return;
    }
    router.refresh();
  }

  const allowed = getNextStates(order.status as PurchaseOrderStatus);

  return (
    <div className="card p-4" data-testid="order-row">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {order.orderNumber ?? `OC ${order.id.slice(0, 8)}`} · {order.productName}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {order.quantity} {order.unit} · USD {order.totalAmount.toFixed(2)} ·{' '}
            {order.incoterm} → {order.destinationCity}, {order.destinationCountry}
          </p>
          <p className="text-xs text-slate-500">
            Comprador: {order.buyerName} ({order.buyerCountry ?? '—'})
          </p>
        </div>
        <span className={`badge ${statusStyles[order.status]}`}>
          {statusLabels[order.status as PurchaseOrderStatus] ?? order.status}
        </span>
      </div>

      {/* Regla de negocio: fijar fecha limite cuando la orden esta GENERATED */}
      {order.status === 'GENERATED' ? (
        <form onSubmit={setDeadlineFn} className="mt-4 p-3 rounded-md bg-amber-50 ring-1 ring-amber-200 space-y-3">
          <p className="text-sm text-amber-800 font-medium">
            Fija la fecha límite para preparar la entrega:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha límite de preparación</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
                data-testid="order-deadline-input"
              />
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                placeholder="Detalles de preparación"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            data-testid="order-deadline-submit"
          >
            {loading ? 'Guardando...' : 'Confirmar fecha límite'}
          </button>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {order.preparationDeadline && (
            <p className="text-sm text-slate-600">
              Fecha límite:{' '}
              <strong>
                {new Date(order.preparationDeadline).toLocaleDateString('es-CO')}
              </strong>
            </p>
          )}
          {allowed.map((s) => (
            <button
              key={s}
              onClick={() => advance(s)}
              disabled={loading}
              className={s === 'CANCELED' ? 'btn-danger' : 'btn-secondary'}
              data-testid={`order-advance-${s}`}
            >
              {statusLabels[s] ?? s}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
