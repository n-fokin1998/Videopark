# AGENTS.md — Videopark

Instructions for AI coding agents (Claude Code, Cursor, Codex, etc.) and humans working on this repository.
This is the **single source of truth** for agent instructions. `CLAUDE.md` only imports this file.

---

## 1. What we are building

A **digital archive and musical memorial** for the band **«Станция Видеопарк»** (Videopark Station, Brovary, Ukraine, 2016–2020)
and its founder and only permanent member **Евгений (Женя) Мычак** (1999–2020).

It is **not** a "Home / Bio / Discography" band site. It is a *place*: the visitor "arrives at the station",
starts listening, wanders between photos, lyrics, video and history, and only gradually learns Zhenya's full story.
Memory is expressed through the presence of his music, images and thoughts — **not** through constant reminders of death.

Core metaphor turned into UX: **a metro station on a single line.** Each section is a station:

```
Платформа → Музыка → История → Тексты → Фото → Видео → Бровары (terminal)
   (+ «Женя» — full biography, reached deeper; «Об архиве» — service room)
   The «Воспоминания» (memory board) station is deferred — not in current scope.
```

Read before doing anything non-trivial:

| Doc | What it answers |
|---|---|
| [docs/vision.md](docs/vision.md) | Why the site exists, for whom, what it must feel like, principles, signature ideas |
| [docs/information-architecture.md](docs/information-architecture.md) | Stations, URLs, navigation, transitions, cross-links, user journeys |
| [docs/design.md](docs/design.md) | Visual language: color, type, texture, motion, sound, components |
| [docs/architecture.md](docs/architecture.md) | Tech stack, project structure, rendering model, persistent player, performance budgets |
| [docs/content-model.md](docs/content-model.md) | Content collections, schemas, entity relations, media pipeline |
| [docs/content-inventory.md](docs/content-inventory.md) | What the owner has uploaded to `content/`, how it maps to releases/songs, known gaps and issues |
| [docs/integrations.md](docs/integrations.md) | Self-hosted audio, SoundCloud, curated Instagram posts, YouTube/video, Bandcamp |
| [docs/i18n.md](docs/i18n.md) | RU now, EN/UK later: routing, strings, what is and is not translated |
| [docs/editorial-guidelines.md](docs/editorial-guidelines.md) | Tone of voice, how we write about Zhenya and his death, facts & sources, rights |
| [docs/roadmap.md](docs/roadmap.md) | Phased implementation plan, MVP scope, definition of done, open questions |
| [docs/decisions.md](docs/decisions.md) | Architecture/product decision log (ADR-lite). Append, never rewrite history |

Project rules live in [.claude/rules/](.claude/rules/) — they are scoped by file path and are mandatory.
Agents that do not auto-load that folder (Cursor, Codex…) must read the relevant rule file before editing matching files.

---

## 2. Tech stack (planned)

- **Astro** (latest stable major, ≥ 5) — static output (`output: 'static'`), Content Layer API, `<ClientRouter />` view transitions.
- **TypeScript 6.0** in `strict` mode (`astro/tsconfigs/strictest`); TS 7 waits for typescript-eslint / astro check support (D-024).
- **Svelte 5** (confirmed) for the few stateful islands (player, timeline, lyrics viewer, station map). Everything else is zero-JS `.astro`.
- **nanostores** for cross-island state (player queue, sound on/off, theme).
- **GSAP** (+ ScrollTrigger, SplitText) for orchestrated motion; **Lenis** for optional smooth scroll; native **View Transitions** for page changes.
- **astro:assets** (`<Picture>`, AVIF/WebP) for images; precomputed waveform JSON for audio.
- **Pagefind** for static full-text search (lyrics, history, captions).
- Plain CSS with custom properties (design tokens) + Astro scoped styles. No Tailwind (confirmed — see [docs/decisions.md](docs/decisions.md)).
- Tooling: **pnpm**, ESLint (`eslint-plugin-astro`, `typescript-eslint`), Prettier (`prettier-plugin-astro`, `prettier-plugin-svelte`),
  **Vitest** (unit), **Playwright** + `@axe-core/playwright` (e2e + accessibility).
- Hosting and domain: decided once the site is complete and verified locally (roadmap phase 9). Any static host works.

### Commands

```bash
pnpm install
pnpm dev            # local dev server
pnpm build          # static build (+ pagefind index from phase 8)
pnpm preview        # serve the build
pnpm check          # astro check (types + content schemas)
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm test           # vitest
pnpm test:e2e       # playwright (+ axe)
pnpm lighthouse     # Lighthouse budgets against pnpm preview (local, reports in .lighthouseci/)
pnpm validate:content  # broken refs, missing/unreferenced media, verbatim lyrics, certainty & TODO(content) report
pnpm verify         # full local quality gate: lint, check, test, validate:content, build, e2e + axe, lighthouse
pnpm media          # needs ffmpeg: FLAC → AAC + waveform peaks, video posters, EXIF report → public/media/ (git-ignored)
```

Before declaring a task done, run `pnpm check && pnpm lint && pnpm test` (and `pnpm test:e2e` for UI changes).

---

## 3. Repository layout

```
content/                  # ALL site content (outside src/ on purpose — editors work here)
  knowlage-base/          # raw research in Russian (source material; never rendered directly)
  releases/ songs/ recordings/ eras/ timeline/ writings/ people/ places/ quotes/
  pages/ interviews/ instagram/
  photos/ tracks/ videos/ lyrics/  # media + lyric files provided by the project owner (+ metadata sidecars)
docs/                     # product & technical documentation (English)
.claude/rules/            # scoped project rules (English)
src/
  content.config.ts       # collection schemas (Zod) — the contract for content/
  components/             # station/, player/, timeline/, lyrics/, media/, ui/
  layouts/                # BaseLayout, StationLayout
  pages/                  # routes (see information-architecture.md)
  i18n/                   # locale config, UI strings, helpers
  lib/                    # pure TS: content queries/relations, motion, dates, time-of-day, slugs
  stores/                 # nanostores shared by islands (theme, sound, ui)
  styles/                 # tokens.css, global.css, typography.css, motion.css
scripts/                  # node scripts: media pipeline, content validation, soundcloud oEmbed ingest
public/                   # favicons, robots.txt, files served as-is
tests/                    # e2e (playwright)
```

---

## 4. Non-negotiables

1. **Tone.** Quiet, alive, slightly nostalgic. Never a "memorial cemetery": no black ribbons, candles, crosses, "RIP" banners,
   gravestone imagery, or death mentioned on the entry experience. See [docs/editorial-guidelines.md](docs/editorial-guidelines.md).
2. **Facts.** Every factual statement must trace back to `content/knowlage-base/` or a cited source. Do not invent biography,
   quotes, dates, tracklists, or lyrics. Uncertain facts are marked as such (schema field `certainty`). If you lack content, use a
   clearly marked placeholder (`TODO(content): …`), never plausible fiction.
3. **Zhenya's words are sacred.** Quotes and lyrics are reproduced verbatim (keep his punctuation and spelling choices). Translations are
   always labelled as translations and shown next to the original, never replacing it.
4. **Music first.** The persistent player must survive page navigation (`transition:persist`). Never break playback with a full reload.
5. **Static first.** No runtime server, no client-side calls to third-party APIs for content that can be fetched at build time.
6. **Performance & accessibility are features.** Respect `prefers-reduced-motion`, keyboard navigation, captions, contrast.
   Sound never autoplays — entering the station («Войти на станцию») never turns sound on. Budgets in [docs/architecture.md](docs/architecture.md).
7. **Responsive, mobile-first.** Every station is fully usable and beautiful from 360 px phones (portrait and landscape, touch) to wide desktops.
   See [docs/design.md §6](docs/design.md#6-layout-and-responsive-behaviour).
8. **i18n-ready from day one.** No hard-coded UI strings in components — use `t()` from `src/i18n`. Russian is the only locale at launch
   and is served without a URL prefix (`/music`); future locales are prefixed (`/uk/music`, `/en/music`).
9. **Privacy.** No third-party trackers, no Meta/Google embeds loaded before user interaction (facades only). Cookie-less analytics at most.
10. **Media comes from the owner.** Photos, video, audio and lyrics are provided by the project owner in `content/`. Never download media
    from the internet into the repo. Every media entry has `credit` and `alt` (images). Audio masters (FLAC, ~1.8 GB) and video files stay
    out of git (see `.gitignore` and decision D-010).

---

## 5. Working conventions

- **Language:** code, comments, docs, rules, commit messages — English. Site content and UI copy — Russian (later EN/UK).
- **Branches:** `VDPRK-<ticket>-short-description` (current: `VDPRK-0`). Base branch: `master`.
- **Commits:** imperative, small, scoped: `feat(player): persist queue across navigation`. Conventional-commit prefixes
  (`feat`, `fix`, `content`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`).
- **Content changes** use the `content(...)` prefix and must pass `pnpm check` (schema validation).
- **Decisions:** when you make a choice that changes architecture, UX patterns or dependencies, append an entry to
  [docs/decisions.md](docs/decisions.md).
- **Docs stay true:** if implementation diverges from a doc, update the doc in the same change.
- **New dependency?** Justify it (size, need, alternative) in the PR description. Prefer platform features over libraries.
- Do not rename `content/knowlage-base/` without coordinating — other docs and scripts reference this path.

## 6. When in doubt

- Product/feel questions → [docs/vision.md](docs/vision.md), then ask the user.
- "Would this feel like a cemetery?" → if yes, don't.
- "Is this fact sourced?" → if no, don't publish it.
- "Does this break the music?" → if yes, find another way.
