# Content model

All content is static, versioned in git under `content/`, loaded with Astro's Content Layer (`glob()` / `file()` loaders) and validated
by Zod schemas in `src/content.config.ts`. The schemas are the contract: if content doesn't validate, the build fails.

Source material: `content/knowlage-base/` (Russian research notes: `biography.md`, `releases.md`, `interview.md`). It is **input** for
authoring the collections below, never rendered directly.

## 1. Core modelling decisions

1. **Song ≠ Recording ≠ Release.** A *song* is a composition with lyrics («33 шага / 37 минут»). A *recording* is one concrete audio
   version of it (single version 2:37, live version 3:22). A *release* is a published item with a tracklist of recordings (single, EP,
   album, live session, archival reissue). This removes the false duplicates the discography warns about.
2. **Two dates for everything musical.** `recorded` and `released` are separate, both optional, both *partial dates* (`2016`, `2016-08`,
   `2016-08-14`). Reissues have their own `released` and point to the original via `reissueOf`.
3. **Certainty is data.** Facts that are uncertain carry `certainty: 'confirmed' | 'probable' | 'uncertain'` and `sources`.
   The UI shows a discreet marker for non-confirmed facts.
4. **Credits are data.** Media is provided by the project owner (see §7) and treated as cleared; every media item still carries `credit`
   (and `alt` for images) so authorship is always shown.
5. **Relations by id, one direction only.** Entities reference each other by slug ids (`reference()`); reverse links
   ("Пересадки") are computed in `src/lib/content/relations.ts`, never written twice.
6. **Original language is preserved.** Titles, lyrics and quotes are stored in the original language; translations are additional fields/files.

## 2. Shared types

```ts
// src/content.config.ts (sketch)
const partialDate = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/);           // "2017", "2017-03", "2017-03-01"
const certainty  = z.enum(['confirmed', 'probable', 'uncertain']).default('confirmed');
const localized  = z.object({ ru: z.string(), uk: z.string().optional(), en: z.string().optional() });
const sourceRef  = z.object({ title: z.string(), url: z.string().url().optional(), note: z.string().optional() });
const rights     = z.object({
  status: z.enum(['cleared', 'link-only', 'hidden']).default('cleared'),   // owner-provided media → cleared
  holder: z.string().optional(),       // "Raw Pop Syndicate", photographer name
  note: z.string().optional(),
}).default({ status: 'cleared' });
const credit     = z.object({ role: z.string(), name: z.string(), person: reference('people').optional() });
```

Build rule: entries with `rights.status: 'hidden'` (owner asked to keep a file out for now) are **not rendered**;
`validate-content.ts` reports missing `credit`/`alt` and media files in `content/` that no entry references.

## 3. Collections

### `releases` — `content/releases/<slug>.md`

| Field | Type | Notes |
|---|---|---|
| `title` | string | Original title, verbatim: «Последствия праздника» |
| `type` | `'single' \| 'ep' \| 'album' \| 'live' \| 'compilation'` | |
| `archival` | boolean | Raw Pop Syndicate 2020 archival editions |
| `reissueOf` | ref(releases)? | e.g. archival «3» (2020) → «3» (2016) |
| `recorded` | `{ from: partialDate, to?: partialDate, place?: ref(places) }` | |
| `released` | partialDate? | |
| `label` | string? | «Raw Pop Syndicate» |
| `catalog` | string? | «RPS131» |
| `tracks` | ref(recordings)[] | Ordered tracklist; may be empty with `tracklistKnown: false` |
| `tracklistKnown` | boolean | `false` for «Мой милый дом» |
| `cover` | image() ? | Via `astro:assets` |
| `credits` | credit[] | Cover art: Данил Манжос, Дима Комаров… |
| `links` | `{ bandcamp?, soundcloud?, appleMusic?, other?[] }` | |
| `era` | ref(eras) | |
| `projectName` | `'Станция Видеопарк' \| 'Видеопарк'` | Name used at release time |
| `certainty`, `sources` | | |
| body | markdown | Story of the release (RU) |

### `songs` — `content/songs/<slug>.md`

| Field | Type | Notes |
|---|---|---|
| `title` | string | Original |
| `written` | partialDate? | |
| `lyricsBy` | ref(people)? | Defaults to Женя Мычак; Деснос for «Приходить к тебе», Кормильцев for «Плавится лёд» |
| `lyricsSource` | `{ work: string, person: ref(people) }`? | «Последнее стихотворение», «Ленивые огни» |
| `coverOf` | `{ artist: string, title: string }`? | «Гриптэйп» (электроребята) |
| `themes` | enum[] | `вода, дождь, лес, весна, вечер, ночь, сны, окна, фонари, дом, город, время, отношения…` (fixed vocabulary in schema) |
| `lyricsStatus` | `'complete' \| 'partial' \| 'missing' \| 'instrumental'` | |
| `instrumental` | boolean | |
| `certainty`, `sources` | | |
| body | markdown | **Lyrics**, verbatim; stanzas separated by blank lines. Translations live in sibling files (see [i18n.md](i18n.md)) |

### `recordings` — `content/recordings/<slug>.yaml`

| Field | Type | Notes |
|---|---|---|
| `song` | ref(songs) | |
| `title` | string? | Override if it differs on the release («33 / 37» vs «33 шага / 37 минут», «Будни (instrumental)») |
| `version` | `'studio' \| 'live' \| 'demo' \| 'instrumental' \| 'intro' \| 'full-release'` | `full-release` = a whole release in one file («Мой милый дом», 24:12) |
| `chapters` | `{ t: number, title: string }[]`? | Optional markers inside a `full-release` file if the tracklist is ever restored |
| `recorded` | partialDate? + `place` | |
| `duration` | string `m:ss`? | |
| `audio` | `{ file?: string, soundcloud?: url, bandcamp?: url, rights }` | Resolver order: file → soundcloud → link |
| `peaks` | string? | Path to generated peaks json |
| `syncedLyrics` | `{ t: number, line: number }[]`? | Optional timestamps for synced highlight |
| `performers` | credit[] | «Женя Мычак — голос, гитара, компьютер» |

Recordings not referenced by any release (the `content/tracks/Отдельные/` folder) are shown in Музыка → «Отдельные песни».
Songs known only from concert videos («Я включаю электричество», «Northern Sun», «Люблю отдыхать», the cover «Залив») are `songs` entries
without recordings, linked from `videos.songs`.

### `eras` — `content/eras/<slug>.md`
`title` (localized), `from`, `to` (partialDate), `summary`, `palette` hint (optional per-era accent shift), `cover` image; body = era essay.
Planned: `2014-2016-nachalo`, `2017-moi-milyi-dom`, `2018-videopark`, `2019-raw-pop-syndicate`, `2020-vne-vremeni`, `posle`.

### `timeline` — `content/timeline/<year>.yaml` (list per year)
| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `date` | partialDate | |
| `rail` | `'life' \| 'recorded' \| 'released'` | Release events are usually derived from `releases`; this collection holds non-release events |
| `title` | localized | |
| `text` | localized? | One or two sentences |
| `links` | `{ releases?, songs?, photos?, people?, places? }` | |
| `certainty`, `sources` | | |

Derived at build: releases add `recorded` and `released` points automatically.

The **name-origin scene** that opens История (Гидропарк → Видеопарк) is authored as `content/pages/name-origin.ru.md`
(paraphrase + verbatim quotes from the «Сторона» interview, `sources` pointing to `interviews/storona`), not as a timeline event.

Timeline events also carry `kind` (`life | concert | rehearsal | writing`) and optional `videos` refs. Concerts and rehearsals come from the
uploaded video list (e.g. More Music Club, Odessa, 23.06.2018; Powerhouse, Moscow, 13.06.2019; «Волна-2», Moscow, 10.08.2019), with the
video as `sources`.

### `writings` — `content/writings/<slug>.md`
His own poems and short prose outside the songs. Source: `content/knowlage-base/стихи.txt` and `проза.txt` (January 2014).
`title` (verbatim; untitled poems use the first line in brackets, e.g. «[Мы врём друг другу, и ждём правды…]»), `kind` (`poem | prose`),
`date` (partialDate, as dated by him: `2014-01-06`), `source` (file name), `order`; body = text **verbatim**, including his original spelling
and punctuation (no corrections). Shown in Тексты → «Стихи и проза» and linked from the biography chapter «Поэзия».
Items: «Странник», «Иногда я задаюсь вопросом...», «[Мы врём друг другу, и ждём правды…]» (poems); «Ожидание», «Она» (prose).

There is **no `exhibits` collection**: no photos of the instruments exist, so the home studio is only described in the biography text (D-020).

### `people` — `content/people/<slug>.yaml`
`name` (localized; original spelling kept, e.g. `Robert Desnos` / «Робер Деснос»), `role` (`self | poet | artist | label | collaborator | musician | press`),
`years?`, `bio` (localized, 1–3 sentences), `links?`. Seed: Женя Мычак, Алексей Дьячков, Робер Деснос, Илья Кормильцев, Поль Верлен, Артюр Рембо,
Шарль Бодлер, Рафал Воячек, Данил Манжос, Дима Комаров, электроребята, Raw Pop Syndicate, Neformat, «Сторона», nowa ściana wschodnia.

### `places` — `content/places/<slug>.yaml`
`name` (localized), `kind` (`city | street | home | metro | nature | venue`), `coords?` (only for public places — **never the family home**),
`description`, `photos?`, `songs?`. Seed: Бровары, станция метро «Гидропарк», Киев, Санкт-Петербург (label city — context only).

### `quotes` — `content/quotes/<slug>.yaml`
`text` (original RU verbatim), `translations?` (localized, labelled), `source` (sourceRef — e.g. interview «Сторона»), `context?`, `featured` (boolean for platform rotation).

### `photos` — albums in `content/photos/<album>/album.yaml` + image files
Album: `title`, `period?`, `source` (`family | friends | band | instagram | press | covers`), `photos: [{ file, caption?, alt, date?, place?, people?, credit, rights, songs?, featured? }]`.
`alt` is required. Images are owner-provided; note anything special about private people in `rights.note`.
Year folders (`2016/` … `2020/`) become period albums. `portraits/` contains **copies** of photos that already live in year folders — it is a
selection, not an album: those photos get `featured: true` (used for the platform and biography), duplicates are not rendered twice.

### `videos` — `content/videos/<slug>.yaml`
`title`, `kind` (`clip | concert | rehearsal | home | tribute | interview`), `date?`, `event?` (`{ name, venue?, city?, date? }`),
`provider` (`youtube | vimeo | local | mixcloud`), `id`/`file`, `poster` (image; for YouTube a locally stored frame or a designed placeholder —
never hot-linked thumbnails), `captions?` (VTT path), `duration?`, `songs?`, `credit`, `rights`.
Generated from `content/videos/links.txt` (pipe table: title | description | link) + local files.

### `instagram` — `content/instagram/posts.yaml` + `content/instagram/media/*`
A **curated list of specific posts** from [instagram.com/evgeniymychak](https://www.instagram.com/evgeniymychak) (no account access, no API).
The owner maintains `content/instagram/posts.txt` (pipe table: № | date | caption | link); the agent converts it to `posts.yaml`.
Each item: `permalink` (required, **tracking parameters stripped** — keep only `https://www.instagram.com/p/<id>/`), `date?`, `caption?` (verbatim),
`media: [{ file, type: 'image' | 'video', alt }]` (files `media/<post>_<n>.<ext>`), `credits?` (photographers named in captions, e.g. `@fastfoodculture`),
`album?` (to also show it inside a photo album), `songs?`. Loaded via `file()` loader.
If `media` is empty, the card shows a text-only teaser with the link (and an optional click-to-load original embed — see integrations).

### `pages` — `content/pages/<slug>.<locale>.md`
Long-form singletons: `zhenya` (biography), `name-origin` (История opening scene), `about`, `brovary-intro`, `how-to-get-here`,
`archive-is-looking`. Frontmatter: `title`, `description`, `sections?`, `sources`. The biography uses `sections: [{ id, title }]` as chapter ids
(`brovary-pink-floyd`, `shkola-kolledzh`, `ultranasilie-grustnye-tovarishchi`, `malchik-v-metro`, `dom-kak-studiya`, `poeziya`,
`raw-pop-syndicate`, `vne-vremeni`, `avgust-2020`, `muzyka-prodolzhaetsya`) for deep links (`/zhenya#poeziya`).

### `interview` — `content/interviews/storona.md`
The «Сторона» interview as structured Q/A (`turns: [{ speaker: 'Сторона' | 'Женя', text }]`), with source and date if known.

## 4. Relations

```
releases.tracks ─────────▶ recordings ──song──▶ songs ──lyricsBy/lyricsSource──▶ people
releases.reissueOf ─────▶ releases
releases.era ───────────▶ eras
releases.credits.person ▶ people
timeline.links ─────────▶ releases | songs | photos | people | places
timeline.videos ────────▶ videos ──songs──▶ songs
photos.songs/place/people, videos.songs, instagram.songs, places.songs, writings (standalone, linked from pages/zhenya#poeziya)
```

`src/lib/content/relations.ts` builds an in-memory graph at build time and exposes:
- `transfersFor(entity)` → grouped related entities for the «Пересадки» block;
- `recordingsOf(song)`, `releasesContaining(recording)`, `versionsOf(song)`;
- `chronology({ by: 'recorded' | 'released' })` for "play everything chronologically" and the timeline rails.

Unit tests cover the graph against the real content (e.g. «Вода» has 2 recordings: EP «3» and «RAW STUFF VOL. 5»).

## 5. Slugs and ids

- Latin transliteration of the Russian title, lowercase, hyphenated, stable forever: «Плавится лёд» → `plavitsya-lyod`,
  «Вне времени» → `vne-vremeni`, «33 шага / 37 минут» → `33-shaga-37-minut`.
- Collisions resolved by suffix: song «Ты» → `ty`, release EP «Ты» (2020) → `ty-ep-2020`, single «Ты» (2016) → `ty-single-2016`.
- Recording ids: `<song-slug>--<release-or-version>` e.g. `33-37--raw-stuff-vol-5`.
- Slugs never change after publication; if they must, add a redirect.

## 6. Example entries (from the knowledge base)

```yaml
# content/releases/vne-vremeni.md (frontmatter)
title: Вне времени
type: ep
archival: false
recorded: { from: "2020-03", to: "2020-04", place: brovary }
released: "2020-04-21"
label: Raw Pop Syndicate
tracks:
  - vne-vremeni--vne-vremeni
  - bumazhnyi-korablik--vne-vremeni
  - vsem-znakomo--vne-vremeni
  - otzvuki--vne-vremeni      # bonus track
tracklistKnown: true
credits:
  - { role: "музыка, тексты, запись, сведение", name: "Женя Мычак", person: zhenya-mychak }
  - { role: "обложка", name: "Дима Комаров", person: dima-komarov }
links: { bandcamp: "https://rawpopsyndicate.bandcamp.com/album/ep-16" }
era: 2020-vne-vremeni
projectName: Станция Видеопарк
sources: [{ title: "Raw Pop Syndicate — Bandcamp", url: "https://rawpopsyndicate.bandcamp.com/album/ep-16" }]
```

```yaml
# content/releases/moi-milyi-dom.md (frontmatter)
title: Мой милый дом
type: album
recorded: { from: "2017-03", to: "2017-10", place: brovary }
released: "2018-02"
tracks:
  - moi-milyi-dom--full          # one 24:12 file, version: full-release
tracklistKnown: false            # → shown in «Архив ищет»
projectName: Видеопарк
certainty: probable
sources:
  - { title: "Neformat, 02.02.2018", url: "https://www.neformat.com.ua/ua/news/16447-videopark-vipustiv-novii-albom.html" }
```

## 7. Content intake (owner uploads)

Photos, video, audio and lyrics are **provided by the project owner** and placed in `content/`. Agents never download media from the internet.
The conventions below match what has actually been uploaded (October 2026); the current state and open issues live in
[content-inventory.md](content-inventory.md).

| What | Where | Convention |
|---|---|---|
| Audio | `content/tracks/<release title>/<song title>.flac` | One folder per release, named exactly like the release; files named by song title. Songs without a release → `content/tracks/Отдельные/`. FLAC masters (16/24-bit, 44.1/48 kHz). **Not committed to git** |
| Covers | `content/photos/covers/<release title>.jpg` | 1200×1200. Cover authors in `content/photos/covers/notes.md` |
| Photos | `content/photos/<year>/` | Year folders = period albums; `portraits/` = selection of featured photos (copies). Optional `notes.md` per folder with captions (date, place, people, photographer) |
| Video | `content/videos/` | Local files (not committed to git) + `links.txt` pipe table: title \| description \| link |
| Lyrics | `content/lyrics/<song title>.txt` | One file per song, verbatim; the agent converts them into `content/songs/<slug>.md` bodies (normalising CRLF → LF only) and keeps the raw file as source |
| Instagram | `content/instagram/posts.txt` + `media/<post>_<n>.<ext>` | Pipe table: № \| date \| caption \| link; media numbered by post |
| Writings & research | `content/knowlage-base/` | Free-form RU texts (`biography.md`, `releases.md`, `interview.md`, `стихи.txt`, `проза.txt`) |

Rules: never rename or delete owner files silently (derived/encoded files go to generated, git-ignored locations); keep originals as the
source of truth; EXIF/GPS is stripped in the generated copies; file-to-entity mapping is recorded in the entries (`audio.file`, `photos[].file`).

## 8. Authoring workflow

1. Research lands in `content/knowlage-base/` (RU, free-form, compiled from open sources).
2. Media and lyrics land in the drop zones above; [content-inventory.md](content-inventory.md) is updated.
3. An editor/agent converts facts and files into collection entries, citing `sources` and setting `certainty`.
4. `pnpm check` validates schemas; `pnpm validate:content` checks relations, missing `alt`/`credit`, unreferenced media files.
5. The project owner reviews the PR. (The biography is based on open sources — no separate family sign-off is required.)

## 9. Known gaps

Tracked in [content-inventory.md](content-inventory.md) (missing audio, covers, lyrics, captions, duplicate files) and surfaced on the site
through «Архив ищет».
