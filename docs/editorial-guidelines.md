# Editorial guidelines

How we write on «Станция Видеопарк» — in any language. Applies to UI copy, biography, captions, release stories, alt text and commit-reviewed content.

## 1. Voice

- **Quiet, warm, precise.** Short sentences. Concrete details over adjectives. Like a friend showing you records in the evening.
- **Present the work in the present tense** where natural: «На этом EP Женя поёт…», «Песня звучит как вечер».
- **Use "Женя"** in most places — that's how friends, the label credits («Женя Мычак») and listeners know him. Full name «Евгений Мычак»
  on first mention in the biography, in structured data and in `/about`.
- **No superlatives or hype:** not «гениальный», «легендарный», «культовый». Let the music argue.
- **No pathos, no clichés of mourning:** not «ушёл слишком рано», «светлая память», «вечная память», «ангел», «на небесах», «RIP».
- **Not a press release, not Wikipedia.** But accurate enough to be cited.

UI copy uses the metro voice — short, kind, slightly poetic:
- «Войти на станцию» · «Следующая станция — Тексты» · «Конечная» (Бровары) · «Станция закрыта. Поезд дальше не идёт.» ·
  «Осторожно, двери закрываются» (only as a playful, rare touch — e.g. leaving Evening mode).

## 2. Writing about his death

The site does not hide the death and does not display it.

- **Where:** the History timeline (2 August 2020, one sentence), the «Женя» biography (a short chapter), `/about` (context of the archive),
  structured data (`deathDate`). **Not** on the arrival, not in station heroes, not in page titles, not in OG images, not in release cards.
- **How:** factual and brief. Standard formula (based on open sources):
  «2 августа 2020 года Жени не стало. Ему был 21 год. В конце июля он попал в автомобильную аварию.»
- **Not:** medical details (injury lists from the knowledge base stay in the knowledge base), speculation, blame, sensational wording,
  photos of the accident or of funerals/graves.
- **After:** the narrative continues with the music: posthumous releases, the tribute, listeners. The last word is the music, not the death.
- Posthumous releases are described as «вышло после» / «архивные записи», with the recording date leading.

## 3. Facts and sources

- Every fact comes from `content/knowlage-base/` (compiled from open sources) or a cited source. Add the source to the entry's `sources`.
- Mark uncertain facts with `certainty` and phrase them accordingly: «по-видимому», «по данным Neformat», «≈ 2017».
- Known discrepancies are not "fixed" silently (e.g. «Сторона» says Kyiv — he lived in Brovary; Bandcamp tag "Saint Petersburg" is the label's city).
  State the correct fact; mention the discrepancy in `/about` or a note if it matters.
- Do not invent: lyrics, quotes, tracklists, dates, anecdotes, motives, feelings. If missing → «Архив ищет».
- Numbers that change (Last.fm listeners) are always dated: «≈ 5,4 тыс. слушателей на Last.fm (октябрь 2026)». Prefer not to show them at all on emotional pages.

## 4. Quotes and lyrics

- Verbatim. Keep his punctuation, ellipses, lowercase, and spelling choices. Silent fixes of obvious typos only in *interviewer* text
  (e.g. «Густные товарищи» → «Грустные товарищи»), and only when they're plainly typos.
- Always attribute: «— Женя Мычак, интервью изданию «Сторона»».
- Borrowed texts are credited prominently: «Слова: Робер Деснос, „Последнее стихотворение“», «Слова: Илья Кормильцев, „Ленивые огни“»;
  cover: «Гриптэйп» — песня группы «электроребята».
- Lyrics are transcribed from recordings only by careful listening; uncertain words are marked `[неразборчиво]` and the song gets `lyricsStatus: partial`.
  Lyrics provided by the project owner (in `content/lyrics/`) take precedence and are reproduced exactly as provided.
- **Early poems and prose (2014)** are published verbatim, with his spelling and punctuation as written (no "fixing"), each with its date.
  They are introduced by one neutral sentence (e.g. «Стихи и короткая проза, написанные в январе 2014 года») — no commentary on their maturity,
  no psychological reading.

### The name-origin story (История)

The only source is Zhenya's answer in the «Сторона» interview. Tell it with his words, add nothing:
- Quote verbatim: «Совершенно случайно услышал в метро, как эту фразу крикнул маленький мальчик маме, когда поезд подъезжал к станции „Гидропарк“».
- A short paraphrase around it may set the scene (a metro car, a station, a child, a mother) but must not invent details — no date, no line
  direction, no reaction of Zhenya, no "that evening he decided…".
- Follow it with the second interview quote about «Грустные товарищи» vs «Станция» («…дать этому предложению немного больше посидеть в музыке»).
- Draft (to refine at implementation):
  «Название появилось случайно. В киевском метро, когда поезд подъезжал к „Гидропарку“, маленький мальчик крикнул маме: „Станция Видеопарк!“»

## 5. People and privacy

- The biography is compiled from open sources; no family approval is required. Still: no family names, no home address, no school names beyond what is in public sources.
- Photos are provided by the project owner; if a photo shows private people in a sensitive context, ask the owner before publishing (note in `rights.note`).
- Anyone can ask for correction or removal via `/about`; such requests are honoured promptly.

## 6. Rights and credits

- Credit everything: photographers, cover artists (Данил Манжос, Дима Комаров…), the label (Raw Pop Syndicate), sources (Neformat, «Сторона»).
- Audio, photos and video are provided by the project owner; always also link to official releases (Bandcamp, Raw Pop Syndicate).
- Takedown contact on `/about`.

## 7. Alt text and captions

- Describe what is visible, briefly and concretely: «Женя с гитарой на балконе, вечер, за окном фонари». Do not interpret emotions or add commentary.
- Captions follow the pattern: what · where · when · credit. «На репетиции. Бровары, 2019. Фото: …»
- Video: captions for speech/lyrics; audio description where meaningful.

## 8. Word list

| Use | Avoid |
|---|---|
| Женя Мычак; Евгений Мычак (formal) | «покойный», «трагически погибший» as epithets |
| «Станция Видеопарк» (and «Видеопарк» for 2018 context) | «группа Станция Видеопарк» without quotes in running text |
| минимал-вейв, lo-fi, bedroom pop, домашняя запись | «андеграундная легенда» |
| Бровары (RU), Бровари (UK), Brovary (EN) | «пригород Киева» as the only identification |
| архивный релиз, вышло после | «посмертный хит» |
