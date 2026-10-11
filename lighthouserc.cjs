// Lighthouse budgets (docs/architecture.md §8), run locally against `astro preview` until hosted CI (roadmap phase 9).
// Mobile emulation is Lighthouse's default. Reports stay on disk (.lighthouseci/) — never uploaded.
// Uses the locally installed Chrome; set CHROME_PATH to use another build (e.g. Playwright's Chromium).
// Keep in sync with src/lib/stations.ts.
const routes = ['/', '/music', '/history', '/lyrics', '/photos', '/video', '/brovary', '/zhenya', '/about'];

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --host 127.0.0.1',
      startServerReadyPattern: 'localhost:4321',
      url: routes.map((route) => `http://127.0.0.1:4321${route}`),
      numberOfRuns: 1,
      ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
      // --no-proxy-server: skip proxy auto-detection (WPAD), which stalls the first request ~20 s on some networks.
      settings: { chromeFlags: '--headless=new --no-proxy-server' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
