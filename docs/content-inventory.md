# Content inventory

What the project owner has uploaded to `content/`, how it maps to the content model, and what is missing or needs a decision.
Snapshot: **2026-10-11** (phase 1 ingestion done — every file below is mapped to collection entries). Update this file whenever files are added or issues are resolved.
Conventions: [content-model.md §7](content-model.md#7-content-intake-owner-uploads).

## 1. Totals

| Area | Files | Size | Notes |
|---|---|---|---|
| Audio (`content/tracks/`) | 56 FLAC | ≈ 1.75 GB | 3 h 28 min total; 24-bit (a few 16-bit), 44.1/48 kHz. Masters — not committed to git (D-010) |
| Photos (`content/photos/`) | 26 unique + 4 copies in `portraits/` + 14 covers | ≈ 19 MB | No captions yet |
| Video (`content/videos/`) | 1 local MP4 + 12 YouTube links | ≈ 38 MB | |
| Instagram (`content/instagram/`) | 7 posts, 13 images + 1 video | ≈ 4 MB | |
| Lyrics (`content/lyrics/`) | 22 songs | small | UTF-8, CRLF |
| Writings (`content/knowlage-base/`) | 3 poems + 2 prose texts (Jan 2014) | small | |
| **Total** | | **≈ 1.78 GB** | |

## 2. Releases → audio, cover, lyrics

✅ present · ⚠️ issue · ❌ missing

| Release | Audio | Cover | Lyrics | Notes |
|---|---|---|---|---|
| «3» (EP, 2016; archival 2020) | ✅ Вода, Вечер, Дождь | ✅ | ✅ 3/3 | |
| «Ещё один день» (archival EP, 2020; rec. 2016) | ✅ Ещё один день, Приходить к тебе, В твоём окне | ✅ | ✅ 3/3 | «Приходить к тебе» — words by Robert Desnos |
| «Ты» (archival EP, 2020; rec. 2016) | ✅ Ночь, Ты, Из плена моих снов | ✅ | ✅ 3/3 | |
| «Я бездельник и дома своего я раб» | ✅ | ✅ | ✅ | |
| «Так сложно стало дышать (Теперь)» | ✅ | ✅ | ✅ | Lyrics file is named «Так сложно дышать (Теперь).txt» — mapped by the agent |
| «Сон» (2017) | ✅ | ✅ | ❌ | |
| «Лес — Весна — Песня мечтателя» (2017) | ✅ 3/3 | ✅ | ✅ 3/3 | |
| «Мой милый дом» (album, 2018) | ⚠️ one 24:12 file | ❌ | ❌ | Tracklist unknown → one `full-release` recording + «Архив ищет» |
| «33 шага / 37 минут» (single, 2019) | ❌ (2:37 version) | ❌ | ✅ («33 - 37») | Cover by Данил Манжос per knowledge base |
| «Хорошее время» (EP, 2019) | ⚠️ 4/5 | ✅ | ❌ (except «33 / 37») | Missing «Самое лучшее время»; «Будни», «33 / 37», «Хорошее время», «Автоответчик» are recordings shared with other releases — issues A, B, I |
| «Куда бы мы не отправились» (EP, 31.05.2019) | ✅ Куда бы мы не отправились, Колебания, До встречи | ✅ | ❌ 0/3 | New in knowledge base, no source link yet (`certainty: probable`) |
| «Никогда не оставит» (EP, 2019) | ✅ 3/3 | ✅ | ❌ 0/3 | |
| «Последствия праздника» (EP, 2019) | ✅ 4/4 | ✅ | ✅ 3/4 | «Какой-то там час (интро)» — instrumental? «Плавится лёд» — words by Ilya Kormiltsev; «Гриптэйп» — электроребята cover |
| «В ногу с суетой» (2019; archival 2020) | ✅ В ногу с суетой, Будни (Instrumental) | ✅ | ❌ | See issue B |
| «RAW STUFF VOL. 5» (live, 2020) | ✅ 10/10 | ✅ | partly via studio songs | Three recordings shared with «Хорошее время» (issues A, I) |
| «Вне времени» (EP, 2020) | ✅ 4/4 | ✅ | ✅ 4/4 | Cover by Дима Комаров |

### Songs outside releases (`content/tracks/Отдельные/`)
21 марта · Вечер и я пойду · Когда я летаю · Моя хрустальная душа · Нет ничего проще · По другому · Посмотри на нас · Тишина ·
Третьеапрельский · Число зовут к числам вернуться — all ✅ audio, ❌ lyrics, no dates. Shown in Музыка → «Отдельные песни».
(«Нет ничего проще» was announced for «Мой милый дом» in 2017 — possibly part of the album.)

### Songs known only from video
«Я включаю электричество», «Northern Sun» (Odessa, 2018), «Люблю отдыхать» (feat. Полотенчик), «Залив» (Рыцарь Диких Яблок cover, 2017).

## 3. Issues that need the owner's decision

| # | Issue | Proposed handling until resolved |
|---|---|---|
| A | `RAW STUFF VOL. 5/33 - 37.flac` and `Хорошее время/33 - 37.flac` are **the same file** (identical hash, 3:23). The knowledge base says the EP and live versions are different recordings | **Resolved (owner, 2026-10-11):** one recording (`33-shaga-37-minut--raw-stuff-vol-5`) appears on both releases, like issue B; its date is left to the releases, `certainty: uncertain`. The single (2:37) stays a separate recording (issue D) |
| B | `Хорошее время/Будни.flac` and `В ногу с суетой/Будни (Instrumental).flac` are **the same file** | **Resolved:** one instrumental recording appears on both releases |
| C | «Самое лучшее время» (track 5 of «Хорошее время») — no audio | External link only |
| D | Single «33 шага / 37 минут» (2:37) — no audio, no cover | External link only |
| E | «Мой милый дом» — one continuous file, no cover, no tracklist | Single long recording, typographic placeholder cover, «Архив ищет» |
| F | Cover credits: `covers/notes.md` names Данил Манжос for «Хорошее время»; the knowledge base names him for the single «33 шага / 37 минут» | Credit «Хорошее время» per the owner's note; keep the knowledge-base credit for the single; confirm whether both are true |
| G | Folder/EP title «Куда бы мы не отправились» vs live track «Куда бы мы с тобой не отправились» | Treat as one song with two recordings (studio + live) unless told otherwise |
| H | EP «Куда бы мы не отправились» — release date 31.05.2019 has no source | `certainty: probable`; add a source link (Bandcamp/VK) if available |
| I | `Хорошее время/Автоответчик.flac` and `Хорошее время/Хорошее время.flac` are the same recordings as the RAW STUFF VOL. 5 files (audio correlation 0.87 / 0.80, equal durations; the EP files are a lossy re-encode tagged «Sefon.Pro») | **Resolved (owner, 2026-10-11):** duplicate tracks belong to both releases — one recording each (`…--raw-stuff-vol-5`, the clean files) on «Хорошее время» and «RAW STUFF VOL. 5»; recording date left to the releases, `certainty: uncertain`. The EP copies are listed in `content/unused-media.yaml`. Rule for future cases: a file duplicated across releases is one recording referenced by every release |
| J | Photos/covers with alcohol, smoking, a possible minor, a mid-finger selfie, readable licence plates, a cover reflection that reads as a cross | **Resolved (owner, 2026-10-11):** all photos are displayed as provided, regardless of content; no review notes are kept |

## 4. Photos

- Year folders: 2016 (2), 2017 (9), 2018 (2), 2019 (8), 2020 (5). `portraits/` = 4 copies of year photos → `featured: true`.
- No `notes.md` yet: dates are only the folder year; place, people and photographer unknown. Until captions arrive, the agent writes
  descriptive `alt` text from the image and sets `credit: «Архив проекта»` with `TODO(content)`. **Done:** year albums in
  `content/photos/<year>/album.yaml` with alt text for all 26 photos; 9 are marked `hero: true`.
- Resolutions 432 px – 2560 px. Two are small (432×432 in 2017, 719×404 in 2019) — used only at small sizes (grid thumbnails), never as heroes.
- Good hero candidates: 2560-px photos in 2017, 2019, 2020 and the portraits.
- **No photos of Brovary places, the metro, or the instruments** — see §8.
- Metadata: no photo carries EXIF or GPS. The Instagram images carry Instagram's own IPTC block (no location); `pnpm media --only=images --strip-exif`
  removes it losslessly if wanted — built images never carry metadata either way.
- Covers: attached to the archival (Bandcamp) editions; the 2016–2019 originals have no cover of their own on file.

## 5. Instagram (7 curated posts)

| # | Date | Media | Notes |
|---|---|---|---|
| 1 | 14.07.2020 | 7 photos | 2016 film photos Zhenya shot on his father's «Смена» → album «Плёнка, 2016», credit: Женя Мычак |
| 2 | 07.07.2020 | video + photo | «ok computer» |
| 3 | 06.07.2020 | photo | «Станция Видеопарк и друзья…» |
| 4 | 24.06.2020 | photo | Names a friend («Витя») — caption is public; keep as is |
| 5 | 27.05.2020 | photo | Photo credit @fastfoodculture |
| 6 | 10.05.2020 | photo | |
| 7 | 06.04.2020 | photo | Photo credit @zav1z1on |

Links contain tracking parameters (`utm_source`, `srtk`, …) — stripped on import. Converted to `content/instagram/posts.yaml` (id = post shortcode).
Post 1 fills the album «Плёнка, 2016» (`content/photos/plyonka-2016/`). Three images duplicate year-folder photos:
`5_1.jpg` = `2020/bnjkb…png` (the Instagram copy is larger), `6_1.jpg` = `2020/4bakB…jpg`, `7_1.jpg` = `2019/4mpJi…jpg` — both kept, as a post and as an album photo.
The video in post 2 (`2_1.mp4`, 0:26) is git-ignored like other video; `pnpm media` copies it to `public/media/instagram/`.

## 6. Video

- Local: «До встречи» music video (MP4, 38 MB) — director/author unknown (`TODO(content)`).
- YouTube (12): concerts in More Music Club, Odessa (23.06.2018: «21 марта», «Я включаю электричество», «Автоответчик», «Northern Sun»);
  rehearsal «Лес» (15.02.2018); «Лес» at odyssey (10.03.2017); «Залив» cover (15.04.2017); «Дотронуться до солнца», Powerhouse Moscow,
  Omut: naive perspective (13.06.2019); «Приходить к тебе», festival «Волна-2», Moscow (10.08.2019); «Клише» — OMUT 02/04 (year unknown);
  Rehearsal, Kyiv (2019); feat. Полотенчик — «Люблю отдыхать» (no description).
- Posters: YouTube thumbnails are not hot-linked (privacy). Either the owner provides frames, or cards use a designed typographic poster.
- These videos are the only source for concerts → timeline events cite the video as `sources`.

## 7. Texts

- Lyrics: 22 songs present (see §2). Missing lyrics for: Сон, Хорошее время, Автоответчик, Никогда не оставит, Волшебная поляна,
  Увидимся завтра, В ногу с суетой, Куда бы мы не отправились, Колебания, До встречи, Дотронуться до солнца, and all 10 songs in «Отдельные».
  Instrumentals to confirm: «Будни», «Какой-то там час (интро)».
- Writings: «Странник», «Иногда я задаюсь вопросом...», «[Мы врём друг другу…]» (poems, 06.01.2014); «Ожидание» (07.01.2014), «Она» (06.01.2014) (prose).

## 8. Not provided (by design or not yet)

| Item | Status | Effect on the site |
|---|---|---|
| Photos of Squier Bullet Strat / iPhone 6 | Not provided | No visual exhibits; mentioned only in the biography text (D-020) |
| Photos of Brovary places, Гидропарк station | Not provided | Бровары station and the name-origin scene rely on illustration/typography — see roadmap Q8 |
| Ambient / field recordings | Not provided | Optional «Звук» ambient layer stays off/empty |
| Bandcamp/SoundCloud links per release | Partly in knowledge base | Used for external links and fallbacks |

## 9. Storage decision (D-010)

- Audio masters (FLAC) and video files are **excluded from git** via `.gitignore`; the owner keeps the originals (with a separate backup).
- `pnpm media` (phase 1, requires **ffmpeg** installed locally) generates web versions into a git-ignored folder:
  AAC `.m4a` 160 kbps (234 MB for the 52 recordings with a master) + waveform peaks JSON (800 points per recording), video remuxed
  with a poster frame. Everything lands in git-ignored `public/media/`; re-running skips up-to-date files.
- Byte-identical or re-encoded duplicates that are deliberately unused are listed with reasons in `content/unused-media.yaml`.
- Images (≈ 23 MB) and all texts are committed.
- Where the web audio lives in production (object storage/CDN vs. deploying with the site) is decided in phase 9 together with hosting.
