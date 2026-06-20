// Ejecutor de pasos del flujo compartido sobre el DOM real (para el overlay
// de demo). Implementa el mismo contrato que el runner de Playwright, pero
// manipulando elementos del navegador y resaltándolos visualmente.

import type { DemoStep } from '@/lib/demoFlow';

const HIGHLIGHT_CLASS = 'lt-demo-highlight';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Espera a que aparezca un elemento por data-testid (con polling). */
async function waitForTestid(testid: string, timeout = 12000): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector<HTMLElement>(`[data-testid="${testid}"]`);
    if (el) return el;
    await sleep(150);
  }
  throw new Error(`No se encontró el elemento [data-testid="${testid}"]`);
}

/** Espera una fila (contenedor) que contenga cierto texto. */
async function waitForRow(
  rowTestid: string,
  text: string,
  timeout = 12000
): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-testid="${rowTestid}"]`)
    );
    const match = candidates.find((el) => (el.textContent ?? '').includes(text));
    if (match) return match;
    await sleep(150);
  }
  throw new Error(`No se encontró la fila "${rowTestid}" con texto "${text}"`);
}

/** Espera a que la ruta (pathname) cumpla una condición, sin lanzar si expira. */
async function waitForPath(pred: (path: string) => boolean, timeout = 12000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (pred(window.location.pathname)) return;
    await sleep(150);
  }
}

function highlight(el: HTMLElement) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add(HIGHLIGHT_CLASS);
}
function clearHighlight(el: HTMLElement) {
  el.classList.remove(HIGHLIGHT_CLASS);
}

/** Setea el valor en un input/textarea controlado por React y dispara el evento. */
function setReactValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function setReactSelect(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export interface StepResult {
  navigated: boolean; // true si el paso provoca una recarga de página
}

/** Ejecuta un único paso sobre el DOM. Devuelve si provocó navegación. */
export async function executeStepOnDom(step: DemoStep): Promise<StepResult> {
  switch (step.action) {
    case 'navigate': {
      // Navegación con recarga completa: el overlay se re-montará y continuará.
      window.location.assign(step.path!);
      return { navigated: true };
    }

    case 'fill': {
      const el = await waitForTestid(step.testid!);
      highlight(el);
      await sleep(250);
      setReactValue(el as HTMLInputElement, step.value!);
      clearHighlight(el);
      return { navigated: false };
    }

    case 'select': {
      const el = await waitForTestid(step.testid!);
      highlight(el);
      await sleep(250);
      setReactSelect(el as HTMLSelectElement, step.value!);
      clearHighlight(el);
      return { navigated: false };
    }

    case 'check': {
      const el = await waitForTestid(step.testid!);
      highlight(el);
      await sleep(250);
      (el as HTMLInputElement).click();
      clearHighlight(el);
      return { navigated: false };
    }

    case 'click': {
      const el = await waitForTestid(step.testid!);
      highlight(el);
      await sleep(350);
      el.click();
      clearHighlight(el);

      // El botón de contratar dispara fetch + redirección completa
      // (window.location.href = /checkout/success). Lo tratamos como NAVEGACIÓN
      // para que el runner persista el avance del índice ANTES de que la página
      // se descargue; así al recargar continúa en el paso siguiente y no repite
      // este sobre la página de éxito.
      if (step.testid === 'asesoria-contratar') {
        return { navigated: true };
      }

      // login/logout son navegaciones del lado del cliente (router.push): la
      // página no se descarga, así que esperamos a que la ruta cambie de verdad
      // (la cookie de sesión ya está aplicada cuando cambia el pathname).
      if (step.testid === 'login-submit') {
        await waitForPath((p) => p.startsWith('/dashboard/'), 15000);
        await sleep(400);
      } else if (step.testid === 'nav-logout') {
        await waitForPath((p) => p === '/', 12000);
        await sleep(400);
      } else {
        await sleep(600);
      }
      return { navigated: false };
    }

    case 'clickInRow': {
      const row = await waitForRow(step.rowTestid!, step.rowText!);
      highlight(row);
      await sleep(350);
      if (step.buttonTestid) {
        const btn = row.querySelector<HTMLElement>(`[data-testid="${step.buttonTestid}"]`);
        if (!btn) throw new Error(`Botón "${step.buttonTestid}" no está en la fila`);
        btn.click();
      } else {
        row.click();
      }
      clearHighlight(row);
      await sleep(600);
      return { navigated: false };
    }

    case 'expectText': {
      // Espera (poll) a que el texto aparezca: tras una redirección la página
      // puede tardar en montar el contenido (p. ej. /checkout/success).
      const start = Date.now();
      while (Date.now() - start < 12000) {
        if ((document.body.innerText ?? '').includes(step.value!)) {
          return { navigated: false };
        }
        await sleep(200);
      }
      throw new Error(`No se encontró el texto esperado: "${step.value}"`);
    }

    default:
      throw new Error(`Acción no soportada en el overlay: ${(step as DemoStep).action}`);
  }
}
