// Linea de tiempo del estado de una Orden de Compra para el comprador.
// Estados felices en orden; CANCELED se muestra aparte.

const STEPS = [
  { key: 'GENERATED', label: 'Generada' },
  { key: 'SCHEDULED', label: 'Programada' },
  { key: 'PREPARING', label: 'Preparando' },
  { key: 'READY', label: 'Lista' },
  { key: 'SHIPPED', label: 'Enviada' },
  { key: 'DELIVERED', label: 'Entregada' }
] as const;

export default function PurchaseOrderTracker({ status }: { status: string }) {
  if (status === 'CANCELED') {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
        Esta orden de compra fue cancelada.
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex items-center w-full overflow-x-auto">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.key} className="flex items-center flex-1 min-w-[90px] last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-2',
                  done
                    ? 'bg-brand-600 text-white ring-brand-600'
                    : active
                      ? 'bg-white text-brand-700 ring-brand-600'
                      : 'bg-white text-slate-400 ring-slate-300'
                ].join(' ')}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={[
                  'mt-1 text-[11px] text-center whitespace-nowrap',
                  active ? 'font-semibold text-brand-700' : 'text-slate-500'
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={[
                  'h-0.5 flex-1 mx-1',
                  i < currentIndex ? 'bg-brand-600' : 'bg-slate-200'
                ].join(' ')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
