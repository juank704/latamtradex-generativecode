'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuoteForm({
  productId,
  minOrderQty,
  unit
}: {
  productId: string;
  minOrderQty: number;
  unit: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = { productId, ...Object.fromEntries(formData.entries()) };
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo registrar la cotización');
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/dashboard/comprador'), 1500);
  }

  if (success) {
    return (
      <div className="card p-4 bg-green-50 border-green-200 text-green-800 text-sm">
        Cotización registrada. Latamtradex la revisará y responderá con el costo total.
        Redirigiendo a tu panel...
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-4 space-y-4">
      <div>
        <label className="label" htmlFor="quantity">
          Cantidad ({unit}) - mínimo {minOrderQty}
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={minOrderQty}
          defaultValue={minOrderQty}
          required
          className="input"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="destinationCity">
            Ciudad destino
          </label>
          <input
            id="destinationCity"
            name="destinationCity"
            required
            className="input"
            placeholder="Santiago"
          />
        </div>
        <div>
          <label className="label" htmlFor="destinationCountry">
            País destino
          </label>
          <input
            id="destinationCountry"
            name="destinationCountry"
            required
            className="input"
            placeholder="Chile"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="incoterm">
          Incoterm preferido
        </label>
        <select id="incoterm" name="incoterm" className="input" defaultValue="CIF">
          <option value="EXW">EXW (En fábrica)</option>
          <option value="FOB">FOB (Libre a bordo)</option>
          <option value="CIF">CIF (Costo, seguro y flete)</option>
          <option value="DDP">DDP (Entrega con derechos pagados)</option>
        </select>
      </div>

      <fieldset>
        <legend className="label">Forma de pago</legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'TRANSFER', label: 'Transferencia' },
            { value: 'CARD', label: 'Tarjeta' },
            { value: 'CASH', label: 'Efectivo' }
          ].map((m, i) => (
            <label
              key={m.value}
              className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m.value}
                defaultChecked={i === 0}
                className="text-brand-600"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="paymentCondition">
          Condición de pago
        </label>
        <select
          id="paymentCondition"
          name="paymentCondition"
          className="input"
          defaultValue="ON_DELIVERY"
        >
          <option value="UPFRONT">Al contado (anticipado)</option>
          <option value="ON_DELIVERY">A la entrega de la carga</option>
          <option value="CREDIT_30">Crédito a 30 días</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Observaciones (opcional)
        </label>
        <textarea id="notes" name="notes" rows={3} className="input" />
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Enviando...' : 'Solicitar cotización'}
      </button>
    </form>
  );
}
