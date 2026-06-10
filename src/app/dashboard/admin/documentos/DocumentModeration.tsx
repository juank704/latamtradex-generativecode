'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Doc = {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  approvalStatus: string;
  rejectionReason: string | null;
  providerName: string;
  productName: string | null;
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

export default function DocumentModeration({ documents }: { documents: Doc[] }) {
  if (documents.length === 0) {
    return <p className="text-slate-500 text-sm">No hay documentos para moderar.</p>;
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="text-left p-3">Documento</th>
            <th className="text-left p-3">Proveedor</th>
            <th className="text-left p-3">Producto</th>
            <th className="text-left p-3">Estado</th>
            <th className="text-right p-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {documents.map((d) => (
            <DocRow key={d.id} doc={d} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocRow({ doc }: { doc: Doc }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function moderate(approvalStatus: 'APPROVED' | 'REJECTED') {
    setLoading(approvalStatus);
    let rejectionReason: string | undefined;
    if (approvalStatus === 'REJECTED') {
      rejectionReason = window.prompt('Motivo del rechazo (opcional):') ?? undefined;
    }
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus, rejectionReason })
    });
    setLoading(null);
    if (res.ok) router.refresh();
  }

  return (
    <tr>
      <td className="p-3">
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-brand-700 hover:underline"
        >
          {doc.title}
        </a>
        <p className="text-xs text-slate-400">{doc.type}</p>
        {doc.approvalStatus === 'REJECTED' && doc.rejectionReason && (
          <p className="text-xs text-red-600 mt-0.5">{doc.rejectionReason}</p>
        )}
      </td>
      <td className="p-3 text-slate-600">{doc.providerName}</td>
      <td className="p-3 text-slate-600">{doc.productName ?? '—'}</td>
      <td className="p-3">
        <span className={`badge ${statusStyles[doc.approvalStatus]}`}>
          {statusLabels[doc.approvalStatus] ?? doc.approvalStatus}
        </span>
      </td>
      <td className="p-3 text-right space-x-2 whitespace-nowrap">
        <button
          onClick={() => moderate('APPROVED')}
          disabled={loading !== null}
          className="text-xs text-green-700 hover:underline"
        >
          Aprobar
        </button>
        <button
          onClick={() => moderate('REJECTED')}
          disabled={loading !== null}
          className="text-xs text-red-600 hover:underline"
        >
          Rechazar
        </button>
      </td>
    </tr>
  );
}
