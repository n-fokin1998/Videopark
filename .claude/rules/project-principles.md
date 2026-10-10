# Project principles (always apply)

These apply to every task in this repo. Details: [AGENTS.md](../../AGENTS.md), [docs/vision.md](../../docs/vision.md).

1. **It is a station, not a website.** Every screen should feel like a place on one metro line (Платформа → Музыка → История → Тексты →
   Фото → Видео → Бровары, the terminal; «Женя» is a deeper platform with the full biography). Use `src/lib/stations.ts`
   as the only source of station order, routes and labels. The «Воспоминания» station is deferred — do not build it unless asked.
2. **Quiet, alive, nostalgic — never a cemetery.** No candles, ribbons, crosses, "RIP", black mourning palettes, death on the arrival screen.
   Follow [docs/editorial-guidelines.md](../../docs/editorial-guidelines.md) for any user-facing text.
3. **Music never stops.** Never introduce a full page reload, a `<a target="_self" data-astro-reload>` or a layout change that remounts the player.
4. **No invented facts.** Biography, dates, quotes, lyrics and tracklists come only from `content/knowlage-base/` or cited sources.
   Missing data → `TODO(content): …` placeholder or an honest «Архив ищет» state.
5. **Static first.** Build-time data, zero runtime server, no client calls to third-party APIs for content.
6. **Progressive enhancement.** Content is readable without JS; motion and sound are layers on top.
7. **Accessible and fast by default.** Reduced motion, keyboard, screen readers, slow phones. Budgets in [docs/architecture.md](../../docs/architecture.md#8-performance-budgets).
   Sound is never turned on implicitly (not even by «Войти на станцию»).
8. **Responsive, mobile-first.** Design and test every component at 360 px first, then scale up. See [.claude/rules/responsive.md](responsive.md).
9. **i18n-ready.** No user-facing string literals in components; use `t()`. Russian URLs have no locale prefix.
10. **Media comes from the owner.** Photos, video, audio and lyrics are placed in `content/` by the project owner; never fetch media from the web into the repo.
11. **Docs are part of the change.** If you change behaviour described in `docs/`, update the doc. Record notable decisions in `docs/decisions.md`.
12. **Small, reviewable changes.** One concern per commit; conventional-commit prefixes; English in code, comments and commits.
