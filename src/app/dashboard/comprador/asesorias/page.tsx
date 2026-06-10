import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELED: 'bg-slate-200 text-slate-600'
};

export default async function MisAsesoriasPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const orders = await prisma.advisoryOrder.findMany({
    where: { buyerId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { service: { select: { title: true, durationHrs: true } } }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mis asesorías</h1>
        <Link href="/asesorias" className="btn-primary">
          Contratar otra
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          Aún no has contratado asesorías.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left p-3">Servicio</th>
                <th className="text-left p-3">Monto</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-3 font-medium text-slate-900">
                    {o.service.title}
                    <p className="text-xs text-slate-500 mt-0.5">
                      {o.service.durationHrs} h estimadas
                    </p>
                  </td>
                  <td className="p-3 text-slate-700">USD {o.amountUsd.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`badge ${statusStyles[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="p-3 text-slate-600">
                    {new Date(o.createdAt).toLocaleDateString('es-CO')}
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
