// ============================================================
// Definición compartida del flujo de negocio de Latamtradex.
// Se define UNA sola vez y la consumen:
//   - Los tests E2E de Playwright  (e2e/runner.ts)
//   - El overlay de demo en la app (src/components/DemoRunner)
//
// Cada paso es declarativo (acción + selector data-testid + valor +
// descripción). Cada "runner" implementa cómo ejecutar cada acción.
// ============================================================

export type DemoRole = 'PUBLIC' | 'ADMIN' | 'PROVIDER' | 'BUYER';

export type DemoAction =
  | 'navigate' // ir a una ruta (path)
  | 'fill' // escribir en un input/textarea (testid, value)
  | 'select' // elegir opción en un <select> (testid, value)
  | 'check' // marcar un radio/checkbox (testid)
  | 'click' // click en un elemento (testid)
  | 'clickInRow' // click en un botón dentro de una fila identificada por texto
  | 'expectText'; // verificar que cierto texto es visible

export interface DemoStep {
  id: string;
  role: DemoRole;
  description: string;
  action: DemoAction;
  /** data-testid del elemento objetivo (acciones fill/select/check/click). */
  testid?: string;
  /** Valor para fill/select; texto a verificar en expectText. */
  value?: string;
  /** Ruta para navigate. */
  path?: string;
  /** clickInRow: testid del contenedor de fila, texto que debe contener y botón a pulsar. */
  rowTestid?: string;
  rowText?: string;
  buttonTestid?: string;
}

// Credenciales demo cargadas por prisma/seed.ts (clave única).
export const DEMO_PASSWORD = 'Latamtradex2026!';
export const DEMO_USERS = {
  ADMIN: 'admin@latamtradex.com',
  PROVIDER: 'proveedor@latamtradex.com',
  BUYER: 'comprador@latamtradex.com'
} as const;

/** Pasos de inicio de sesión reutilizables para cualquier rol. */
export function loginSteps(role: keyof typeof DEMO_USERS): DemoStep[] {
  return [
    {
      id: `login-${role}-goto`,
      role,
      description: `Ir a la página de login (${role})`,
      action: 'navigate',
      path: '/login'
    },
    {
      id: `login-${role}-email`,
      role,
      description: `Escribir el correo de ${role}`,
      action: 'fill',
      testid: 'login-email',
      value: DEMO_USERS[role]
    },
    {
      id: `login-${role}-password`,
      role,
      description: 'Escribir la contraseña',
      action: 'fill',
      testid: 'login-password',
      value: DEMO_PASSWORD
    },
    {
      id: `login-${role}-submit`,
      role,
      description: 'Enviar el formulario de login',
      action: 'click',
      testid: 'login-submit'
    }
  ];
}

/** Pasos para cerrar sesión (cambio de rol). */
export function logoutSteps(after: DemoRole): DemoStep[] {
  return [
    {
      id: `logout-${after}`,
      role: after,
      description: 'Cerrar sesión',
      action: 'click',
      testid: 'nav-logout'
    }
  ];
}

/**
 * Construye el flujo completo "happy path" extremo a extremo.
 * Usa un sufijo único para que el producto/datos creados sean idempotentes
 * y el flujo se pueda repetir sin colisiones.
 */
export function buildDemoFlow(suffix: string = Date.now().toString().slice(-6)): DemoStep[] {
  const productName = `Café E2E ${suffix}`;
  // Fecha límite ~30 días en el futuro, en formato YYYY-MM-DD para el input date.
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const rawSteps: DemoStep[] = [
    // ---------- 1) PROVEEDOR publica un producto ----------
    ...loginSteps('PROVIDER'),
    {
      id: 'prov-go-productos',
      role: 'PROVIDER',
      description: 'Abrir "Mis productos"',
      action: 'navigate',
      path: '/dashboard/proveedor/productos'
    },
    {
      id: 'prov-new-toggle',
      role: 'PROVIDER',
      description: 'Pulsar "+ Nuevo producto"',
      action: 'click',
      testid: 'prod-new-toggle'
    },
    {
      id: 'prov-name',
      role: 'PROVIDER',
      description: `Nombre del producto: ${productName}`,
      action: 'fill',
      testid: 'prod-name',
      value: productName
    },
    {
      id: 'prov-category',
      role: 'PROVIDER',
      description: 'Categoría',
      action: 'fill',
      testid: 'prod-category',
      value: 'Alimentos'
    },
    {
      id: 'prov-description',
      role: 'PROVIDER',
      description: 'Descripción',
      action: 'fill',
      testid: 'prod-description',
      value: 'Café de especialidad para demostración E2E, tueste medio.'
    },
    {
      id: 'prov-unit',
      role: 'PROVIDER',
      description: 'Unidad',
      action: 'fill',
      testid: 'prod-unit',
      value: 'kg'
    },
    {
      id: 'prov-price',
      role: 'PROVIDER',
      description: 'Precio por unidad',
      action: 'fill',
      testid: 'prod-price',
      value: '9.5'
    },
    {
      id: 'prov-minqty',
      role: 'PROVIDER',
      description: 'Pedido mínimo',
      action: 'fill',
      testid: 'prod-minqty',
      value: '100'
    },
    {
      id: 'prov-city',
      role: 'PROVIDER',
      description: 'Ciudad de origen',
      action: 'fill',
      testid: 'prod-city',
      value: 'Manizales'
    },
    {
      id: 'prov-submit',
      role: 'PROVIDER',
      description: 'Publicar producto (queda "En revisión")',
      action: 'click',
      testid: 'prod-submit'
    },
    ...logoutSteps('PROVIDER'),

    // ---------- 2) ADMIN aprueba el producto ----------
    ...loginSteps('ADMIN'),
    {
      id: 'admin-go-productos',
      role: 'ADMIN',
      description: 'Abrir "Moderar productos"',
      action: 'navigate',
      path: '/dashboard/admin/productos'
    },
    {
      id: 'admin-approve-product',
      role: 'ADMIN',
      description: `Aprobar el producto "${productName}"`,
      action: 'clickInRow',
      rowTestid: 'mod-product-row',
      rowText: productName,
      buttonTestid: 'mod-product-approve'
    },
    ...logoutSteps('ADMIN'),

    // ---------- 3) COMPRADOR solicita una cotización ----------
    ...loginSteps('BUYER'),
    {
      id: 'buyer-go-catalogo',
      role: 'BUYER',
      description: 'Abrir el catálogo',
      action: 'navigate',
      path: '/catalogo'
    },
    {
      id: 'buyer-search',
      role: 'BUYER',
      description: `Buscar "${productName}"`,
      action: 'fill',
      testid: 'catalogo-search',
      value: productName
    },
    {
      id: 'buyer-open-product',
      role: 'BUYER',
      description: 'Abrir la ficha del producto',
      action: 'clickInRow',
      rowTestid: 'product-card',
      rowText: productName
      // sin buttonTestid: la tarjeta completa es el enlace, se hace click en ella
    },
    {
      id: 'buyer-qty',
      role: 'BUYER',
      description: 'Cantidad a cotizar',
      action: 'fill',
      testid: 'quote-quantity',
      value: '500'
    },
    {
      id: 'buyer-dest-city',
      role: 'BUYER',
      description: 'Ciudad de destino',
      action: 'fill',
      testid: 'quote-dest-city',
      value: 'Santiago'
    },
    {
      id: 'buyer-dest-country',
      role: 'BUYER',
      description: 'País de destino',
      action: 'fill',
      testid: 'quote-dest-country',
      value: 'Chile'
    },
    {
      id: 'buyer-incoterm',
      role: 'BUYER',
      description: 'Incoterm',
      action: 'select',
      testid: 'quote-incoterm',
      value: 'CIF'
    },
    {
      id: 'buyer-payment-method',
      role: 'BUYER',
      description: 'Forma de pago: Transferencia',
      action: 'check',
      testid: 'quote-pay-TRANSFER'
    },
    {
      id: 'buyer-payment-condition',
      role: 'BUYER',
      description: 'Condición de pago: a la entrega',
      action: 'select',
      testid: 'quote-payment-condition',
      value: 'ON_DELIVERY'
    },
    {
      id: 'buyer-quote-submit',
      role: 'BUYER',
      description: 'Solicitar cotización',
      action: 'click',
      testid: 'quote-submit'
    },
    ...logoutSteps('BUYER'),

    // ---------- 4) ADMIN cotiza y acepta (genera la Orden de Compra) ----------
    ...loginSteps('ADMIN'),
    {
      id: 'admin-go-cotizaciones',
      role: 'ADMIN',
      description: 'Abrir "Cotizaciones"',
      action: 'navigate',
      path: '/dashboard/admin/cotizaciones'
    },
    {
      id: 'admin-quote-logistics-fill',
      role: 'ADMIN',
      description: 'Costo logístico (USD)',
      action: 'fill',
      testid: 'admin-quote-logistics',
      value: '1200'
    },
    {
      id: 'admin-quote-customs-fill',
      role: 'ADMIN',
      description: 'Costo aduanero (USD)',
      action: 'fill',
      testid: 'admin-quote-customs',
      value: '650'
    },
    {
      id: 'admin-quote-status',
      role: 'ADMIN',
      description: 'Estado: Aceptado',
      action: 'select',
      testid: 'admin-quote-status',
      value: 'ACCEPTED'
    },
    {
      id: 'admin-quote-save',
      role: 'ADMIN',
      description: 'Guardar (genera Orden de Compra)',
      action: 'click',
      testid: 'admin-quote-save'
    },
    ...logoutSteps('ADMIN'),

    // ---------- 5) PROVEEDOR fija fecha y avanza la orden ----------
    ...loginSteps('PROVIDER'),
    {
      id: 'prov-go-ordenes',
      role: 'PROVIDER',
      description: 'Abrir "Órdenes de compra"',
      action: 'navigate',
      path: '/dashboard/proveedor/ordenes'
    },
    {
      id: 'prov-order-deadline-fill',
      role: 'PROVIDER',
      description: 'Escribir la fecha límite de preparación',
      action: 'fill',
      testid: 'order-deadline-input',
      value: deadline
    },
    {
      id: 'prov-order-deadline-submit',
      role: 'PROVIDER',
      description: 'Confirmar la fecha límite (orden pasa a Programada)',
      action: 'click',
      testid: 'order-deadline-submit'
    },
    {
      id: 'prov-order-advance-PREPARING',
      role: 'PROVIDER',
      description: 'Avanzar a Preparando',
      action: 'click',
      testid: 'order-advance-PREPARING'
    },
    {
      id: 'prov-order-advance-READY',
      role: 'PROVIDER',
      description: 'Avanzar a Lista',
      action: 'click',
      testid: 'order-advance-READY'
    },
    {
      id: 'prov-order-advance-SHIPPED',
      role: 'PROVIDER',
      description: 'Avanzar a Despachada',
      action: 'click',
      testid: 'order-advance-SHIPPED'
    },
    {
      id: 'prov-order-advance-DELIVERED',
      role: 'PROVIDER',
      description: 'Avanzar a Entregada',
      action: 'click',
      testid: 'order-advance-DELIVERED'
    },
    ...logoutSteps('PROVIDER'),

    // ---------- 6) COMPRADOR ve el seguimiento ----------
    ...loginSteps('BUYER'),
    {
      id: 'buyer-go-panel',
      role: 'BUYER',
      description: 'Abrir el panel del comprador (seguimiento)',
      action: 'navigate',
      path: '/dashboard/comprador'
    },
    {
      id: 'buyer-see-tracking',
      role: 'BUYER',
      description: 'Ver el producto en el seguimiento de pedidos',
      action: 'expectText',
      value: productName
    },

    // ---------- 7) Asesorías con pago demo ----------
    {
      id: 'buyer-go-asesorias',
      role: 'BUYER',
      description: 'Abrir "Asesorías"',
      action: 'navigate',
      path: '/asesorias'
    },
    {
      id: 'buyer-contratar',
      role: 'BUYER',
      description: 'Contratar la primera asesoría (pago demo)',
      action: 'click',
      testid: 'asesoria-contratar'
    },
    {
      id: 'buyer-pago-ok',
      role: 'BUYER',
      description: 'Confirmar pago (modo demo)',
      action: 'expectText',
      value: 'Pago confirmado'
    }
  ];

  // Garantiza ids únicos aunque un mismo rol inicie sesión más de una vez.
  const seen = new Map<string, number>();
  return rawSteps.map((s) => {
    const n = (seen.get(s.id) ?? 0) + 1;
    seen.set(s.id, n);
    return n === 1 ? s : { ...s, id: `${s.id}-${n}` };
  });
}

/** Metadatos de la demo para mostrar en el overlay. */
export const DEMO_FLOW_TITLE = 'Demo guiada — Flujo completo Latamtradex';
