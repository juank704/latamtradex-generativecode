'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const dashboardHref: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  PROVIDER: '/dashboard/proveedor',
  BUYER: '/dashboard/comprador'
};

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Error al iniciar sesión');
      return;
    }
    const data = await res.json();
    router.push(dashboardHref[data.role] ?? '/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Correo electrónico
        </label>
        <input id="email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required className="input" />
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
