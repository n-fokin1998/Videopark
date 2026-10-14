# Roadmap

A phased plan from empty repo to a finished site running locally, then deployment and beyond.
Ticket prefix: `VDPRK-`. Phases are ordered by dependency; phases 3–7 can partly run in parallel once phase 2 is done.

Domain and hosting are chosen **after the site is complete and verified locally** (phase 9). Until then, all work is validated with
`pnpm dev` / `pnpm build && pnpm preview` and the local test suite.

## Content intake

Photos, video, audio and lyrics are provided by the project owner and placed in `content/` (see
[content-model.md §7](content-model.md#7-content-intake-owner-uploads)). Agents turn these files into collection entries; they never
source media from the internet themselves.

## MVP definition (local release scope)

The smallest version that is already *the station*, not a placeholder:

- Платформа with the silent arrival sequence, the «Станция Видеопарк» wordmark and the line map.
- Persistent player with self-hosted playback (owner-provided audio) and external-link fallback.
- Музыка: all releases incl. «Куда бы мы не отправились» and «Мой милый дом» (one long file), versions, «Отдельные песни».
- История: the name-origin scene (Гидропарк → Видеопарк) + two-rail timeline with eras.
- Тексты: index + song pages (22 lyrics provided; honest "not added yet" states) + «Стихи и проза» (2014).
- Фото: period albums (2016–2020), covers, «Плёнка, 2016» and the 7 selected Instagram posts.
- Женя: chaptered biography (instruments mentioned in text only, no exhibits); link to early poems and prose.
- Об архиве: sources, credits, contact, «Архив ищет».
- RU only, i18n-ready. Fully responsive (360 px → wide desktop). Accessibility AA, budgets met.

After MVP: Видео (music video + 12 concert videos — small enough to ship early if time allows), Бровары, Evening mode, synced lyrics, lyric cards, UK and EN.
**Deferred (not planned now):** Воспоминания (memory board).

---

## Phase 0 — Foundations (VDPRK-1…)

- [x] Scaffold Astro (latest) + TS strictest, pnpm, Node LTS pin, `.editorconfig`.
- [x] ESLint (flat) + Prettier with astro/svelte plugins; `pnpm check`/`lint`/`format`/`test` scripts.
- [x] Svelte 5 integration, nanostores, sitemap.
- [x] `src/styles/` tokens + 4 themes + cascade layers + responsive breakpoints/containers; fonts via Fontsource (verify Cyrillic + Ukrainian subsets).
- [x] `src/i18n/` skeleton (`ru` only, unprefixed), `t()` helper, `src/lib/stations.ts` registry.
- [x] `BaseLayout` (head, theme pre-paint script, `<ClientRouter />`, skip links, live region) and `StationLayout`.
- [x] Empty routes for all stations with station sign + next-station footer.
- [x] Local quality gate script: lint → check → test → build → Playwright smoke + axe → Lighthouse (local run). Hosted CI comes with phase 9.
- Status: done (VDPRK-1). Firefox e2e is opt-out locally via `E2E_SKIP_FIREFOX=1` (D-024).
- **Done when:** you can walk the whole empty line with transitions, keyboard only, at 360 px and on desktop, with zero a11y violations.

## Phase 1 — Content model & ingestion

- [x] `src/content.config.ts` with all collections ([content-model.md](content-model.md)); schemas shared in `src/lib/content/schemas.ts`.
- [x] Convert `content/knowlage-base/releases.md` → `releases/`, `songs/`, `recordings/` (all releases 2016–2020 incl. archival, RAW STUFF VOL. 5).
- [x] Convert `biography.md` → `timeline/`, `eras/`, `people/`, `places/`, `quotes/`, `pages/zhenya.ru.md`; interview → `interviews/storona.md`.
- [x] Ingest owner-provided media per [content-inventory.md](content-inventory.md): tracks, covers, photos (+ `portraits` as featured), lyrics, `videos/links.txt`, `instagram/posts.txt`; writings (`стихи.txt`, `проза.txt`) → `writings/`; concerts from videos → `timeline/`.
- [x] `src/lib/content/relations.ts` + unit tests against real data.
- [x] `scripts/validate-content.ts` (alt text, credits, broken refs, certainty report, unreferenced media files).
- [x] Media pipeline script (`pnpm media`, needs ffmpeg): EXIF strip, FLAC → AAC 160k, peaks into git-ignored `public/media/` (D-021).
- **Done when:** `pnpm check` validates all entries; a debug page lists every entity with its transfers.
- Status: done (VDPRK-2). 25 releases, 50 songs, 57 recordings, 15 timeline events, 6 eras, 17 people, 10 places, 11 quotes, 5 writings,
  6 photo albums, 13 videos, 7 Instagram posts, the interview and two pages (`zhenya`, `name-origin`). Debug page: `/debug/content`
  (`pnpm dev`, or a build with `DEBUG_PAGES=1`). Content issues A, B, I, J resolved by the owner (shared recordings; photos shown as provided).

## Phase 2 — Platform, navigation, player (the spine)

- [x] Wordmark «Станция Видеопарк» (variants: horizontal, stacked, compact mark/favicon).
- [x] Line indicator (desktop + mobile compact form), line map overlay (keyboard `M`), next-station footer, direction-aware transitions.
- [x] Player: store, audio engine, source resolver (file / SoundCloud widget / link), Media Session, persistence, keyboard, mobile layout.
- [x] Платформа: SSR platform state; silent arrival sequence (wordmark lamp, train, doors) as progressive enhancement; reduced-motion and mobile versions.
- [x] Sound toggle («Звук», default off).
- [x] Track of the evening (deterministic by date).
- [x] Time-of-day theming.
- **Done when:** music plays continuously while navigating all stations on desktop + iOS Safari + Android Chrome; arrival is skippable and silent.
- Status: implemented (VDPRK-3), decisions in D-026. Verified with Playwright on desktop Chromium/WebKit and mobile Chromium/WebKit
  (portrait + landscape); playback across the whole line is covered by `tests/e2e/player.spec.ts`. Still open:
  - **Real devices:** iOS Safari and Android Chrome by hand (Playwright's Windows WebKit needs a View Transitions workaround, D-026).
  - **SoundCloud backend:** implemented but unexercised — no recording has a SoundCloud URL yet (content issue C).
  - **Ambient sounds:** «Звук» drives only the play/pause click; ambient beds need owner-provided recordings (`TODO(content)`).
  - **Budgets:** JS is well inside (≈ 39 KB gz on content pages, ≈ 41 KB on the platform, incl. the idle-loaded player); Lighthouse mobile LCP sits at 2.26–2.56 s on
    content pages (master: 2.11 s) and ≈ 2.7 s on the platform (perf 0.94–0.95) — to be brought under 2.5 s in the phase 8 pass.

## Phase 3 — Музыка

- [ ] Index (by year / grid / list, type filter), release page, versions, "play release", "play all chronologically".
- [ ] Shared-element transition cover → release hero.
- [ ] JSON-LD `MusicAlbum`/`MusicRecording`; OG images for releases.

## Phase 4 — История

- [ ] Name-origin scene «Откуда название»: Гидропарк sign, the boy's line, Г → В flip, «Станция» lights up; static fallback; mobile version.
- [ ] Static SSR timeline (works without JS) + island for horizontal drag/scroll/keyboard on desktop; vertical layout on mobile.
- [ ] Two rails + life thread; release connectors; era rooms.

## Phase 5 — Тексты

- [ ] Index (title / year / theme), song page, lyrics typography, borrowed-text credits, poets' shelf (`/people/*`).
- [ ] "Text not added yet" states and «Архив ищет» links.
- [ ] (Post-MVP) synced lyrics, share-a-line cards.

## Phase 6 — Фото & Видео

- [ ] Albums, contact-sheet layout, lightbox with deep links and touch swipe, covers album with credits.
- [ ] «Из Instagram»: curated posts (`content/instagram/posts.txt` → `posts.yaml`) rendered as own cards (image + video media) + link to original.
- [ ] Video facades, local clips with captions, audio focus handoff with the player.

## Phase 7 — Женя & Об архиве

- [ ] Biography (chaptered), interview page, quotes.
- [ ] Biography chapters illustrated with archive photos only; deep links to «Стихи и проза» and to the name-origin scene.
- [ ] About: sources, methodology, certainty legend, credits, takedown, «Архив ищет».

## Phase 8 — Polish (local release)

- [ ] Motion pass (arrival, name-origin scene, transitions, reveals); sound pass for optional ambient/UI sounds.
- [ ] Pagefind search in the line map.
- [ ] Full a11y audit (axe + manual VoiceOver/NVDA + keyboard), Lighthouse budgets.
- [ ] Responsive QA matrix: 360/390/430 px phones (portrait + landscape), tablets 768/1024, laptop 1280–1440, wide 1920+;
      iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari.
- [ ] SEO: titles, descriptions, sitemap, robots, JSON-LD, OG images, 404.
- **Done when:** the full MVP works from `pnpm build && pnpm preview` and passes all checks.

## Phase 9 — Deployment

- [ ] Choose domain and hosting (record in [decisions.md](decisions.md)); media storage per D-010.
- [ ] Hosted CI: lint → check → test → build → e2e + axe → Lighthouse CI → preview deploys per PR → production on `master`.
- [ ] Security headers/CSP, HTTPS, analytics decision (D-009).
- [ ] Launch checklist signed off by the project owner.

## Phase 10 — After launch

- Бровары station (map, places, field recordings, «Как доехать») if not in MVP.
- Evening mode (`/evening`) with water shader and continuous radio.
- Synced lyrics + lyric cards.
- **Ukrainian** locale, then **English** ([i18n.md](i18n.md) checklist).
- RSS of archive additions; "what's new on the station" note on the platform.
- Ongoing «Архив ищет» restoration (e.g. «Мой милый дом» tracklist).
- Revisit the deferred Воспоминания station (memory board) if the owner decides to add it.

---

## Definition of done (every ticket)

- Matches the relevant doc (or the doc is updated in the same PR).
- `pnpm check && pnpm lint && pnpm test` pass; e2e + axe pass for UI changes.
- Works: keyboard only, screen reader basics, reduced motion, no JS (content readable), **mobile 360 px portrait and landscape, touch**, slow network.
- No hard-coded UI strings; no unsourced facts; media has credit + alt.
- Player keeps playing across the changed pages.
- Budgets not exceeded (Lighthouse).

## Open questions

| # | Question | Status |
|---|---|---|
| Q1 | Rights for self-hosted audio | Resolved: the owner provides audio in `content/tracks` |
| Q2 | Instagram source | Resolved: specific posts from instagram.com/evgeniymychak, no account access — curated list (D-016) |
| Q3 | Photos/videos/drafts | Resolved: provided by the owner in `content/` |
| Q4 | Family review of the biography | Resolved: not required — biography is compiled from open sources |
| Q5 | Lyrics source | Resolved: provided by the owner |
| Q6 | Domain and hosting | Deferred to phase 9 (after the site works locally) |
| Q7 | URL scheme for locales | Resolved: RU unprefixed (D-007) |
| Q8 | How to make the illustrated scenes (platform, name-origin scene, Brovary map): code-drawn SVG, illustrator, or photo-based — see [design.md §10](design.md#10-iconography--illustration) | Open — default: code-drawn SVG |
| Q9 | Which exact Instagram posts to include | Resolved: 7 posts in `content/instagram/posts.txt` |
| Q10 | Content issues C–H (missing tracks/covers, cover credits, EP date source); A, B, I, J resolved | Open — see [content-inventory.md §3](content-inventory.md#3-issues-that-need-the-owners-decision) |
| Q11 | Captions for photos (date, place, people, photographer) | Open — optional `notes.md` per photo folder; agent writes alt text meanwhile |
| Q12 | Missing lyrics (≈ 21 songs) and confirmation of instrumentals («Будни», «Какой-то там час (интро)») | Open |
