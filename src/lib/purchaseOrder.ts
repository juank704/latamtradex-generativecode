// ============================================================
// Maquina de estados de la Orden de Compra (PurchaseOrder)
// Fuente unica de verdad usada por la API, el panel del proveedor
// y los tests automatizados.
// ============================================================

export const PURCHASE_ORDER_STATUSES = [
  'GENERATED',
  'SCHEDULED',
  'PREPARING',
  'READY',
  'SHIPPED',
  'DELIVERED',
  'CANCELED'
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

// Etiquetas legibles en español.
export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  GENERATED: 'Generada',
  SCHEDULED: 'Programada',
  PREPARING: 'Preparando',
  READY: 'Lista',
  SHIPPED: 'Despachada',
  DELIVERED: 'Entregada',
  CANCELED: 'Cancelada'
};

// Secuencia "feliz" del pedido (sin contar la cancelacion).
export const PURCHASE_ORDER_FLOW: PurchaseOrderStatus[] = [
  'GENERATED',
  'SCHEDULED',
  'PREPARING',
  'READY',
  'SHIPPED',
  'DELIVERED'
];

// Transiciones permitidas que el proveedor/admin puede ejecutar manualmente.
// Nota: GENERATED -> SCHEDULED NO se hace por aqui; ocurre al fijar la fecha
// limite de preparacion (ver statusAfterDeadlineSet).
export const PURCHASE_ORDER_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  GENERATED: ['CANCELED'],
  SCHEDULED: ['PREPARING', 'CANCELED'],
  PREPARING: ['READY', 'CANCELED'],
  READY: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELED: []
};

/** Devuelve los estados a los que se puede avanzar manualmente desde `status`. */
export function getNextStates(status: PurchaseOrderStatus): PurchaseOrderStatus[] {
  return PURCHASE_ORDER_TRANSITIONS[status] ?? [];
}

/** Indica si la transicion `from -> to` es valida en la maquina de estados. */
export function canTransition(from: PurchaseOrderStatus, to: PurchaseOrderStatus): boolean {
  return getNextStates(from).includes(to);
}

/** Regla de negocio: en estado GENERATED hay que fijar la fecha limite antes de avanzar. */
export function requiresDeadlineBeforeAdvancing(status: PurchaseOrderStatus): boolean {
  return status === 'GENERATED';
}

/** Estado resultante tras fijar la fecha limite de preparacion. */
export function statusAfterDeadlineSet(current: PurchaseOrderStatus): PurchaseOrderStatus {
  return current === 'GENERATED' ? 'SCHEDULED' : current;
}

/** True si el estado es terminal (no admite mas avances). */
export function isTerminal(status: PurchaseOrderStatus): boolean {
  return getNextStates(status).length === 0;
}
