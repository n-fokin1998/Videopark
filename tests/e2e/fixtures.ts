import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * Playwright's WebKit build for Windows crashes the page when the View Transitions API runs on a scrollable document
 * (reproducible on any page taller than the viewport, independent of our styles). There, tests run with the API removed,
 * so Astro's ClientRouter uses its fallback animation — navigation, persistence and focus are still exercised.
 * Real Safari (macOS/iOS) is checked manually in the roadmap phase 8 QA matrix (docs/decisions.md D-026).
 */
export const test = base.extend<{ webkitWindowsWorkaround: void }>({
  webkitWindowsWorkaround: [
    async ({ page, browserName }, use) => {
      if (browserName === 'webkit' && process.platform === 'win32') {
        await page.addInitScript(() => {
          delete (Document.prototype as Partial<Document>).startViewTransition;
        });
      }
      await use();
    },
    { auto: true },
  ],
});
