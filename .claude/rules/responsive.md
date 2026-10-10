---
paths:
  - "src/**/*.astro"
  - "src/**/*.svelte"
  - "src/styles/**"
  - "src/**/*.css"
  - "tests/**"
---

# Responsive & mobile rules

Spec: [docs/design.md §6](../../docs/design.md#6-layout-and-responsive-behaviour). Phones are the primary experience, not a fallback.

- **Mobile-first CSS:** base styles target 360 px phones; enhance upward with `min-width` media queries using breakpoint tokens
  (`--bp-md` 640, `--bp-lg` 960, `--bp-xl` 1280, `--bp-2xl` 1680) or, preferably, **container queries** for components.
- Every component and station must work at **360×740 portrait and landscape**, at tablet sizes, and on wide desktops (cap text width, let
  atmosphere fill extra space). No horizontal page scroll (the desktop timeline scroller is the only intentional exception).
- **Touch parity:** every hover affordance has a tap/focus equivalent; hover-only decoration goes inside `@media (hover: hover)`.
  Play buttons on cards are always visible on touch devices. Hit targets ≥ 44×44 px with ≥ 8 px between neighbours.
- **Viewport units:** use `dvh`/`svh`/`lvh` for full-height scenes, never bare `100vh`. Respect `env(safe-area-inset-*)` (player bar, overlays, lightbox).
- **Gestures:** swipe in the lightbox and to close the player sheet; pinch-zoom allowed on photos; never disable browser zoom (`user-scalable=no` is forbidden).
- **Layouts per station:** single calm column on phones; asymmetric/art-directed layouts only from `--bp-lg`. Timeline is vertical on phones.
  Line map is a full-screen vertical sheet on phones.
- **Lighter on phones:** shorter transitions (≈ 500 ms), shorter arrival (≤ 2.5 s), no WebGL on low-end devices
  (`navigator.deviceMemory`, `hardwareConcurrency`, `prefers-reduced-data` where available), smaller images via correct `sizes`.
- **Typography:** fluid `clamp()` sizes; body ≥ 17 px on phones; lyrics 19–20 px with hanging indent for wrapped lines; no text in images.
- **Fixed UI never covers content:** reserve space for the player bar (body padding) and sticky headers; test with the on-screen keyboard open for forms/search.
- **Testing:** Playwright projects for `mobile` (360×740, touch, iOS WebKit and Android Chromium) and `desktop`; visual check of every route at
  360, 390, 768, 1280, 1920 widths before a station is considered done.
