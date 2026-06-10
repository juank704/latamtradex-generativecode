'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Doc = {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  productName: string | null;
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

const TYPES = [
  { value: 'CERTIFICATE', label: 'Certificado calidad' },
  { value: 'PHYTOSANITARY', label: 'Certificado fitosanitario' },
  { value: 'QUALITY', label: 'Ficha técnica' },
  { value: 'OTHER', label: 'Otro' }
];

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentManager({
  documents,
  products
}: {
  documents: Doc[];
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await fetch('/api/documents', { method: 'POST', body: formData });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'No se pudo subir el documento');
      return;
    }
    form.reset();
    router.refresh();
  }

  async function onDelete(id: string) {
    if (!confirm('¿Eliminar este documento?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Subir nuevo documento</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Título</label>
            <input name="title" required className="input" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select name="type" className="input" defaultValue="CERTIFICATE">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Asociar a producto (opcional)</label>
          <select name="productId" className="input" defaultValue="">
            <option value="">Sin asociar</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Archivo (PDF, DOC, DOCX, PNG, JPG - máx 8MB)</label>
          <input
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Subiendo...' : 'Subir documento'}
        </button>
      </form>

      {documents.length === 0 ? (
        <p className="text-slate-500 text-sm">Aún no has subido documentos.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left p-3">Documento</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Producto</th>
                <th className="text-left p-3">Aprobación</th>
                <th className="text-left p-3">Tamaño</th>
                <th className="text-left p-3">Subido</th>
                <th className="text-right p-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.map((d) => (
                <tr key={d.id}>
                  <td className="p-3 font-medium text-slate-900">{d.title}</td>
                  <td className="p-3 text-slate-600">{d.type}</td>
                  <td className="p-3 text-slate-600">{d.productName ?? '—'}</td>
                  <td className="p-3">
                    <span className={`badge ${approvalStyles[d.approvalStatus]}`}>
                      {approvalLabels[d.approvalStatus] ?? d.approvalStatus}
                    </span>
                    {d.approvalStatus === 'REJECTED' && d.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">{d.rejectionReason}</p>
                    )}
                  </td>
                  <td className="p-3 text-slate-600">{formatBytes(d.fileSize)}</td>
                  <td className="p-3 text-slate-600">
                    {new Date(d.uploadedAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="p-3 text-right space-x-3">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-700 hover:underline"
                    >
                      Ver
                    </a>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
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
