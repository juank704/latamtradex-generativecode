import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const roleStyles: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  PROVIDER: 'bg-emerald-100 text-emerald-800',
  BUYER: 'bg-sky-100 text-sky-800'
};

export default async function AdminUsuariosPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Usuarios</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Empresa</th>
              <th className="text-left p-3">País</th>
              <th className="text-left p-3">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3 font-medium text-slate-900">{u.name}</td>
                <td className="p-3 text-slate-600">{u.email}</td>
                <td className="p-3">
                  <span className={`badge ${roleStyles[u.role] ?? 'bg-slate-100'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-slate-600">{u.companyName ?? '—'}</td>
                <td className="p-3 text-slate-600">{u.country ?? '—'}</td>
                <td className="p-3 text-slate-600">
                  {new Date(u.createdAt).toLocaleDateString('es-CO')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
