export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white font-bold">
              L
            </span>
            <span className="font-semibold text-white">Latamtradex</span>
          </div>
          <p className="text-sm">
            Operador logístico que conecta proveedores latinoamericanos con compradores en el
            exterior, eliminando la fricción aduanera.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Plataforma</h4>
          <ul className="space-y-2 text-sm">
            <li>Catálogo público de exportación</li>
            <li>Cotizaciones logísticas integrales</li>
            <li>Asesorías especializadas</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li>contacto@latamtradex.com</li>
            <li>Bogotá, Colombia</li>
            <li>+57 1 000 0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Latamtradex. Todos los derechos reservados.
      </div>
    </footer>
  );
}
