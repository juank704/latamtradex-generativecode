import { test, expect } from '@playwright/test';
import { loginSteps, DEMO_USERS } from '../src/lib/demoFlow';
import { runFlow } from './runner';

// Login de los 3 roles + control de acceso por rol.

const expectedDashboard: Record<keyof typeof DEMO_USERS, RegExp> = {
  ADMIN: /\/dashboard\/admin/,
  PROVIDER: /\/dashboard\/proveedor/,
  BUYER: /\/dashboard\/comprador/
};

for (const role of ['ADMIN', 'PROVIDER', 'BUYER'] as const) {
  test(`login como ${role} redirige a su panel`, async ({ page }) => {
    await runFlow(page, loginSteps(role));
    await expect(page).toHaveURL(expectedDashboard[role]);
  });
}

test('un BUYER no puede acceder al panel de ADMIN', async ({ page }) => {
  await runFlow(page, loginSteps('BUYER'));
  await page.goto('/dashboard/admin');
  // El control de acceso lo expulsa del panel de ADMIN (redirige fuera).
  await expect(page).not.toHaveURL(/\/dashboard\/admin/);
});

test('una visita anónima al panel redirige a login', async ({ page }) => {
  await page.goto('/dashboard/admin');
  await expect(page).toHaveURL(/\/login/);
});
