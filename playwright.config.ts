import { defineConfig, devices } from '@playwright/test';

const port = 4321;
const baseURL = `http://localhost:${port}`;

/**
 * E2E + accessibility against the static build (`astro preview`), never the dev server.
 * `pnpm verify` builds first and sets E2E_SKIP_BUILD=1; a plain `pnpm test:e2e` builds itself.
 * Projects: desktop (Chromium, Firefox, WebKit) and mobile (360×740 Android Chromium, 390×844 iOS WebKit, 740×360 landscape).
 * E2E_SKIP_FIREFOX=1 drops Firefox on machines where Playwright's Firefox build cannot start.
 */
const skipFirefox = Boolean(process.env.E2E_SKIP_FIREFOX);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    locale: 'ru-RU',
  },
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? 'pnpm preview' : 'pnpm build && pnpm preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    ...(skipFirefox
      ? []
      : [{ name: 'desktop-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } } }]),
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 15'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'mobile-landscape',
      use: { ...devices['Pixel 7 landscape'], viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true },
    },
  ],
});
