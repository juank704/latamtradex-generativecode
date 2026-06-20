/**
 * @jest-environment node
 */
// Verifica la definición compartida del flujo (consumida por Playwright y el overlay).

import { buildDemoFlow, loginSteps, DEMO_USERS, DEMO_PASSWORD } from '@/lib/demoFlow';

describe('Definición compartida del flujo de demo', () => {
  it('loginSteps genera 4 pasos con las credenciales del rol', () => {
    const steps = loginSteps('ADMIN');
    expect(steps).toHaveLength(4);
    expect(steps.find((s) => s.testid === 'login-email')?.value).toBe(DEMO_USERS.ADMIN);
    expect(steps.find((s) => s.testid === 'login-password')?.value).toBe(DEMO_PASSWORD);
  });

  it('buildDemoFlow produce un flujo no vacío con ids únicos', () => {
    const steps = buildDemoFlow('123456');
    expect(steps.length).toBeGreaterThan(20);
    const ids = steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('el flujo cubre los hitos clave del negocio', () => {
    const steps = buildDemoFlow('123456');
    const ids = steps.map((s) => s.id);
    expect(ids).toContain('prov-submit'); // proveedor publica
    expect(ids).toContain('admin-approve-product'); // admin aprueba
    expect(ids).toContain('buyer-quote-submit'); // comprador cotiza
    expect(ids).toContain('admin-quote-save'); // admin acepta (genera OC)
    expect(ids).toContain('prov-order-advance-DELIVERED'); // proveedor entrega
    expect(ids).toContain('buyer-pago-ok'); // asesoría pagada
  });
});
