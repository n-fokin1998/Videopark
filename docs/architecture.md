# Architecture

Technical blueprint. Product context: [vision.md](vision.md). Rules: [.claude/rules/](../.claude/rules/).

## 1. Goals that drive the architecture

1. **Longevity** — the site must survive years with minimal maintenance: static files, plain-text content, few dependencies.
2. **Uninterrupted music** — navigation must never stop playback.
3. **Atmosphere without weight** — rich motion on a light, mostly zero-JS base.
4. **Content-as-data** — every entity typed, validated at build, cross-linked automatically.
5. **i18n-ready** — adding EN/UK must be content work, not a refactor.

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** (latest stable, ≥ 5), `output: 'static'` | Static by default, islands, Content Layer, view transitions, first-class i18n routing |
| Language | **TypeScript** strict (`astro/tsconfigs/strictest`) | Content schemas and relations are the backbone |
| Islands | **Svelte 5** (runes) | Small runtime, great for animated stateful widgets. Used only where state is needed |
| Shared state | **nanostores** (+ `@nanostores/persistent`) | Framework-agnostic, tiny, works across islands and plain scripts |
| Page transitions | `astro:transitions` `<ClientRouter />` + View Transitions API | Persistent player via `transition:persist`, shared-element morphs |
| Motion | CSS first; **GSAP** (core, ScrollTrigger, SplitText) | Orchestrated sequences (name-origin scene, timeline). Loaded only on pages that need it. The arrival is plain CSS keyframes (D-026) |
| Smooth scroll | **Lenis** (optional, per page) | Gentle scroll on long stations; disabled under reduced motion and on touch if it harms UX |
| WebGL (optional) | **OGL** (tiny) for the water shader | Arrival + Evening mode only, lazy, with static fallback |
| Images | `astro:assets` `<Picture>` (AVIF + WebP + JPEG fallback) | Responsive, optimised at build |
| Audio | HTML `<audio>` + Web Audio API (`AnalyserNode` only for Evening-mode visuals) | Native, robust, background-tab friendly, Media Session API |
| Search | **Pagefind** | Static index generated post-build, zero server |
| Typography | Fontsource (self-hosted), typograf-style build step for RU non-breaking spaces | Privacy + correctness |
| SEO | `@astrojs/sitemap`, JSON-LD helpers, build-time OG images (`satori` + `@resvg/resvg-js`) | |
| Lint/format | ESLint flat config + `eslint-plugin-astro` + `eslint-plugin-svelte` + `typescript-eslint` + `eslint-plugin-jsx-a11y` rules for astro; Prettier with astro/svelte plugins | |
| Tests | Vitest (lib, schemas, relations), Playwright + `@axe-core/playwright` (e2e, a11y), Lighthouse CI (budgets) | |
| Package manager | **pnpm**, Node LTS pinned in `.nvmrc` / `engines` | |
| Hosting | Any static host — chosen after the site is complete locally (roadmap phase 9). Media optionally on object storage behind a CDN | |
| Analytics | None, or cookie-less (Plausible/Umami self-hosted). Decide in [decisions.md](decisions.md) | |

Any addition to this list requires a [decisions.md](decisions.md) entry.

## 3. Project structure

```
.
├─ astro.config.mjs
├─ tsconfig.json
├─ package.json
├─ content/                       # content lives outside src/ (editors' space)
│  ├─ knowlage-base/              # research sources (RU), not rendered
│  ├─ releases/*.md               # one file per release (frontmatter + story body)
│  ├─ songs/*.md                  # one per song (frontmatter + lyrics body)
│  ├─ recordings/*.yaml           # recordings (versions), one file each
│  ├─ eras/*.md                   # era rooms for История
│  ├─ timeline/<year>.yaml        # non-release events, a list per year (release points are derived)
│  ├─ writings/*.md               # early poems and prose (2014), shown in Тексты
│  ├─ people/*.yaml               # poets, artists, collaborators
│  ├─ places/*.yaml               # Brovary & Kyiv places
│  ├─ quotes/*.yaml
│  ├─ pages/*.<locale>.md         # long-form singletons (zhenya, about, …)
│  ├─ interviews/*.md             # «Сторона» interview as Q/A
│  ├─ instagram/                  # posts.txt (owner) → posts.yaml + media/<post>_<n>.*
│  ├─ photos/<album>/…            # owner-provided images + album.yaml (captions, credits)
│  ├─ tracks/<release>/<song>.flac # owner-provided FLAC masters (git-ignored, see §6)
│  ├─ videos/                     # links.txt + local video files (git-ignored)
│  ├─ lyrics/                     # owner-provided raw lyric files (converted into songs/*.md)
│  └─ unused-media.yaml           # owner files deliberately not used (duplicates), with reasons
├─ src/
│  ├─ content.config.ts           # all collections (loaders); schemas come from lib/content/schemas.ts
│  ├─ pages/                      # routes (see information-architecture.md §2)
│  ├─ layouts/
│  │  ├─ BaseLayout.astro         # <html>, head, layer order + pre-paint script, ClientRouter, header (mark, LineIndicator, LineMap), Player
│  │  └─ StationLayout.astro      # station sign hero, next-station footer, transitions
│  ├─ components/
│  │  ├─ station/                 # Wordmark, CompactMark, StationSign, LineIndicator, LineMap + LineDiagram, NextStation, Arrival, PlatformScene
│  │  ├─ player/                  # Player/PlayButton/Waveform/TrackOfTheEvening.svelte, store.ts, controller.ts, audio-engine.ts (+ file/soundcloud backends), peaks.ts, ui-sound.ts
│  │  ├─ timeline/                # NameOriginScene.astro (Г→В), Timeline.svelte, Rail, EventDot, EraRoom.astro
│  │  ├─ lyrics/                  # LyricsSheet.astro, SyncedLyrics.svelte, ShareLine.svelte
│  │  ├─ media/                   # Photo.astro, Gallery.astro, Lightbox.svelte, VideoFacade.astro, SoundCloudEmbed.astro, InstagramCard.astro
│  │  ├─ biography/               # Chapter.astro, InterviewTurn.astro
│  │  └─ ui/                      # Button, Icon, Quote, Tag, Transfers (Пересадки), Certainty
│  ├─ i18n/                       # config.ts, ui/ru.ts (en.ts, uk.ts later), t.ts, routes.ts
│  ├─ lib/                        # pure, unit-tested TS
│  │  ├─ content/                 # schemas.ts (shared Zod contract), raw.ts (fs reader for tests/scripts), relations.ts (graph), loaders.ts
│  │  ├─ slug.ts                  # Latin transliteration for ids
│  │  ├─ dates.ts                 # partial dates ("2017", "2017-03"), formatting per locale
│  │  ├─ time-of-day.ts           # theme schedule, also fed to the pre-paint script
│  │  ├─ stations.ts              # ordered station registry (single source for nav & transitions)
│  │  ├─ motion.ts                # reduced-motion and low-end-device helpers (GSAP lazy loader joins with phase 4)
│  │  ├─ evening.ts               # deterministic daily pick («Трек вечера», the platform quote)
│  │  ├─ arrival.ts / keyboard.ts # when the arrival plays; global shortcut mapping
│  │  ├─ player/                  # track.ts (source resolver), queue.ts, time.ts — pure player logic
│  │  ├─ seo.ts                   # JSON-LD builders
│  │  └─ typograf.ts
│  ├─ stores/                     # nanostores: theme, sound fx, ui (player store lives in components/player)
│  ├─ scripts/                    # small client entry scripts (non-island behaviour)
│  └─ styles/                     # tokens.css, themes.css, global.css, typography.css, motion.css
├─ scripts/                       # node/tsx build-time scripts
│  ├─ verify.mjs                  # local quality gate (pnpm verify)
│  ├─ media.ts                    # pnpm media: FLAC → AAC .m4a 160k + peaks json, video remux + posters, EXIF report/strip
│  ├─ lib/                        # exif.ts, peaks.ts (pure, unit-tested)
│  ├─ soundcloud-oembed.ts        # optional link check for SoundCloud fallbacks
│  └─ validate-content.ts         # cross-reference & rights checks beyond Zod
├─ public/
├─ lighthouserc.cjs               # Lighthouse budgets (pnpm lighthouse)
├─ playwright.config.ts           # e2e projects: desktop Chromium/Firefox/WebKit, mobile 360×740 / 390×844 / landscape
└─ tests/e2e/                     # Playwright + axe; unit tests colocated as *.test.ts
```

`src/lib/stations.ts` is the **single registry** of stations (id, route, order, i18n key, theme hints). Line indicator, line map,
next-station footer and transition direction all read from it.

## 4. Rendering model

- **Everything pre-rendered** at build (`getStaticPaths` from collections). No SSR adapter at launch.
- **Islands only where needed**, with the laziest viable directive:

| Island | Directive | Notes |
|---|---|---|
| Player | `client:idle` + `transition:persist="player"` | In `BaseLayout`; must exist on every page. Renders nothing until there is a queue, and PlayButtons drive the shared controller directly, so it hydrates on idle (D-026) |
| PlayButton (in lists) | `client:visible` | Talks to the player store; tiny |
| LineMap overlay («Схема») | zero-JS `.astro` `<dialog>` + plain script loaded on idle | Native modal dialog; the script binds the button, `M`, theme and «Звук» (D-026) |
| TrackOfTheEvening | `client:idle` | Server renders the build-date pick; the island switches to the visitor's date (fetches `/tracks/evening.json` only if needed) |
| Timeline | `client:visible` | Static SVG/HTML rendered at build; island adds drag/scroll/zoom |
| SyncedLyrics | `client:visible` | Only on songs with timestamps; lyrics are SSR'd as plain HTML first |
| Lightbox | `client:idle` | Gallery works as plain links without JS |
| Arrival | plain `<script>` (no framework) | Progressive enhancement over the SSR'd platform state; silent — never touches audio |
| NameOriginScene | plain `<script>` + GSAP ScrollTrigger (dynamic import) | Static two-frame HTML first; the Г→В animation is an enhancement |

- Every page must be fully readable with JS disabled (except player controls and the timeline interactions, which degrade to links/lists).

## 5. Persistent player

The most important piece of client code.

```
              ┌──────────────── nanostores ────────────────┐
              │ $queue  $current  $status  $position        │
UI islands ──▶│ $volume $soundFx  $lyricsLine              │◀── audio-engine.ts (single HTMLAudioElement)
(PlayButton,  └────────────────────────────────────────────┘          │
 Player,                                                              ├─ Media Session API (lock-screen controls, artwork)
 SyncedLyrics)                                                        ├─ source resolver: local file → SoundCloud widget → external link
                                                                      └─ persisted state (localStorage): queue, position, volume
```

- One `HTMLAudioElement` for the whole session, owned by `audio-engine.ts` (file backend) in module scope — modules survive
  ClientRouter navigations, so the element does too. `controller.ts` holds the actions (play a list, toggle, next/previous, seek)
  shared by the Player, every PlayButton and the keyboard; the persisted Player island is the UI.
- The track catalog is built at build time (`src/lib/content/catalog.ts`): `src` is set only when `pnpm media` produced the
  `.m4a`, so a clone without media falls back to SoundCloud or an external link instead of a dead button.
- `transition:persist` keeps the island (and the audio element) alive across `<ClientRouter />` navigations.
- **Source resolver** per recording: (1) self-hosted, owner-provided file (primary), (2) SoundCloud Widget API (hidden iframe controlled by
  our UI) if a SoundCloud URL exists, (3) otherwise external link button. See [integrations.md](integrations.md).
- State persisted (queue, current id, position) so a reload resumes paused at the same spot — never auto-plays.
- Media Session metadata (title, release, artwork) for lock-screen/OS controls.
- Keyboard: `Space` (when not in a text field) play/pause, `←/→` seek ±10s in the expanded player, `N`/`P` next/prev.
- Events emitted for analytics are optional and anonymous.
- Pages must handle `astro:page-load` / `astro:after-swap` for re-initialising non-persisted scripts (never `DOMContentLoaded` alone).

## 6. Media pipeline

| Media | Source in repo | Build output | Notes |
|---|---|---|---|
| Photos | `content/photos/**` (JPEG/PNG/TIFF masters ≤ 4000px) | AVIF/WebP/JPEG responsive sets via `astro:assets` | EXIF/GPS reported by `pnpm media` (`--strip-exif` removes it losslessly in place); `astro:assets` output never carries metadata |
| Covers | `content/photos/covers/<release>.jpg` | Same | Never cropped |
| Audio | `content/tracks/<release>/<song>.flac` masters (git-ignored) | `.m4a` AAC 160 kbps + `<recording-id>.peaks.json` in git-ignored `public/media/audio/` | Generated by `pnpm media` (ffmpeg; peaks computed from decoded PCM). ≈ 250 MB for 3.5 h |
| Video | `content/videos/*` local clips (git-ignored) + `links.txt` (YouTube) → `videos/*.yaml` | `public/media/video/<id>.mp4` (remuxed, faststart, no metadata) + `.jpg` poster frame, by `pnpm media`; VTT captions later | Facades for external |
| Instagram | `content/instagram/media/*` saved by the owner for curated posts | Images processed like photos; videos → `public/media/instagram/` (+ poster) by `pnpm media` | See integrations |

**Storage (D-021):** FLAC masters and video files are git-ignored and kept by the owner with a backup; generated web media is git-ignored too
and rebuilt with `pnpm media`. Production location is chosen in phase 9. Never commit unprocessed photos with GPS EXIF.

## 7. Styling architecture

- The cascade layer order is declared in an inline `<style>` at the top of `BaseLayout`'s `<head>`: the bundler emits component
  CSS before `main.css` and drops a bare `@layer a, b;` statement, which would otherwise make `components` the weakest layer (D-026).
- Global: `tokens.css` (palette, spacing, type scale, motion tokens) → `themes.css` (semantic tokens per `data-theme`) → `global.css` (reset, base) → `typography.css`.
- Components: Astro scoped `<style>`; Svelte component styles. Use semantic tokens only.
- Modern CSS welcome: container queries, `:has()`, cascade layers (`@layer reset, tokens, base, components, utilities`), `clamp()`, `color-mix()`,
  `@view-transition`, scroll-driven animations with `@supports` guards.
- See [.claude/rules/styling.md](../.claude/rules/styling.md).

## 8. Performance budgets

Measured on a mid-range Android, "Slow 4G" profile, for each station's index page:

| Metric | Budget |
|---|---|
| LCP | ≤ 2.5 s (target 1.8 s) |
| INP | ≤ 200 ms |
| CLS | ≤ 0.05 |
| JS shipped on first load (gzip), content pages | ≤ 60 KB (player + store + router) |
| JS on Платформа incl. arrival + GSAP | ≤ 120 KB, WebGL shader lazy after first paint |
| Fonts | ≤ 2 preloaded files, ≤ 150 KB total critical |
| Hero image | ≤ 200 KB AVIF |
| Lighthouse (mobile) | ≥ 95 Performance / 100 Accessibility / 100 Best Practices / 100 SEO |

Budgets apply to the **mobile** profile first; desktop must also pass. Enforced via Lighthouse (local runs until phase 9, then CI). Large libraries (GSAP plugins, OGL, Lenis) are dynamic-`import()`ed in the pages that use them.

## 9. Accessibility architecture

- Landmarks: `header` (line indicator), `main`, `nav` (line map), `footer` (next station), player as `region` with label.
- Skip link "К содержанию" and "К плееру".
- Route change announcements via a polite live region (station name) — ClientRouter does not do this fully on its own.
- Focus is moved to the `<h1>` of the new station after navigation.
- `prefers-reduced-motion`, `prefers-contrast`, `prefers-color-scheme` respected.
- Automated axe checks in e2e for every route; manual screen-reader pass (VoiceOver + NVDA) per milestone.

## 10. Build & deploy

```
pnpm build
  ├─ astro check (types + content schemas)          ← pnpm check
  ├─ scripts/validate-content.ts (relations, rights, missing media, certainty)  ← pnpm validate:content (part of pnpm verify)
  ├─ astro build (static, images, OG images)
  └─ pagefind --site dist
```

- **Until phase 9 everything runs locally:** `pnpm verify` runs lint → check → unit tests → build → e2e + axe against `pnpm preview` →
  Lighthouse (local). Domain and hosting are chosen once the site is complete locally.
- Phase 9: hosted CI (GitHub Actions or host CI) with the same steps + preview deploys per PR → production on `master`.
- Helper scripts that touch the network (SoundCloud oEmbed link check) are **manual and commit their data**, never run implicitly in a build
  (builds must be reproducible offline).
- Security headers on the host (phase 9): strict CSP (self + allowed media/embed origins after interaction), `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` minimal, HSTS.

## 11. Future server needs

None in the current scope. If the deferred memory board («Воспоминания») returns, its submissions would be the only server need:
a single serverless function / Astro server endpoint via an adapter, keeping all pages static (`export const prerender = true` default).
