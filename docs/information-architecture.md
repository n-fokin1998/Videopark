# Information architecture

How the site is structured, how people move through it, and how entities link to each other.
Visual treatment of everything here lives in [design.md](design.md); data shapes in [content-model.md](content-model.md).

## 1. The model: one line, seven stations

The site is a single metro line. Stations are ordered — there is a "forward" direction — but every station is reachable
from every other one through the line map. Order follows the progressive-disclosure arc from [vision.md](vision.md):
atmosphere and music first, the full biography last. The line ends in **Бровары** — the terminal, where everything was recorded
(the real red line M1 runs through Гидропарк toward Brovary).

```
 ●────────●────────●────────●────────●────────●────────◉
Платформа  Музыка   История  Тексты   Фото     Видео    Бровары (конечная)
   /       /music   /history /lyrics  /photos  /video   /brovary
                       │                                   │
                       └──────── «Женя» (/zhenya) ─────────┘
                       full biography — a deeper platform
                       reached from the end of История and from Бровары

 Service rooms (outside the line): «Об архиве» /about · «Вечер» /evening · 404 «Станция закрыта»
```

| # | Station (RU label) | Route | Purpose | Primary content |
|---|---|---|---|---|
| 0 | **Платформа** | `/` | Arrival, atmosphere, choose a direction | Silent arrival sequence, wordmark, line map, track of the evening, one quote |
| 1 | **Музыка** | `/music` | Listen. The heart of the site | Releases, recordings, player, versions |
| 2 | **История** | `/history` | Understand the path 2014–2020 and after | The name-origin scene (Г → В), two-rail timeline, eras |
| 3 | **Тексты** | `/lyrics` | Read the words | Lyrics as poems, sources, poets, synced playback |
| 4 | **Фото** | `/photos` | See | Photo albums, selected Instagram posts, covers |
| 5 | **Видео** | `/video` | Watch | Clips, live session, home video, tributes |
| 6 | **Бровары** | `/brovary` | Feel the place (terminal station) | Map, places, field recordings, "how to get here" |
| — | **Женя** | `/zhenya` | The full story, with care | Long-form biography, quotes, the interview |
| — | **Вечер** | `/evening` | Full-screen listening mode | Player, breathing gradient, current lyric line |
| — | **Об архиве** | `/about` | Trust & credits | Sources, methodology, credits, contacts, «Архив ищет» |

**Deferred:** the **Воспоминания** (memory board) station is not part of the current scope. The station registry
(`src/lib/stations.ts`) must make adding a station later a data change, not a redesign.

Route slugs are Latin and locale-independent. Russian is served **without a prefix** (`/music`); future locales get prefixes
(`/uk/music`, `/en/music`) — see [i18n.md](i18n.md).

## 2. Full route map

```
/                                   Платформа
/music                              all releases (grid / list / by year)
/music/[release]                    release page (cover, tracklist, credits, story, links out)
/lyrics                             index of songs (alphabetical, by year, by theme)
/lyrics/[song]                      song page = lyrics + all recordings of this song + sources
/lyrics/writings/[writing]          early poem or prose text (2014)
/history                            name-origin scene + two-rail timeline (2014 → 2020 → posthumous releases)
/history/[era]                      era room: 2014-2016-nachalo, 2017-moi-milyi-dom, 2018-videopark, 2019-raw-pop-syndicate, 2020-vne-vremeni, posle
/photos                             albums + loose photos + «Из Instagram»
/photos/[album]                     album (lightbox deep links: /photos/[album]#[photo])
/video                              video index
/video/[video]                      video page (player facade, context, related songs)
/brovary                            map + places
/brovary/[place]                    optional place page if it has enough material
/zhenya                             full biography (chaptered)
/people/[person]                    poets, collaborators, cover artists (lightweight "transfer" pages)
/evening                            Evening mode
/about                              about the archive, sources, credits, «Архив ищет»
/404                                «Станция закрыта» — with the line map
/rss.xml                            updates feed (new archive additions)
```

Era slugs etc. are defined in content, not hard-coded. Keep URLs stable forever — redirect if anything moves.

## 3. Global navigation

Always present (except during the arrival sequence and in Evening mode):

1. **Line indicator** (top). A thin horizontal line with 7 dots; the current station is lit and named. Clicking a dot travels there.
   On mobile it collapses to "← Музыка · **История** · Тексты →" (see [design.md §6](design.md#6-layout-and-responsive-behaviour)).
2. **«Схема» button** (line map overlay). Opens a full-screen metro map: stations, transfers (Женя, people, places), search field
   (Pagefind), language switcher (later), sound toggle, link to «Об архиве». Keyboard: `M` opens, `Esc` closes.
3. **Persistent player bar** (bottom). Appears after the first play. Collapsed: title, play/pause, progress.
   Expanded: queue, waveform, lyrics line, "open song", "Evening mode". Survives navigation.
4. **Next-station footer.** Every station ends with «Следующая станция — Тексты» (and a smaller «← Предыдущая»).
   On Бровары: «Конечная. Поезд дальше не идёт» + transfer to «Женя» and back to the start of the line.
5. **Sound toggle («Звук»).** Ambient/UI sounds on/off, **off by default**, persisted. Music playback is separate and always user-initiated.

No hamburger-menu-with-a-list as the main nav. The line map *is* the menu.

## 4. Transitions between stations

Implemented with Astro `<ClientRouter />` + View Transitions API (see [architecture.md](architecture.md) and [design.md](design.md#7-motion)).

| From → To | Transition | Notes |
|---|---|---|
| Forward along the line | Content slides out left / in from right, like a train leaving; line indicator dot travels | Duration ~700 ms (shorter on mobile) |
| Backward along the line | Mirror direction | Direction computed from station index |
| Jump via line map | Map zooms into the target station, then crossfade | |
| List → detail (release cover, photo, song title) | Shared-element morph (`transition:name`) | e.g. cover thumbnail morphs into release hero |
| Anything → Evening mode | Slow fade to twilight (~1.2 s), UI dissolves | |
| Reduced motion | Plain 150 ms crossfade everywhere | Mandatory |

The player (`transition:persist`) and the line indicator never animate out.

## 5. The arrival sequence (Платформа)

The arrival is **visual only and silent**. Entering the station never turns on sound; sound is enabled only by the explicit
«Звук» toggle, and music only by pressing play.

```
[ first visit ]                                   [ returning visit (localStorage flag) ]
 Dusk platform; the wordmark «Станция Видеопарк»   Skip straight to state 3, short fade
 lights up like a station lamp
   │
   ▼
 «Войти на станцию»  ← one button, purely navigational/visual
   ▼
 Train arrives (light sweep along the platform), doors open
   ▼
 Platform state: line map as main navigation, track of the evening (press play to listen), one quote, a few photo fragments
```

- Skippable at any point (`Esc`, a visible «пропустить»), fully static under reduced motion.
- No-JS fallback: the platform state renders server-side; the arrival is progressive enhancement.
- Crawlers and link previews see the platform state with real content (not an empty intro).
- On mobile the sequence is shorter (≤ 2.5 s) and uses lighter effects (no WebGL on low-end devices).

## 6. Station contents

### Музыка `/music`
- **Views:** by year (default, mirrors history), grid of covers, plain list. Filters: release type (EP/single/album/live/archival).
- **Release page:** cover (big), title, type, dates (*recorded* and *released* — both, when they differ), tracklist with play buttons,
  credits (music, lyrics, recording, cover art), story paragraph, label & catalogue no., external links (Bandcamp, SoundCloud,
  Apple Music), "other versions of these songs", related photos/videos, previous/next release.
- **Versions:** a song recorded several times (e.g. «33 шага / 37 минут» 2:37 vs «33 / 37» live 3:22) is shown as one song with
  multiple recordings, never as duplicates.
- Play a whole release, or "play everything chronologically" (by recording date).
- **«Мой милый дом»** survives as one continuous 24-minute file with an unknown tracklist: shown as an album with a single long recording
  and an «Архив ищет» note. If the tracklist is restored, chapter markers are added to the same file.
- **«Отдельные песни»**: songs with audio but no known release get their own section at the end of the station ("unreleased / outside albums").

### История `/history`

**Opens with the name-origin scene — «Откуда название».** Based on Zhenya's own words in the «Сторона» interview:

> «Совершенно случайно услышал в метро, как эту фразу крикнул маленький мальчик маме, когда поезд подъезжал к станции „Гидропарк“».

Scene (scroll-driven, ~3 screens on desktop, ~2 on mobile):
1. A Kyiv metro car interior at dusk; the train slows down. Text: the story in a short, quiet paraphrase plus the quote.
2. The station wall slides into view with the sign **«Гидропарк»**. A child's voice is shown as text, not audio: *«Станция Видеопарк!»*.
3. The **«Г» flips to «В»** — like a split-flap letter or a sticker pasted over the plate — and the sign now reads **«Видеопарк»**;
   «Станция» lights up above it. The flip happens once, on scroll, then holds.
4. Transition into the beginning of the timeline (2016), together with his second quote about the difference between projects:
   «„Грустные товарищи“ — это если бы я говорил предложение резко, обрывисто; а „Станция“ — как если бы я дал этому предложению
   немного больше посидеть в музыке».

Reduced motion / no JS: a static two-frame composition (sign «Гидропарк» → sign «Видеопарк») with the same text. The scene has a permalink
(`/history#nazvanie`) and also appears in the 2014–2016 era room.

**Then the timeline:**
- **Two rails**: upper rail *recorded*, lower rail *released*. Releases are drawn as connectors between the two rails
  (recorded Aug 2016 → released May 2020). Life events (Pink Floyd at 8, first band 2014, «Ультранасилие», «Грустные товарищи»)
  sit on a third, thin "life" thread, together with **concerts** known from the uploaded videos (Odessa 2018, Moscow 2019, Kyiv rehearsal 2019…),
  each linking to its video in Видео. Early writings (January 2014) also appear on this thread.
- Horizontal scroll on desktop (drag, wheel, keyboard arrows); **vertical stacked layout on mobile** with the rails turned into
  labelled columns/badges.
- **Eras** are rooms with their own atmosphere: 2014–2016 *Начало*, 2017 *Мой милый дом*, 2018 *Видеопарк*,
  2019 *Raw Pop Syndicate*, 2020 *Вне времени*, and *После* (posthumous releases, tributes).
- **2 August 2020** is marked by a gap in the life thread — the line simply ends, without icons. One sentence of text.
  The *released* rail continues past it, quietly making the point that the music kept arriving.
- End of station: transfer to «Женя» (full biography).

### Тексты `/lyrics`
- Index by title, by year, by image/theme (вода, дождь, лес, весна, ночь, окна, сны, фонари) — theme tags are a poetic way in.
- **Song page:** lyrics typeset as a poem; recordings of this song with play buttons; if timestamps exist, the current line is
  highlighted while playing; annotations for borrowed texts (Деснос — «Последнее стихотворение», Кормильцев — «Ленивые огни»);
  "share this line" → lyric card; related photos.
- **«Полка поэтов»** (poets' shelf) section: poets he sang and loved, linking to `/people/*`.
- **«Стихи и проза»** (`/lyrics/writings/[slug]`): his early poems and short prose (January 2014, age 14), typeset like the lyrics,
  dated, reproduced verbatim with his original spelling, introduced by one quiet sentence about when they were written.
- Missing lyrics are listed honestly: «текст пока не добавлен».

### Фото `/photos`
- Albums (by period or source), loose photos in a calm masonry/contact-sheet layout; lightbox with captions, date, place, credit.
- **«Из Instagram»**: a curated selection of specific posts from [instagram.com/evgeniymychak](https://www.instagram.com/evgeniymychak),
  shown in our own layout with a link to each original post (see [integrations.md](integrations.md#2-instagram)).
  Instagram post 1 is a set of 2016 film photos Zhenya shot on his father's «Смена» camera — shown as its own album («Плёнка, 2016»),
  credited to Zhenya.
- Release covers as a separate album, credited to their artists (Данил Манжос, Дима Комаров, …).

### Видео `/video`
- **Music video** «До встречи» (local file).
- **Concerts and rehearsals** (YouTube, click-to-load facades): More Music Club, Odessa (23.06.2018); rehearsal in More Music Club (15.02.2018);
  Powerhouse, Moscow — Omut: naive perspective (13.06.2019); festival «Волна-2», Moscow (10.08.2019); odyssey (10.03.2017); «Клише» — OMUT;
  rehearsal, Kyiv (2019); covers and collaborations («Залив» — Рыцарь Диких Яблок cover; feat. Полотенчик — «Люблю отдыхать»).
- Grouped by event (one event = one card with several songs), sorted by date; each video links to its songs and to the event on the timeline.
- The nowa ściana wschodnia tribute (Mixcloud) — link card.
- Click-to-load facades only.

### Бровары `/brovary` — конечная
- Stylised map (not Google Maps) with places tied to songs and photos.
- Field recordings / ambient loops of the town (if provided; play only on demand), photos of light, streets, forest.
- «Как доехать»: М1 (red line) to Лісова, then the bus to Brovary — the real journey to the station.
- Ends the line: «Конечная» → transfer to «Женя».

### Женя `/zhenya`
- Long-form, chaptered biography written per [editorial-guidelines.md](editorial-guidelines.md). Chapters:
  1. Бровары, Pink Floyd в восемь лет · 2. Музыкальная школа, колледж, первая группа · 3. «Ультранасилие» и «Грустные товарищи» ·
  4. Мальчик в метро (short; links to the scene in История) · 5. Дом как студия · 6. Поэзия · 7. Raw Pop Syndicate · 8. Вне времени ·
  9. Август 2020 · 10. Музыка продолжается.
- **No visual exhibits.** The home studio (Squier Bullet Strat, iPhone 6, computer) is only *mentioned in the text* of «Дом как студия»
  (there are no photos of these objects). Chapters are illustrated only with real photos from the archive (portraits, period photos, covers).
- «Поэзия» links to his early poems and prose in Тексты («Стихи и проза»).
- The full interview with «Сторона» as a primary source, presented as a conversation.
- Quotes pulled out typographically. Sources at the end.

### Об архиве `/about`
- What this archive is and who maintains it; methodology (biography compiled from open sources); sources list; certainty legend; credits;
  rights & takedown contact; «Архив ищет» list: the lost tracklist of «Мой милый дом» (the album survives as one 24-minute file),
  songs without a known release («Когда я летаю», «Нет ничего проще», «21 марта», «Вечер и я пойду», «Моя хрустальная душа», «По другому»,
  «Посмотри на нас», «Тишина», «Третьеапрельский», «Число зовут к числам вернуться»), songs known only from concert videos
  («Я включаю электричество», «Northern Sun», «Люблю отдыхать»), and missing lyrics. Current gaps: [content-inventory.md](content-inventory.md).

## 7. Cross-linking ("Пересадки")

Every entity page ends with a **Пересадки** block listing related entities. Relations are derived from content references,
never maintained by hand in two places (see [content-model.md](content-model.md#4-relations)).

```
           ┌──────────── Person (poet, artist, collaborator)
           │                 │
Release ── Recording ── Song ── Lyrics themes
   │           │          │
   │           └── Video ─┤
   │                      │
   └── TimelineEvent ── Photo ── Place (Brovary)
                          │
               Video (concerts) ── Song · Writing (poems, prose) ── Biography
```

Examples: «Плавится лёд» → Кормильцев (person) → «Последствия праздника» (release) → July 2019 (event) → Бровары (place).
«До встречи» → music video + live version on «RAW STUFF VOL. 5» + EP «Куда бы мы не отправились».

## 8. Key user journeys

1. **New listener, mobile, from a shared link to `/lyrics/plavitsya-lyod`:** sees lyrics + play button → plays → player bar
   persists → "Пересадки" → release → «Следующая станция — Фото». (Deep links skip the arrival; the line indicator orients them.)
2. **New listener, desktop, `/`:** silent arrival → «Войти на станцию» → presses play on the track of the evening → line map → Музыка → explores.
3. **Curious about the name:** `/history` → the Гидропарк → Видеопарк scene → timeline → «Женя».
4. **Fan:** `/music` → play everything chronologically → Evening mode → shares a lyric line.
5. **Journalist:** `/zhenya` or `/history` → fact → source link in `/about`. Search via «Схема» finds any title instantly.

## 9. SEO & sharing

- Each page has a real title/description in the page locale, canonical URL, `hreflang` (once locales exist), OG image.
- Structured data: `MusicGroup` (band), `Person` (Zhenya), `MusicAlbum`/`MusicRecording` (releases/recordings), `VideoObject`.
- Build-time OG images: releases (cover + title), songs (a lyric line).
- `sitemap.xml` (`@astrojs/sitemap`), `robots.txt`, RSS for archive updates.

## 10. Empty & edge states

- No audio for a recording yet → show it with "слушать на Bandcamp/SoundCloud" link, never a dead button.
- Unknown dates → show "≈ 2017" with certainty marker, not a fake exact date.
- 404 → «Станция закрыта. Поезд дальше не идёт.» + line map.
- Offline/slow network → text and layout load first; media lazy; player shows buffering calmly.
