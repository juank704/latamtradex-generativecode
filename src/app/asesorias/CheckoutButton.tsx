'use client';

import { useState } from 'react';

export default function CheckoutButton({
  serviceId,
  stripeReady
}: {
  serviceId: string;
  stripeReady: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Error al iniciar el pago');
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={loading}
        className="btn-primary w-full"
        data-testid="asesoria-contratar"
      >
        {loading ? 'Redirigiendo...' : stripeReady ? 'Contratar con Stripe' : 'Contratar (demo)'}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
