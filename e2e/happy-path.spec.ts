import { test } from '@playwright/test';
import { buildDemoFlow } from '../src/lib/demoFlow';
import { runFlow } from './runner';

// Flujo de negocio completo extremo a extremo:
// proveedor publica -> admin aprueba -> comprador cotiza -> admin acepta
// (genera OC) -> proveedor avanza la orden -> comprador ve el seguimiento
// -> asesoría con pago demo.
//
// Usa un identificador único por ejecución para ser idempotente.

test('flujo completo de negocio (happy path)', async ({ page }) => {
  test.setTimeout(180_000);
  const steps = buildDemoFlow();
  await runFlow(page, steps);
});
