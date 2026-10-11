# Decision log

Lightweight ADRs. Append new entries at the bottom; never rewrite accepted ones — supersede them with a new entry.
Format: `## D-NNN — Title` · Status (Proposed / Accepted / Superseded by D-xxx) · Date · Context · Decision · Consequences.

---

## D-001 — Static Astro site with islands
- **Status:** Accepted · 2026-10-04
- **Context:** Long-lived memorial/archive; content is mostly static; needs rich motion and a persistent player.
- **Decision:** Astro, `output: 'static'`, TypeScript strict, islands only where state is needed.
- **Consequences:** Cheap hosting, longevity, great performance. Dynamic features (memory submissions) need an external service or a single function.

## D-002 — Svelte 5 as the island framework
- **Status:** Accepted · 2026-10-05 (confirmed by the project owner)
- **Context:** A few stateful widgets (player, timeline, line map, lyrics sync, lightbox, form). Need small runtime, good animation ergonomics.
- **Decision:** Svelte 5 for islands; vanilla TS for simple behaviours; nanostores for shared state.
- **Alternatives:** Preact (similar size, JSX), vanilla Web Components only (zero runtime, more boilerplate), React (too heavy).
- **Consequences:** One framework only — do not mix in React/Vue/Solid.

## D-003 — Persistent player via ClientRouter + `transition:persist`
- **Status:** Accepted · 2026-10-04
- **Context:** "Music never stops" is a core principle.
- **Decision:** Astro `<ClientRouter />` on all pages; Player island persisted; one global `HTMLAudioElement`.
- **Consequences:** All page scripts must re-initialise on `astro:page-load`; e2e tests must cover playback across navigation.

## D-004 — Plain CSS with tokens, no Tailwind
- **Status:** Accepted · 2026-10-05 (confirmed by the project owner)
- **Context:** Highly bespoke, art-directed design with theming by time of day; few repeated utility patterns.
- **Decision:** CSS custom properties (tokens + semantic theme tokens), cascade layers, Astro scoped styles.
- **Consequences:** Design tokens are the single styling API; no utility-class soup in markup.

## D-005 — GSAP for orchestrated motion, native APIs first
- **Status:** Accepted · 2026-10-04
- **Context:** Arrival sequence, timeline and text reveals need timeline-based orchestration; GSAP and its plugins are free to use.
- **Decision:** CSS transitions / View Transitions / scroll-driven CSS first; GSAP (dynamic import) for sequences. Lenis optional.
- **Consequences:** GSAP never in the global bundle; reduced-motion handled centrally in `src/lib/motion.ts`.

## D-006 — Song / Recording / Release model with two dates
- **Status:** Accepted · 2026-10-04
- **Context:** Many recordings were released years later as archival editions; some songs exist in several versions.
- **Decision:** Separate collections; `recorded` and `released` partial dates; `reissueOf`.
- **Consequences:** Timeline can show two rails; no duplicate songs in UI.

## D-007 — Unprefixed Russian URLs, prefixed future locales
- **Status:** Accepted · 2026-10-05 (confirmed by the project owner)
- **Context:** RU at launch; UK and EN later.
- **Decision:** `prefixDefaultLocale: false` → `/music` (ru), `/uk/music`, `/en/music`.
- **Alternative considered:** prefix all locales (`/ru/music`). Rejected — clean RU URLs preferred.

## D-008 — Audio source order: self-hosted → SoundCloud widget → external link
- **Status:** Accepted · 2026-10-05
- **Context:** The project owner provides the audio files; SoundCloud has the archive for anything missing.
- **Decision:** Resolver chain per recording, one player UI regardless of backend.
- **Consequences:** Player engine must abstract backends behind one interface.

## D-009 — No third-party embeds before interaction; no trackers
- **Status:** Accepted · 2026-10-04
- **Decision:** Facades for YouTube/Vimeo/Bandcamp/SoundCloud/Instagram; analytics none or cookie-less (decided at deployment).

## D-010 — Media storage
- **Status:** Resolved by D-021
- **Options:** (a) encoded media in git (if < ~300 MB), (b) Git LFS masters + encodes on R2/S3 + CDN, (c) everything on object storage.
- **Decide when:** first batch of audio/photos arrives (roadmap phase 1).

## D-011 — Memory board submission channel
- **Status:** Superseded by D-015 (memory board deferred).

## D-012 — Wordmark is the band name; Г→В lives in История
- **Status:** Accepted · 2026-10-05
- **Context:** The Г→В letter flip was first proposed as the main logo.
- **Decision:** The main logo is a crafted «Станция Видеопарк» wordmark (station name plate on the red line). The Г→В animation is used only in
  the name-origin scene that opens История, told from the «Сторона» interview.
- **Consequences:** No «Гидропарк» form of the logo anywhere else; see [design.md §5](design.md#5-signature-components).

## D-013 — Silent arrival
- **Status:** Accepted · 2026-10-05
- **Decision:** «Войти на станцию» does not enable sound. Music starts only via play; ambient/UI sounds only via the «Звук» toggle (default off).
- **Consequences:** No arrival announcement voice; e2e test asserts no audio starts without a play action.

## D-014 — Digital exhibits only inside the biography
- **Status:** Superseded by D-020
- **Decision:** Exhibits (Squier Bullet Strat, iPhone 6, …) are embedded in «Женя» chapters (`exhibits.chapter` required), with optional
  `/zhenya/[exhibit]` detail pages. They are not part of История or a standalone museum section.

## D-015 — Memory board deferred
- **Status:** Accepted · 2026-10-05
- **Decision:** The «Воспоминания» station is removed from the current scope. The line is 7 stations, Бровары is the terminal.
  `src/lib/stations.ts` keeps adding a station a data change.

## D-016 — Instagram: curated posts, no API
- **Status:** Accepted · 2026-10-05
- **Context:** Posts come from instagram.com/evgeniymychak; there is no access to the account, so no API token.
- **Decision:** `content/instagram/posts.yaml` lists chosen permalinks; the owner saves images/captions; posts render as our own cards linking
  to the original. Instagram's embed script only behind a click-to-load facade, for posts without saved images.

## D-017 — Content provided by the owner; biography from open sources
- **Status:** Accepted · 2026-10-05
- **Decision:** Photos, video, audio and lyrics are placed in `content/` by the project owner (treated as cleared, still credited).
  The biography is compiled from open sources; no family sign-off step.

## D-018 — Domain and hosting after local completion
- **Status:** Accepted · 2026-10-05
- **Decision:** Development and verification run locally (`pnpm build && pnpm preview`, local test/Lighthouse runs). Domain, hosting, hosted CI
  and media storage location are chosen in roadmap phase 9.

## D-019 — Mobile-first responsive design
- **Status:** Accepted · 2026-10-05
- **Decision:** Phones (from 360 px) are the primary target; every station must be complete on mobile, tablet and desktop.
  Rules in [design.md §6](design.md#6-layout-and-responsive-behaviour) and `.claude/rules/responsive.md`.

## D-020 — No visual exhibits
- **Status:** Accepted · 2026-10-10 (supersedes D-014)
- **Context:** No photos of the Squier Bullet Strat, iPhone 6 or other objects were provided.
- **Decision:** No `exhibits` collection, no `/zhenya/[exhibit]` pages, no exhibit frames. The instruments are only mentioned in the biography
  text (chapter «Дом как студия»). Stock or downloaded images of the objects are never used.
- **Consequences:** If object photos appear later, exhibits can be reintroduced with a new decision.

## D-021 — Media storage: masters outside git, generated web media
- **Status:** Accepted · 2026-10-10 (resolves D-010)
- **Context:** Uploaded content is ≈ 1.78 GB, of which ≈ 1.75 GB are FLAC masters (56 files, ≈ 3.5 h) and ≈ 40 MB video.
- **Decision:** FLAC/WAV masters and video files are git-ignored and kept by the owner (with a backup). `pnpm media` (ffmpeg) generates
  AAC `.m4a` 160 kbps (≈ 250 MB total, one format supported by all target browsers) and waveform peaks into git-ignored `public/media/`;
  peaks JSON may be committed. Images and texts are committed.
- **Consequences:** A fresh clone cannot build playable audio without the masters; production storage of the generated media (deploy with the
  site vs. object storage/CDN) is chosen in phase 9. The earlier plan of Opus + AAC is dropped for simplicity (architecture.md §6).

## D-022 — Early writings as part of Тексты
- **Status:** Accepted · 2026-10-10
- **Decision:** Poems and prose from January 2014 (`стихи.txt`, `проза.txt`) become a `writings` collection shown in Тексты → «Стихи и проза»,
  verbatim with original spelling, linked from the biography chapter «Поэзия».

## D-023 — Concerts from video sources
- **Status:** Accepted · 2026-10-10
- **Decision:** Concerts and rehearsals known from the uploaded YouTube list become timeline events (`kind: concert | rehearsal`) citing the video
  as source; songs known only from these videos become song entries without recordings.

## D-024 — Phase 0 toolchain and scaffolding choices
- **Status:** Accepted · 2026-10-10
- **Context:** Scaffolding the project (roadmap phase 0) with the latest stable tools while keeping the toolchain consistent.
- **Decision:**
  - **Node 24 LTS** (`.nvmrc`, `engines`), **pnpm 11** (`packageManager`), **Astro 7**, **Svelte 5**, **Vitest 5**, **Playwright**, **ESLint 10** (flat config).
  - **TypeScript 6.0**, not 7: `typescript-eslint` and `@astrojs/check` do not support TS 7 yet. Revisit when they do.
  - `eslint-plugin-jsx-a11y-x` (ESLint 10-compatible fork) backs `eslint-plugin-astro`'s a11y rules; the peer warning of the
    auto-installed original is silenced in `pnpm-workspace.yaml`.
  - `build.format: 'file'` + `trailingSlash: 'never'` → `/music` is served from `music.html`; canonical URLs are extensionless.
  - `site` defaults to `http://localhost:4321` until the domain is chosen (D-018); override with `SITE_URL`.
  - Fonts: Fontsource npm packages imported in CSS (no Astro Fonts API — it fetches at build time, builds must be offline).
    Only Golos + Literata cyrillic files are preloaded (≈ 50 KB).
  - Local quality gate: `pnpm verify` (`scripts/verify.mjs`) = lint → check → unit → build → Playwright + axe → Lighthouse
    (`@lhci/cli`, reports written to `.lighthouseci/`, never uploaded). `E2E_SKIP_FIREFOX=1` drops the Firefox project on machines
    where Playwright's Firefox cannot start.
  - Future locale routes: `src/pages/[locale]/…` with `getStaticPaths()` over `enabledLocales` minus `ru`; Russian pages stay unprefixed
    files in `src/pages/`. Station pages are thin wrappers around `StationLayout`, so a localized route is a few lines.
- **Consequences:** Upgrading to TypeScript 7 is a separate, deliberate change. Breakpoint tokens live in `tokens.css` as reference values;
  media queries repeat the numbers (custom properties cannot be used in `@media`), and components prefer container queries.

## D-025 — Phase 1 content tooling
- **Status:** Accepted · 2026-10-11
- **Context:** The relations graph, its unit tests and `scripts/validate-content.ts` need the content outside Astro (Vitest, `tsx`), but schemas
  must not be written twice.
- **Decision:**
  - Schemas are defined once in `src/lib/content/schemas.ts` as `defineSchemas(ref, image)`. `src/content.config.ts` passes Astro's
    `reference()`/`image()`; `src/lib/content/raw.ts` passes plain strings and reads `content/` with `node:fs` + `yaml`. The graph
    (`src/lib/content/relations.ts`) works on that raw form (ids only); pages fetch rich entries by id with `getCollection`/`getEntry`.
  - Entry ids = file names; timeline is one YAML list per year, read by a small custom loader (`src/lib/content/loaders.ts`).
  - Lyrics and writings bodies are plain text rendered with preserved line breaks, not Markdown.
  - New dev dependencies: **`tsx`** (runs `scripts/*.ts`, required by `.claude/rules/typescript.md`; ~ esbuild, already in the tree via Vite) and
    **`yaml`** (YAML 1.2 parser for the raw reader and the timeline loader; already a transitive dependency of Astro). pnpm is allowed to run
    esbuild's install script (`allowBuilds`), needed by `tsx`.
  - `pnpm media` (`scripts/media.ts`) is idempotent, uses ffmpeg/ffprobe from PATH, and writes only to git-ignored `public/media/`; image
    metadata is reported, and stripped in place only with `--strip-exif` (lossless, refuses EXIF-rotated images).
  - `pnpm validate:content` joins the `pnpm verify` gate; a Vitest test also asserts it reports no errors or warnings.
  - The developer page `/debug/content` is generated only in `astro dev` or with `DEBUG_PAGES=1`, never in a normal build. It is not
    user-facing, so its labels are English and not in `ru.ts`.
- **Consequences:** A schema change is made in one place. `public/media/` (≈ 270 MB once generated) is copied into `dist/` by `astro build`;
  where it is served from in production is still the phase 9 decision (D-021).
