---
paths:
  - "src/lib/motion.ts"
  - "src/styles/motion.css"
  - "src/components/**"
  - "src/layouts/**"
  - "src/scripts/**"
---

# Motion & sound rules

Spec: [docs/design.md §7 Motion](../../docs/design.md#7-motion), §9 Sound.

## Hierarchy of tools (use the first that works)
1. CSS transitions/animations with motion tokens.
2. View Transitions (`astro:transitions`, `::view-transition-*` CSS) for page and shared-element changes.
3. CSS scroll-driven animations (`animation-timeline: view()`), wrapped in `@supports`.
4. **GSAP** (+ ScrollTrigger / SplitText) for orchestrated sequences: arrival, timeline, multi-step reveals.
5. WebGL (OGL) only for the water shader on the platform and in Evening mode.

## Rules
- GSAP and plugins are **dynamically imported** via `src/lib/motion.ts` (`loadGsap()`), never in the global bundle. Register plugins once.
- Wrap GSAP work in `gsap.context()` / `gsap.matchMedia()` and revert it on `astro:before-swap` / component destroy.
- **Reduced motion is mandatory:** `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` → crossfades ≤ 150 ms, no parallax,
  no scroll-linked transforms, static grain, no shader, arrival shows the final state immediately. CSS: global `@media (prefers-reduced-motion: reduce)` override in `motion.css`.
- Animate only `transform`, `opacity`, `filter` (sparingly) and `clip-path`. Never animate layout properties (`width`, `top`, `height`) on large elements.
- No scroll-jacking. Lenis (if used) must keep native scroll semantics, be disabled for reduced motion, and never trap keyboard scrolling.
- Respect evening tempo: page transitions ~`--dur-long`, but interactive feedback ≤ `--dur-instant`. Never block input during an animation;
  every sequence is skippable (Esc / click / "пропустить").
- Max one orchestrated sequence per viewport at a time. No infinite looping motion in reading areas (lyrics, biography).
- Lyrics never animate per letter. Headings may reveal per line.
- Pause rAF loops and shaders when the tab is hidden (`visibilitychange`) or the element is off-screen (IntersectionObserver).

## Sound
- Nothing audible until the visitor explicitly asks for it: music only after pressing play; ambient/UI sounds only after switching on the «Звук» toggle (default **off**, persisted). «Войти на станцию» and other navigation never enable sound.
- Ambient ducks to silence when music plays. UI sounds are short, quiet, and never repeat rapidly.
- All sound assets are small (`.m4a` AAC), lazy-loaded only after sound is enabled.
