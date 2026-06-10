import Link from 'next/link';
import LoginForm from './LoginForm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/');
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Ingresar</h1>
      <p className="text-sm text-slate-600 mb-6">
        Accede a tu cuenta de Latamtradex.
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-slate-600">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-brand-700 font-medium hover:underline">
          Regístrate aquí
        </Link>
      </p>
      <div className="mt-8 p-4 rounded-md bg-slate-100 text-xs text-slate-600">
        <strong>Demo:</strong> admin@latamtradex.com / proveedor@latamtradex.com /
        comprador@latamtradex.com — clave <code>Latamtradex2026!</code>
      </div>
    </div>
  );
}
