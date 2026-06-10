'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Quote = {
  id: string;
  status: string;
  quantity: number;
  incoterm: string;
  destinationCity: string;
  destinationCountry: string;
  paymentMethod: string;
  paymentCondition: string;
  notes: string | null;
  logisticsCost: number | null;
  customsCost: number | null;
  totalEstimated: number | null;
  adminNotes: string | null;
  createdAt: string;
  product: { name: string; unit: string; pricePerUnit: number };
  buyer: {
    name: string;
    email: string;
    companyName: string | null;
    country: string | null;
  };
};

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  QUOTED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const paymentMethodLabels: Record<string, string> = {
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  CASH: 'Efectivo'
};

const paymentConditionLabels: Record<string, string> = {
  UPFRONT: 'Al contado',
  ON_DELIVERY: 'A la entrega',
  CREDIT_30: 'Crédito 30 días'
};

export default function QuoteAdminList({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="space-y-4">
      {quotes.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay cotizaciones aún.</p>
      ) : (
        quotes.map((q) => <QuoteRow key={q.id} quote={q} />)
      )}
    </div>
  );
}

function QuoteRow({ quote }: { quote: Quote }) {
  const router = useRouter();
  const [open, setOpen] = useState(quote.status === 'PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productSubtotal = quote.product.pricePerUnit * quote.quantity;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const logistics = Number(fd.get('logisticsCost') ?? 0);
    const customs = Number(fd.get('customsCost') ?? 0);
    const total = productSubtotal + logistics + customs;
    const payload = {
      status: fd.get('status'),
      logisticsCost: logistics,
      customsCost: customs,
      totalEstimated: total,
      adminNotes: fd.get('adminNotes') || undefined
    };
    const res = await fetch(`/api/quotes/${quote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo actualizar');
      return;
    }
    router.refresh();
  }

  return (
    <div className="card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50"
      >
        <div>
          <p className="font-semibold text-slate-900">{quote.product.name}</p>
          <p className="text-xs text-slate-500 mt-1">
            {quote.buyer.companyName ?? quote.buyer.name} ({quote.buyer.country ?? '—'}) ·{' '}
            {quote.quantity} {quote.product.unit} → {quote.destinationCity},{' '}
            {quote.destinationCountry}
          </p>
        </div>
        <span className={`badge ${statusStyles[quote.status]}`}>{quote.status}</span>
      </button>

      {open && (
        <form onSubmit={onSubmit} className="border-t border-slate-200 p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p>
                <span className="text-slate-500">Comprador:</span> {quote.buyer.name} ·{' '}
                {quote.buyer.email}
              </p>
              <p>
                <span className="text-slate-500">Incoterm:</span> {quote.incoterm}
              </p>
              <p>
                <span className="text-slate-500">Pago:</span>{' '}
                {paymentMethodLabels[quote.paymentMethod] ?? quote.paymentMethod} ·{' '}
                {paymentConditionLabels[quote.paymentCondition] ?? quote.paymentCondition}
              </p>
              <p>
                <span className="text-slate-500">Subtotal producto:</span> USD{' '}
                {productSubtotal.toFixed(2)}
              </p>
              {quote.notes && (
                <p className="text-slate-600 italic">"{quote.notes}"</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Costo logístico USD</label>
                <input
                  name="logisticsCost"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={quote.logisticsCost ?? ''}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Costo aduanero USD</label>
                <input
                  name="customsCost"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={quote.customsCost ?? ''}
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Estado</label>
                <select name="status" className="input" defaultValue={quote.status}>
                  <option value="PENDING">Pendiente</option>
                  <option value="QUOTED">Cotizado</option>
                  <option value="ACCEPTED">Aceptado</option>
                  <option value="REJECTED">Rechazado</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Notas para el comprador</label>
            <textarea
              name="adminNotes"
              rows={2}
              defaultValue={quote.adminNotes ?? ''}
              className="input"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Guardar cotización'}
          </button>
        </form>
      )}
    </div>
  );
}
