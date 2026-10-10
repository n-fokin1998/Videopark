---
paths:
  - "src/**"
  - "astro.config.*"
  - "package.json"
  - "scripts/**"
---

# Performance rules

Budgets: [docs/architecture.md §8](../../docs/architecture.md#8-performance-budgets) — LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.05 on mid-range Android / Slow 4G;
first-load JS ≤ 60 KB gz on content pages, ≤ 120 KB on Платформа.

- Ship HTML/CSS first. Every new island or dependency must justify its bytes; check bundle impact (`astro build` output / rollup visualizer).
- Heavy libraries (GSAP plugins, Lenis, OGL, Pagefind UI, lightbox code, SoundCloud widget) are **dynamic imports** triggered by need
  (visibility, interaction, idle) — never top-level imports in globally loaded code.
- Images: `astro:assets` with AVIF/WebP, correct `sizes`, lazy by default; exactly one eager/high-priority LCP image per page; `aspect-ratio` reserved.
- Fonts: self-hosted, subset (cyrillic + cyrillic-ext + latin), variable where possible, `font-display: swap`, preload ≤ 2 files, metric-matched fallbacks.
- Audio: `preload="none"` until play; peaks JSON fetched on demand; no decoding whole files for waveforms on the client.
- Video: facades; `<video preload="none" poster>`.
- Third-party origins: none on initial load. `preconnect` only right before an embed is activated.
- Prefetch: ClientRouter `prefetch` on hover/viewport for next-station links; don't prefetch heavy media.
- Avoid long tasks: chunk heavy work, use `requestIdleCallback`, keep rAF loops paused when hidden/off-screen.
- CSS: keep global CSS small; component styles scoped; no unused font weights.
- Lighthouse CI runs on PRs; a regression over budget blocks merge unless recorded in `docs/decisions.md` with a reason.
