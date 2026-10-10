---
paths:
  - "src/styles/**"
  - "src/**/*.astro"
  - "src/**/*.svelte"
  - "src/**/*.css"
---

# Styling rules

Visual language: [docs/design.md](../../docs/design.md).

- **Plain CSS + custom properties.** No Tailwind, no CSS-in-JS, no Sass unless a decision says otherwise.
- **Tokens only.** Components use semantic tokens (`--bg`, `--bg-raised`, `--fg`, `--fg-muted`, `--accent`, `--line`, `--focus`, `--space-*`,
  `--fs-*`, `--dur-*`, `--ease-*`, `--radius-*`). No raw hex colours, px font sizes or ad-hoc durations in components.
  New values → add a token in `src/styles/tokens.css` first.
- Theme = `data-theme="dawn|day|evening|night"` on `<html>`; semantic tokens are remapped in `themes.css`. Components must look right in all four.
  `evening` is the default and the SSR/no-JS look.
- Cascade layers: `@layer reset, tokens, base, components, utilities;` Component styles go into `components` (Astro scoped styles count as components).
- Scoped styles by default; `:global()` only in layouts for documented hooks.
- Mobile-first; breakpoints as tokens (`--bp-md`, `--bp-lg`, `--bp-xl`, `--bp-2xl`) or, preferably, **container queries** for components. Full responsive rules: [responsive.md](responsive.md).
- Use logical properties (`margin-inline`, `padding-block`) — ready for any future RTL and cleaner.
- Fluid type and spacing with `clamp()`. Reading measure: prose 60–70ch, lyrics ≤ 36ch.
- Lyrics: `white-space: pre-line` (or explicit `<br>` from the renderer), `hyphens: manual`, never justified.
- Focus: `:focus-visible` ring `2px solid var(--focus)` with offset on every interactive element; never `outline: none` without a replacement.
- Respect `prefers-reduced-motion`, `prefers-contrast: more` (stronger borders, no grain), `forced-colors: active` (system colours, visible focus).
- Grain/texture overlays: `pointer-events: none`, `aria-hidden`, low opacity, disabled under `prefers-contrast: more`.
- No layout shift: reserve space for images (`aspect-ratio`), embeds, the player bar (body padding when visible), and web fonts (metric-matched fallbacks via `size-adjust`).
- `z-index` values from a token scale (`--z-grain`, `--z-player`, `--z-overlay`, `--z-toast`).
- Class names: short, component-scoped, kebab-case (`.release-card__cover` BEM-ish only when needed inside a component).
