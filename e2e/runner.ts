import { expect, type Page } from '@playwright/test';
import type { DemoStep } from '../src/lib/demoFlow';

// Adaptador de Playwright que ejecuta la definición compartida de pasos
// (src/lib/demoFlow.ts). El overlay de demo implementa el mismo contrato
// sobre el DOM real.

export async function runStep(page: Page, step: DemoStep): Promise<void> {
  switch (step.action) {
    case 'navigate':
      await page.goto(step.path!);
      await page.waitForLoadState('domcontentloaded');
      break;

    case 'fill':
      await page.getByTestId(step.testid!).fill(step.value!);
      break;

    case 'select':
      await page.getByTestId(step.testid!).selectOption(step.value!);
      break;

    case 'check':
      await page.getByTestId(step.testid!).check();
      break;

    case 'click': {
      await page.getByTestId(step.testid!).first().click();
      // Tras enviar el login, esperar la redirección al panel.
      if (step.testid === 'login-submit') {
        await page.waitForURL(/\/dashboard\//, { timeout: 15_000 }).catch(() => {});
      }
      // Tras cerrar sesión, esperar la vuelta al inicio.
      if (step.testid === 'nav-logout') {
        await page.waitForURL(/\/$|\/$/, { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(300);
      }
      break;
    }

    case 'clickInRow': {
      const row = page
        .getByTestId(step.rowTestid!)
        .filter({ hasText: step.rowText! })
        .first();
      await expect(row).toBeVisible();
      if (step.buttonTestid) {
        await row.getByTestId(step.buttonTestid).first().click();
      } else {
        await row.click();
      }
      break;
    }

    case 'expectText':
      await expect(page.getByText(step.value!, { exact: false }).first()).toBeVisible();
      break;

    default:
      throw new Error(`Acción no soportada: ${(step as DemoStep).action}`);
  }
}

export async function runFlow(page: Page, steps: DemoStep[]): Promise<void> {
  for (const step of steps) {
    await runStep(page, step);
  }
}
