/**
 * @jest-environment node
 */
// Pruebas de la maquina de estados de la Orden de Compra.
// Simulan el ciclo de vida GENERATED -> SCHEDULED -> PREPARING -> ... -> DELIVERED
// y verifican que las transiciones invalidas se rechazan.

import {
  canTransition,
  getNextStates,
  requiresDeadlineBeforeAdvancing,
  statusAfterDeadlineSet,
  isTerminal,
  PURCHASE_ORDER_FLOW,
  type PurchaseOrderStatus
} from '@/lib/purchaseOrder';

describe('Regla de negocio: fecha límite antes de avanzar', () => {
  it('una orden GENERATED exige fijar la fecha límite antes de avanzar', () => {
    expect(requiresDeadlineBeforeAdvancing('GENERATED')).toBe(true);
  });

  it('fijar la fecha límite mueve GENERATED -> SCHEDULED', () => {
    expect(statusAfterDeadlineSet('GENERATED')).toBe('SCHEDULED');
  });

  it('fijar la fecha límite en otros estados no cambia el estado', () => {
    expect(statusAfterDeadlineSet('PREPARING')).toBe('PREPARING');
  });
});

describe('Transiciones válidas del flujo feliz', () => {
  it('permite SCHEDULED -> PREPARING -> READY -> SHIPPED -> DELIVERED', () => {
    expect(canTransition('SCHEDULED', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'READY')).toBe(true);
    expect(canTransition('READY', 'SHIPPED')).toBe(true);
    expect(canTransition('SHIPPED', 'DELIVERED')).toBe(true);
  });

  it('simula el ciclo de vida completo paso a paso', () => {
    // Arranca en GENERATED; el proveedor fija la fecha => SCHEDULED.
    let status: PurchaseOrderStatus = 'GENERATED';
    status = statusAfterDeadlineSet(status);
    expect(status).toBe('SCHEDULED');

    // Recorre el resto del flujo feliz validando cada salto.
    const happyPath: PurchaseOrderStatus[] = ['PREPARING', 'READY', 'SHIPPED', 'DELIVERED'];
    for (const next of happyPath) {
      expect(canTransition(status, next)).toBe(true);
      status = next;
    }
    expect(status).toBe('DELIVERED');
    expect(isTerminal(status)).toBe(true);
  });
});

describe('Transiciones inválidas', () => {
  it('no permite saltarse pasos (SCHEDULED -> DELIVERED)', () => {
    expect(canTransition('SCHEDULED', 'DELIVERED')).toBe(false);
  });

  it('no permite retroceder (SHIPPED -> PREPARING)', () => {
    expect(canTransition('SHIPPED', 'PREPARING')).toBe(false);
  });

  it('no permite avanzar desde un estado terminal (DELIVERED / CANCELED)', () => {
    expect(getNextStates('DELIVERED')).toHaveLength(0);
    expect(getNextStates('CANCELED')).toHaveLength(0);
    expect(isTerminal('DELIVERED')).toBe(true);
    expect(isTerminal('CANCELED')).toBe(true);
  });
});

describe('Cancelación', () => {
  it('se puede cancelar desde GENERATED, SCHEDULED y PREPARING', () => {
    expect(canTransition('GENERATED', 'CANCELED')).toBe(true);
    expect(canTransition('SCHEDULED', 'CANCELED')).toBe(true);
    expect(canTransition('PREPARING', 'CANCELED')).toBe(true);
  });

  it('no se puede cancelar una orden ya despachada', () => {
    expect(canTransition('SHIPPED', 'CANCELED')).toBe(false);
  });
});

describe('Consistencia del flujo declarado', () => {
  it('PURCHASE_ORDER_FLOW está en el orden esperado', () => {
    expect(PURCHASE_ORDER_FLOW).toEqual([
      'GENERATED',
      'SCHEDULED',
      'PREPARING',
      'READY',
      'SHIPPED',
      'DELIVERED'
    ]);
  });
});
