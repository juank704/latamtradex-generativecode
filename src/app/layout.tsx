import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoRunnerMount from '@/components/DemoRunner';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Latamtradex - Operador logístico para exportaciones',
  description:
    'Conectamos proveedores latinoamericanos con compradores en el exterior, eliminando la fricción aduanera.'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Navbar session={session} />
        <main className="flex-1">{children}</main>
        <Footer />
        <DemoRunnerMount />
      </body>
    </html>
  );
}
