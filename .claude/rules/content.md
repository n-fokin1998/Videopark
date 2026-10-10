---
paths:
  - "content/**"
  - "src/content.config.ts"
  - "src/lib/content/**"
  - "scripts/validate-content.ts"
---

# Content rules

Model: [docs/content-model.md](../../docs/content-model.md). Tone: [docs/editorial-guidelines.md](../../docs/editorial-guidelines.md).

## Truth
- Facts come from `content/knowlage-base/` (RU research) or a cited source. Every entry with factual claims has `sources`.
- Never invent lyrics, quotes, dates, tracklists, credits, anecdotes. Unknown → leave the field empty, set `certainty`, or add to «Архив ищет».
- Quotes and lyrics are verbatim (keep his punctuation, ellipses, lowercase). Only plain interviewer typos may be corrected.
- `content/knowlage-base/` is source material: edit it only to add/correct research, never to "make content fit".

## Modelling
- Song ≠ Recording ≠ Release. A new version of a song is a new **recording**, not a new song.
- Musical items carry separate `recorded` and `released` partial dates (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`). Archival reissues use `reissueOf`.
- References go one way by id (`reference()`); reverse relations are computed in `src/lib/content/relations.ts`. Don't duplicate links.
- Slugs: Latin transliteration via `src/lib/slug.ts` rules, lowercase, hyphenated, permanent. Changing a published slug requires a redirect.
- Titles stay in the original language and casing in all locales.

## Media
- Photos, video, audio and lyrics are **provided by the project owner** and dropped into `content/` (see
  [docs/content-model.md §7](../../docs/content-model.md#7-content-intake-owner-uploads)). Never download media from the web into the repo.
- Owner-provided media is treated as cleared (`rights.status` defaults to `cleared`); still record `credit` (photographer, cover artist, source)
  and, for images, a descriptive `alt`.
- If a file's origin is unclear (e.g. no photographer known), set `credit` to the best known source and add a `TODO(content)` note — ask the owner.
- Strip EXIF/GPS from photos before committing (`pnpm media`). Never publish coordinates of private homes.
- Don't commit unprocessed huge masters to regular git — follow decision D-010 (LFS / object storage).
- No visual "digital exhibits": there are no photos of the instruments. The Squier Bullet Strat, iPhone 6 and computer are only mentioned in
  the biography text (chapter «Дом как студия»). Never substitute stock or downloaded images of these objects.
- Audio masters (FLAC) and video files are **not committed to git** (D-010); only metadata, lyrics, texts, images and generated peaks are.
- The audio files currently in `content/tracks/` and their known problems are tracked in [docs/content-inventory.md](../../docs/content-inventory.md) —
  read it before ingesting media and update it when something changes.

## Sensitive content
- Death: only in the timeline (one sentence), the biography chapter, `/about`, and structured data. No medical details, no accident imagery.
- Private people: named/pictured only when they already appear in public sources or the owner confirms it is fine (note in `rights.note`).

## Changes
- Commit prefix `content(...)`. Run `pnpm check` and `pnpm validate:content` before committing.
- The biography is compiled from open sources (`content/knowlage-base/`); no family sign-off is required. Flag any new, unsourced claim in the PR.
