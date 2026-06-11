// Pruebas del componente UI del Panel del Comprador: la linea de tiempo
// (PurchaseOrderTracker) que muestra el avance de la Orden de Compra.

import { render, screen } from '@testing-library/react';
import PurchaseOrderTracker from '@/app/dashboard/comprador/PurchaseOrderTracker';
import { PURCHASE_ORDER_FLOW } from '@/lib/purchaseOrder';

const STEP_LABELS = ['Generada', 'Programada', 'Preparando', 'Lista', 'Enviada', 'Entregada'];

describe('Panel del Comprador — línea de tiempo de la orden', () => {
  it('renderiza los 6 pasos de la máquina de estados', () => {
    render(<PurchaseOrderTracker status="GENERATED" />);
    for (const label of STEP_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('en cada estado marca como completados los pasos anteriores', () => {
    // Recorremos el flujo feliz y verificamos el número de pasos "✓".
    PURCHASE_ORDER_FLOW.forEach((status, index) => {
      const { unmount } = render(<PurchaseOrderTracker status={status} />);
      // Los pasos completados (anteriores al actual) muestran un check.
      // queryAllByText devuelve [] cuando no hay ninguno (índice 0), sin lanzar error.
      expect(screen.queryAllByText('✓')).toHaveLength(index);
      unmount();
    });
  });

  it('resalta el paso activo con el estilo de marca', () => {
    render(<PurchaseOrderTracker status="SHIPPED" />);
    expect(screen.getByText('Enviada')).toHaveClass('text-brand-700');
  });

  it('al inicio (GENERATED) ningún paso está completado', () => {
    render(<PurchaseOrderTracker status="GENERATED" />);
    expect(screen.queryAllByText('✓')).toHaveLength(0);
  });

  it('al final (DELIVERED) los 5 pasos previos están completados', () => {
    render(<PurchaseOrderTracker status="DELIVERED" />);
    expect(screen.getAllByText('✓')).toHaveLength(5);
  });

  it('cuando la orden está cancelada muestra un aviso y oculta la línea de tiempo', () => {
    render(<PurchaseOrderTracker status="CANCELED" />);
    expect(screen.getByText(/cancelada/i)).toBeInTheDocument();
    expect(screen.queryByText('Entregada')).not.toBeInTheDocument();
  });
});
