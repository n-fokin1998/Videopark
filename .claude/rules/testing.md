---
paths:
  - "**/*.test.ts"
  - "tests/**"
  - "src/lib/**"
  - "playwright.config.*"
  - "vitest.config.*"
---

# Testing rules

- **Unit (Vitest):** every function in `src/lib/` has colocated `*.test.ts`. Priorities: partial dates, slugs/transliteration, station ordering
  & transition direction, relations graph (against real content), time-of-day theme selection, plural/i18n helpers, player queue logic.
- **Content tests:** schema validation via `astro check`; `scripts/validate-content.ts` asserts no broken references, no missing `alt`/`credit`/`rights`,
  and known invariants (e.g. «Вода» has recordings on «3» and «RAW STUFF VOL. 5»; «Мой милый дом» has `tracklistKnown: false`).
- **E2E (Playwright):** smoke-test every route; walk the whole line forward and back; **playback continues across navigation**; arrival skip;
  line map keyboard flow; lightbox keyboard flow; reduced-motion emulation (`reducedMotion: 'reduce'`); no-JS rendering of key pages (`javaScriptEnabled: false`).
- **Accessibility:** `@axe-core/playwright` on every route in `evening` and `day` themes; fail on `serious`/`critical`.
- **Performance:** Lighthouse CI with budgets from `docs/architecture.md`.
- Browsers: Chromium, WebKit (iOS Safari proxy — audio/autoplay quirks), Firefox. Separate `mobile` projects (360×740 and 390×844, touch,
  portrait + landscape) and `desktop` projects; key flows (line walk, playback across navigation, lightbox swipe, player sheet) run on both.
- Silence check: entering the station and navigating must never start audio — assert no `play` event fires without a play-button click.
- Tests must not hit external networks: mock SoundCloud widget/oEmbed and any embeds.
- Prefer role/label selectors (`getByRole`, `getByLabel`) — they double as accessibility checks. Labels come from `ru.ts`, so import them rather than hard-coding text.
