'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const dashboardHref: Record<string, string> = {
  PROVIDER: '/dashboard/proveedor',
  BUYER: '/dashboard/comprador'
};

export default function RegisterForm({
  initialRole
}: {
  initialRole: 'PROVIDER' | 'BUYER';
}) {
  const router = useRouter();
  const [role, setRole] = useState<'PROVIDER' | 'BUYER'>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(formData.entries()), role };
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo crear la cuenta');
      return;
    }
    const data = await res.json();
    router.push(dashboardHref[data.role] ?? '/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['BUYER', 'PROVIDER'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-md border px-4 py-3 text-sm font-medium transition ${
              role === r
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            {r === 'BUYER' ? 'Soy comprador' : 'Soy proveedor'}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="name">
            Nombre completo
          </label>
          <input id="name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="companyName">
            Empresa
          </label>
          <input id="companyName" name="companyName" className="input" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="country">
            País
          </label>
          <input id="country" name="country" className="input" placeholder="Colombia" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Teléfono
          </label>
          <input id="phone" name="phone" className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="email">
          Correo electrónico
        </label>
        <input id="email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contraseña (mínimo 8 caracteres)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="input"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  );
}
