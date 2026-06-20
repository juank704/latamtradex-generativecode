import { defineConfig, devices } from '@playwright/test';

// baseURL configurable: por defecto el servidor local; puede apuntar a la URL desplegada.
//   E2E_BASE_URL=https://latamtradex-actividad1.azucarsintactica.com
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Solo levantamos el servidor local cuando NO se apunta a una URL externa.
const usesLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL,
    trace: 'on', // time-travel: screenshots de cada paso (no requiere ffmpeg)
    // El vídeo requiere ffmpeg (no disponible en la imagen Alpine); usamos
    // trace + screenshots, que cubren la revisión paso a paso.
    video: 'off',
    screenshot: 'only-on-failure',
    launchOptions: {
      // En Docker usamos el Chromium del sistema (Alpine) y --no-sandbox.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      slowMo: process.env.E2E_SLOWMO ? Number(process.env.E2E_SLOWMO) : 0
    }
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: usesLocalServer
    ? {
        command: 'npm run e2e:server',
        url: baseURL,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          NODE_ENV: 'production',
          DATABASE_URL: 'file:./e2e.db',
          AUTH_SECRET: 'e2e-secret-de-pruebas-suficientemente-largo-32b',
          STRIPE_SECRET_KEY: 'sk_test_replace_me',
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_replace_me',
          NEXT_PUBLIC_APP_URL: baseURL
        }
      }
    : undefined
});
