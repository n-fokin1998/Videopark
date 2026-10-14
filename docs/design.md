# Design — visual language

The look, sound and motion of «Станция Видеопарк». Product intent is in [vision.md](vision.md), structure in
[information-architecture.md](information-architecture.md). Implementation rules: [.claude/rules/styling.md](../.claude/rules/styling.md),
[.claude/rules/motion.md](../.claude/rules/motion.md).

## 1. Concept: «Песня как вечер»

One sentence brief: **a suburban metro platform at dusk, seen through a home video camera, with a poem taped to the wall.**

Four visual sources, always mixed — never one alone:

| Source | What it gives | How it shows up |
|---|---|---|
| **The station** | Structure, navigation, wayfinding | Line map, station signs, Kyiv-metro-style typography, the red line, the wordmark |
| **The evening** | Mood, colour, light | Twilight gradients, sodium-lamp amber, lit windows, long shadows, slowness |
| **The home tape** | Texture, honesty, the "Видео" in Видеопарк | Film grain, soft iPhone-6 photos, timecodes, subtle VHS tracking in transitions, lo-fi imperfection |
| **The poem** | Voice, intimacy | Generous serif typography for lyrics and quotes, white space, nature imagery (вода, дождь, лес, весна) |

Rule of thumb: **the station organises, the evening colours, the tape textures, the poem speaks.**

What we do **not** do: black-and-white mourning palette, candles, ribbons, crosses, gothic type, heavy vignettes, glitch-art overload,
neon synthwave, "rock band" grunge fonts, stock photography, emoji.

## 2. Colour

Default theme is **Evening**. Themes shift with the visitor's local time (see §8). All tokens live in `src/styles/tokens.css`.

### Core palette (Evening)

| Token | Hex (starting point) | Role |
|---|---|---|
| `--c-night` | `#0E1117` | Deepest background, Evening mode base |
| `--c-dusk` | `#171E2A` | Default page background |
| `--c-twilight` | `#2C3A55` | Raised surfaces, gradients' upper sky |
| `--c-haze` | `#5E6F8F` | Secondary text on dark, borders, inactive line dots |
| `--c-paper` | `#ECE6DA` | Primary text on dark; background of "paper" surfaces (lyrics sheets, poems and prose) |
| `--c-ink` | `#1A1A1A` | Text on paper |
| `--c-lamp` | `#E9A94B` | Accent: sodium street lamp. Focus rings, active states, the "lit window" |
| `--c-line` | `#C2453D` | Metro red line (muted Kyiv M1). Used *only* for the line map/indicator and station signs |
| `--c-water` | `#7A9BB3` | Secondary accent: water, rain, «Гидро»; links on dark |
| `--c-moss` | `#6F7D5C` | Tertiary: forest, spring; tags/themes |

Rules:
- Accent budget per screen: one dominant accent (`--c-lamp`) + the line red where navigation is shown. Water/moss only for content-semantic details.
- Text contrast ≥ 4.5:1 (body) and ≥ 3:1 (large text, UI). Validate every theme. `--c-haze` is not for body text on `--c-dusk`.
- Never pure `#000` or `#FFF`.
- Colours are defined as semantic tokens (`--bg`, `--bg-raised`, `--fg`, `--fg-muted`, `--accent`, `--line`, `--focus`) mapped from the palette
  per theme. Components use only semantic tokens.

### Themes (time of day)

| Theme | Local time | Feel | Notes |
|---|---|---|---|
| `dawn` | 05–09 | Cold blue → pale pink, quiet | Light-ish: paper background, ink text |
| `day` | 09–17 | Overcast suburban daylight | Light: paper background, muted greys; least atmospheric |
| `evening` | 17–23 | **The canonical look**: twilight blue + amber lamps | Default for SSR, no-JS, link previews |
| `night` | 23–05 | Near black, lit windows, fewer elements | Darkest, lowest contrast between surfaces (but text still AA) |

The user can pin a theme in «Схема» (persisted). `prefers-color-scheme` is respected as a tie-breaker: light preference → dawn/day allowed;
dark preference → evening/night only.

## 3. Typography

Cyrillic-first. Every font must cover Russian **and Ukrainian** (і, ї, є, ґ) and Latin (for EN). Self-hosted via Fontsource, subset, `font-display: swap`,
preload only the two critical files.

| Role | Family (proposal) | Use |
|---|---|---|
| **Sign / UI** | *Golos Text* (variable) | Station names, navigation, buttons, labels, metadata headings. Echoes clear metro wayfinding |
| **Poem / prose** | *Literata* (variable, with italics) | Lyrics, quotes, biography, long reading |
| **Tape / data** | *IBM Plex Mono* | Timecodes, dates, durations, catalogue numbers (RPS131), track numbers |

(Alternatives if the visual exploration prefers them: *Onest* or *Manrope* for UI; *Spectral* or *PT Serif* for poems. Max three families total.)

Scale (fluid, `clamp()`), base 18px on desktop, 17px on mobile:

| Token | Approx size | Usage |
|---|---|---|
| `--fs-station` | 56–120px | Station name on arrival / station hero (Golos, tight tracking, sometimes all caps like a sign) |
| `--fs-h1` | 40–64px | Page titles |
| `--fs-h2` | 28–40px | Section titles |
| `--fs-quote` | 24–36px | Pull quotes (Literata italic) |
| `--fs-lyrics` | 20–24px | Lyrics (Literata, line-height 1.6, measure ≤ 36ch) |
| `--fs-body` | 17–19px | Prose (Literata, line-height 1.65, measure 60–70ch) |
| `--fs-ui` | 14–16px | UI text (Golos) |
| `--fs-meta` | 12–13px | Mono metadata, uppercase letter-spaced allowed |

Rules:
- Lyrics are set **as poems**: left-aligned, preserved line breaks and stanza gaps, hanging punctuation where possible, no justification,
  no drop caps, no decorative fonts. His punctuation and lowercase choices are kept.
- Russian typography: «ёлочки» quotes, em dash with spaces ( — ), non-breaking spaces after short prepositions/conjunctions
  (a build-time typograf step handles this — see [architecture.md](architecture.md)).
- Song and release titles are always in their original language and casing, in all locales.

## 4. Texture, light and image treatment

- **Grain.** A single, very subtle animated film-grain overlay (CSS/canvas, ≤ 4% opacity), static under reduced motion. Never on text-heavy reading surfaces at full strength.
- **Light leaks / lamps.** Soft radial amber glows used as "lamps" to draw attention (e.g. behind the play button of the track of the evening).
- **Photos.** Shown honestly, not over-filtered. A shared treatment: slight warm/cool grade toward the current theme on hover-out,
  full colour on focus/open. Timecode/date label in mono in a corner like a camcorder overlay («REC · 16.06.2019») where the date is known.
- **Covers.** Never cropped, never filtered — covers are someone else's artwork; shown as-is with credit.
- **Paper surfaces.** Lyrics sheets and the early poems/prose sit on `--c-paper` with a faint paper texture and soft shadow, as if taped up.
- **Water.** On the arrival and Evening mode only: a slow, low-contrast water/reflection shader (WebGL, lazy, optional) — a nod to Гидропарк and «Вода», «Дождь», «Плавится лёд».
  Fallback: static gradient image.

## 5. Signature components

### The wordmark «Станция Видеопарк»

The main logo is the band name, crafted with care — **not** the Г→В gag (that story lives in История, see below).

- **Concept: a station name plate.** «Станция» is set small, in tracked capitals (Golos, medium), like the label above a station name;
  «Видеопарк» is the large name — custom-adjusted lettering based on Golos Text with softened terminals and a slightly open, hand-made
  rhythm, so it reads as a metro sign drawn by a person, not a corporate logotype.
- **The red line.** A thin `--c-line` stripe runs under (horizontal version) or beside (stacked version) the name, ending in a station dot —
  the same dot used in the line indicator, so the logo and the navigation are one system.
- **Light.** On the platform the wordmark "switches on" like a station lamp: a soft amber glow (`--c-lamp`) warms up behind the letters over
  `--dur-slow`, then settles. No flicker, no glitch. Static under reduced motion.
- **Variants:** horizontal (header, desktop), stacked «Станция / Видеопарк» (platform hero, mobile), compact mark — the red-line dot with
  «СВ» or a single «В» inside — for favicon, app icon and tight spaces. Monochrome paper-on-dusk and ink-on-paper versions.
- **Rules:** never distorted, never shown in the «Гидропарк» form outside История, clear space = height of «В». The lettering is live text (crisp, selectable, read as «Станция Видеопарк»); stripe and dot are
  decorative. The compact mark is an SVG drawn with paths (no font dependency) with `<title>`, also used as `public/favicon.svg` (D-026).
- Latin form for future EN: «Videopark Station» in the same construction; the Cyrillic wordmark stays primary in all locales.

### The name-origin scene (История)

The Г → В animation belongs only to the opening scene of История, «Откуда название» (structure in
[information-architecture.md §6](information-architecture.md#история-history)):

- Visual: an evening metro car → a tiled station wall with the plate **«Гидропарк»** in Kyiv-metro-like lettering → a child's line
  *«Станция Видеопарк!»* appears as text (handwritten-feeling, small, warm) → the **«Г» flips to «В»** (split-flap rotation around the
  horizontal axis, or a paper sticker gently pressed over the letter) → «Станция» lights up above → the plate becomes «Станция Видеопарк»,
  echoing the wordmark, and the scene hands over to the timeline.
- Driven by scroll on desktop (GSAP ScrollTrigger, no scroll-jacking: the page scrolls normally, the scene is sticky for its length);
  on mobile a shorter sticky sequence or tap-to-advance frames; under reduced motion two static frames side by side / stacked.
- Silent. Text only — the boy's voice is never synthesised.

### Other components

| Component | Description |
|---|---|
| **Station sign** | Station name plate: Golos, generous tracking, red line stripe on the left, subtitle (e.g. «Музыка · 2016–2020»). Used as the hero of each station |
| **Line indicator** | Thin line, 7 dots, current station lit in `--c-line` with a soft glow, terminal Бровары drawn as a ring. Dots have labels on hover/focus. Mobile: compact «← prev · **current** · next →» |
| **Line map overlay** | Full-screen diagram: the red line with stations, grey "transfer" lines to Женя/people/places, search, toggles. Hand-tuned SVG, not generic. Vertical orientation on phones |
| **Player bar** | Bottom bar, `--bg-raised` with blur. Mono timecode, waveform (precomputed peaks, drawn in `--c-haze`, played part in `--c-lamp`). Expanded sheet with queue and lyrics line (full-screen sheet on mobile) |
| **Release card** | Cover + title + year in mono + type. Hover/focus: cover lifts slightly, a play button "lamp" appears. On touch the play button is always visible |
| **Timeline rails** | Two thin horizontal rails (recorded / released), year markers in mono, release connectors as soft curves, events as small dots. Mobile: vertical with labelled badges |
| **Lyrics sheet** | Paper surface, Literata, current line highlighted by a soft amber underline/glow when synced |
| **Instagram card** | Our own card for a curated post: image(s), date in mono, caption excerpt, «открыть в Instagram» link |
| **Next-station footer** | Large «Следующая станция —» + station name, red line arrow; full-width click target. On Бровары: «Конечная» |
| **Quote** | Literata italic, large, with «ёлочки», attribution in mono small caps; generous space around |

## 6. Layout and responsive behaviour

The site is **mobile-first and fully responsive**. Most visitors will arrive on a phone from a shared link; the phone experience is the
primary one, not a reduced version of desktop. Every station must be complete and beautiful from **360 px** up to wide desktop (1920 px+),
in portrait and landscape, with touch, mouse and keyboard.

### Grid and spacing
- 4-column fluid grid on phones, 8 on tablets, 12 on desktop. Most stations break the grid deliberately for atmosphere
  (asymmetric photo placement, wide margins around poems) — but only from tablet width up; on phones the layout is a calm single column.
- Side gutters: ≥ 16px on phones, growing fluidly (`clamp()`) to generous margins on desktop.
- Reading measure: 60–70ch prose, ≤ 36ch lyrics. On phones lyrics use the full width minus gutters; long lines wrap with a hanging indent
  so the verse structure stays readable.
- Generous vertical rhythm: sections separated by at least `--space-2xl` (scaled down on phones). Silence is part of the design.
- No horizontal page scroll anywhere except the desktop timeline (an explicit horizontal scroller with keyboard support).

### Breakpoints (tokens; prefer container queries for components)

| Token | Min width | Typical devices |
|---|---|---|
| base | 0 | phones 360–430 px |
| `--bp-md` | 640px | large phones landscape, small tablets |
| `--bp-lg` | 960px | tablets landscape, small laptops |
| `--bp-xl` | 1280px | laptops/desktops |
| `--bp-2xl` | 1680px | wide screens (cap content width, grow atmosphere, not text) |

### Per-component mobile behaviour

| Area | Phone behaviour |
|---|---|
| Line indicator | Compact «← prev · current · next →»; full line in «Схема» |
| Line map («Схема») | Full-screen sheet, line drawn vertically, large tap targets, search on top |
| Player | Bottom bar within thumb reach, respects `env(safe-area-inset-bottom)`; tap opens a full-screen sheet; swipe down to close |
| Arrival | Shorter (≤ 2.5 s), lighter effects, no WebGL on low-end devices (check `deviceMemory` / `hardwareConcurrency` and reduced-data hints) |
| Name-origin scene | Shorter sticky sequence or tap-to-advance frames; text never overlaps the art |
| Timeline | Vertical, year by year; recorded/released shown as labelled badges/columns; era rooms as full-width sections |
| Music grid | 2 columns of covers; list view as an option on very narrow screens |
| Photos | One/two-column contact sheet; lightbox with swipe, pinch-zoom, safe areas |
| Lyrics | Full width, comfortable 19–20px; the sticky mini-player never covers the text |
| Video | Full-width 16:9 facades; fullscreen on play |
| Hover effects | Every hover-only affordance has a touch/focus equivalent (`@media (hover: hover)` for hover-only decoration) |

### Technical rules
- Use `dvh`/`svh` units for full-height scenes (mobile browser toolbars), never bare `100vh`.
- Respect safe areas (`env(safe-area-inset-*)`) for notches and the home indicator.
- Hit targets ≥ 44×44px; spacing between adjacent targets ≥ 8px.
- Images served with correct `sizes` per breakpoint — phones never download desktop-size images.
- Test matrix: 360×740, 390×844, 430×932 (portrait + landscape), 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080;
  iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari.
- The player bar reserves its space (`padding-bottom` on `body`) once visible — no content hidden underneath.

## 7. Motion

**Tempo: evening.** Slow-in, gentle, long holds — but interactions respond immediately (< 100 ms feedback).

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 120ms | Hover, press feedback |
| `--dur-short` | 240ms | Small UI (tooltips, toggles) |
| `--dur-medium` | 500ms | Panels, cards, reveals |
| `--dur-long` | 800ms | Page transitions between stations (≈ 500ms on phones) |
| `--dur-slow` | 1400ms | Arrival, Evening mode, theme shifts, wordmark lamp |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | Default (entering) |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | Train-like movement |
| `--ease-in` | `cubic-bezier(.55,0,1,.45)` | Leaving |

Motion vocabulary:
- **Train movement** — horizontal slides between stations, direction = line direction.
- **Doors** — two halves parting (arrival only).
- **Lamp** — elements fade in from a soft glow (amber radial) rather than sliding from nowhere; the wordmark switches on this way.
- **Flip** — the single Г → В letter flip, used only in the name-origin scene in История.
- **Tape** — very rare, short VHS tracking line across the screen on station change (≤ 200 ms, optional, off with reduced motion).
- **Breathing** — Evening mode gradient slowly changes hue over ~60 s cycles.
- **Text** — headings may reveal line by line (SplitText); lyrics never animate letter by letter (reading comes first).

Rules: max one orchestrated sequence per screen; no scroll-jacking; no parallax on text; no infinite attention-grabbing loops in reading areas;
under `prefers-reduced-motion: reduce` everything becomes crossfades ≤ 150 ms, grain is static, shaders are off.

## 8. Time-of-day behaviour

- On the client, after hydration, compute the theme from local time, set `data-theme` on `<html>`, transition colours over `--dur-slow`.
- SSR/no-JS/OG images use `evening`.
- An inline script in `<head>` applies a persisted user-pinned theme *before* paint (no flash).
- Small touches per theme: e.g. at night more windows are "lit" in the platform illustration; at dawn the grain is lighter.

## 9. Sound design

Sound is part of the identity, but **never forced**.

- **The arrival is silent.** «Войти на станцию» never enables sound. Music starts only when the visitor presses play.
- Ambient/UI sounds are controlled by a separate «Звук» toggle (in «Схема» and the player), **default off**, persisted.
- When «Звук» is on: optional, very quiet ambient bed per station (platform hum, Brovary field recordings), ducked to silence when music plays;
  at most a soft passing train on station change.
- UI sounds: at most a soft click for play/pause — synthesised with Web Audio (≈ 60 ms, very quiet), so no asset is downloaded.
  Volume ≤ −24 LUFS relative. Ambient beds wait for owner-provided recordings.
- Music fades in/out over 300 ms on play/pause; crossfade between queue items optional (default off, songs are short and intimate).

## 10. Iconography & illustration

- Minimal line icons (1.5px stroke), custom set for: play, pause, next, prev, queue, lyrics, evening mode, map, sound, share, external link.
- No icon fonts. Inline SVG with `currentColor`.

### Illustrated scenes

Three places on the site need **drawn imagery**, because no photographs of them exist in the archive:

| Scene | What is drawn | Used in |
|---|---|---|
| **Platform** | An evening metro platform: edge of the platform, columns, lamps, the station plate with the wordmark, the train arriving (light sweep, doors) | Платформа (arrival + platform state) |
| **Name-origin scene** | Inside a metro car at dusk → tiled station wall with the plate «Гидропарк» → the letter Г flipping to В | История (opening) |
| **Brovary map** | A stylised, simplified map of the town: main streets, forest, the road to Kyiv, the red metro line ending at Лісова, dots for places tied to songs/photos | Бровары |

Style for all three: flat, few colours from the palette, drawn — not 3D, not photoreal; built as **layered SVG** so parts can be animated
(lamps, doors, the flipping letter) and recoloured per time-of-day theme; light enough for phones.

Production options (decision Q8 in [roadmap.md](roadmap.md#open-questions)):
1. **Code-drawn SVG (default, no extra cost):** geometric, signage-like vector scenes made in code from the design tokens (lines, tiles, lamps,
   type). Fits the metro-signage concept; least "hand-made".
2. **Commissioned illustrator:** a person draws the three scenes to this spec as layered SVG/AI files. Most personal and poetic; needs a brief,
   budget and time.
3. **Photo-based:** real photos taken by the owner (Гидропарк station, a metro car, Brovary streets), treated with the site's grade/grain and
   combined with SVG overlays (the plate, the letter flip, the line). Most documentary.

The map in options 1–2 is drawn over public geographic data (OpenStreetMap, ODbL, with attribution) — no Google Maps tiles or embeds.

## 11. Accessibility in the visual system

- Focus ring: 2px `--c-lamp` outline + 2px offset on every interactive element. Never removed.
- Hit targets ≥ 44×44px.
- Information never conveyed by colour alone (e.g. timeline rails are labelled «записано» / «вышло»).
- Captions and transcripts for video; alt text for every photo (describing, not interpreting).
- The name-origin scene's text is real HTML in reading order; the animation is decorative (`aria-hidden`).

## 12. Design deliverables (before/alongside implementation)

1. Moodboard (evening platforms, Kyiv metro signage, suburban Brovary, camcorder footage, poetry book layouts).
2. Token sheet for all four themes with contrast checks.
3. Wordmark «Станция Видеопарк»: horizontal, stacked, compact mark, favicon set, lamp animation spec.
4. Arrival sequence storyboard (6–8 frames) + reduced-motion and mobile versions.
5. Name-origin scene storyboard (Гидропарк → Видеопарк) + static fallback + mobile version.
6. Key screens, **mobile and desktop for each**: Платформа, Музыка (index + release), История, Тексты (song), Фото, Видео, Бровары,
   Женя, «Стихи и проза», player (collapsed/expanded), line map.
7. Motion spec for station-to-station transitions.
