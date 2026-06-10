import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isActive: true, approvalStatus: 'APPROVED' },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { provider: { select: { companyName: true, country: true } } }
  });

  return (
    <>
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="badge bg-brand-500/30 text-brand-50 mb-4">
              Operador logístico profesional
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Exporta sin fricciones aduaneras
            </h1>
            <p className="text-brand-100 text-lg mb-6">
              Latamtradex conecta proveedores latinoamericanos con compradores en Chile, Perú y
              otros mercados. Nos encargamos de la documentación, logística y aduanas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-primary bg-white text-brand-700 hover:bg-brand-50">
                Ver catálogo
              </Link>
              <Link href="/asesorias" className="btn-secondary bg-transparent text-white ring-white/40 hover:bg-white/10">
                Asesorías
              </Link>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 ring-1 ring-white/20">
            <h3 className="font-semibold text-lg mb-4">¿Cómo funciona?</h3>
            <ol className="space-y-3 text-sm text-brand-50">
              <li>
                <strong className="text-white">1. Explora el catálogo</strong> — productos con
                certificaciones de calidad para exportación.
              </li>
              <li>
                <strong className="text-white">2. Solicita una cotización</strong> — Latamtradex
                calcula el costo total puerta a puerta.
              </li>
              <li>
                <strong className="text-white">3. Cierra la operación</strong> — nos encargamos
                de aduanas, documentación y transporte.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="nosotros" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Productos destacados</h2>
        <p className="text-slate-600 mb-8">
          Una muestra de proveedores verificados listos para exportación.
        </p>
        {featured.length === 0 ? (
          <p className="text-slate-500">Aún no hay productos publicados.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link href="/catalogo" className="btn-secondary">
            Ver todo el catálogo
          </Link>
        </div>
      </section>

      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Para proveedores',
              body: 'Sube tu catálogo y documentación técnica. Nosotros gestionamos la operación de exportación.',
              cta: 'Crear cuenta proveedor',
              href: '/registro?role=PROVIDER'
            },
            {
              title: 'Para compradores',
              body: 'Cotiza productos con todo incluido: precio, flete, aduana y entrega final.',
              cta: 'Crear cuenta comprador',
              href: '/registro?role=BUYER'
            },
            {
              title: 'Asesorías especializadas',
              body: 'Apertura de mercados, certificaciones y optimización logística con expertos.',
              cta: 'Ver servicios',
              href: '/asesorias'
            }
          ].map((b) => (
            <div key={b.title} className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-2">{b.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{b.body}</p>
              <Link href={b.href} className="text-sm font-medium text-brand-700 hover:underline">
                {b.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
