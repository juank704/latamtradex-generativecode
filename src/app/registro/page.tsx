import Link from 'next/link';
import RegisterForm from './RegisterForm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RegisterPage({
  searchParams
}: {
  searchParams: { role?: string };
}) {
  const session = await getSession();
  if (session) redirect('/');
  const initialRole =
    searchParams.role === 'PROVIDER' || searchParams.role === 'BUYER'
      ? searchParams.role
      : 'BUYER';
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Crear cuenta</h1>
      <p className="text-sm text-slate-600 mb-6">
        Selecciona tu perfil para acceder a las herramientas adecuadas.
      </p>
      <RegisterForm initialRole={initialRole} />
      <p className="mt-6 text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-brand-700 font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
