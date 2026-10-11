// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// The production domain is chosen in roadmap phase 9 (D-018). Until then canonical URLs and the sitemap
// point at the local preview origin; set SITE_URL to override.
const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [svelte(), sitemap()],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  i18n: {
    // Keep in sync with src/i18n/config.ts. uk/en pages are generated only once enabled there.
    locales: ['ru', 'uk', 'en'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
  devToolbar: { enabled: false },
});
