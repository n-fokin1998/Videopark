# Integrations

How external platforms relate to the site. Guiding rule: **own files first, render as our own UI, load third-party code only after a user action.**

> Third-party terms and behaviour change often. Before implementing any embed, verify the current official docs and record the outcome
> in [decisions.md](decisions.md).

## 1. Audio: self-hosted first, SoundCloud as fallback

The project owner provides the audio files in `content/tracks/` (see [content-model.md §7](content-model.md#7-content-intake-owner-uploads)).
Known external sources (for links and fallbacks): SoundCloud `soundcloud.com/videopark`, `soundcloud.com/videoparkstation`; Bandcamp
`stanciavideopark.bandcamp.com`, `rawpopsyndicate.bandcamp.com`; streaming via Raw Pop Syndicate.

Reference: [Aunty Archibald](https://auntyarchibald.com/) — a large SoundCloud archive presented through the site's own music interface.
We achieve the same feel with our own files and our own player.

### Resolver order per recording

1. **Self-hosted file** (`recording.audio.file`) — the default: our player, waveforms, synced lyrics, Media Session, no third-party tracking.
2. **SoundCloud Widget API** (`recording.audio.soundcloud`) — only for recordings without a local file. A hidden (or visually minimised)
   `<iframe>` of the SoundCloud player controlled through the Widget API (`SC.Widget(iframe)`: `load`, `play`, `pause`, `seekTo`, events
   `PLAY_PROGRESS`, `FINISH`). Our UI stays the same; the engine swaps backends. Constraints:
   - the widget script and iframe load **only after the user presses play**;
   - show the "SoundCloud" source label and link in the expanded player;
   - mobile browsers may require the play gesture to reach the iframe — test on iOS Safari early; fall back to showing the visible widget if needed;
   - no waveform without a local file → neutral progress bar.
3. **External link** — "Слушать на Bandcamp / SoundCloud / Apple Music". Never a dead play button.

Optional helper: `scripts/soundcloud-oembed.ts` calls the public oEmbed endpoint (`https://soundcloud.com/oembed?format=json&url=…`) to validate
SoundCloud fallback URLs. No API key. Run manually; commit the result.

### Bandcamp

- Release pages always link to Bandcamp (supports the label).

## 2. Instagram

Source: [instagram.com/evgeniymychak](https://www.instagram.com/evgeniymychak). **We have no access to the account** (no login, no API token),
so there is no automatic sync. The goal is to show **specific, curated posts**.

Constraints (verify at implementation time):
- The Instagram API requires a token from the account's owner/professional account → not available.
- oEmbed (`/instagram_oembed`) requires a Meta app access token → not planned.
- Instagram's own "Embed" code (a `<blockquote class="instagram-media">` + `embed.js`) works for public posts without a token, but loads Meta
  scripts and tracking, and breaks if the post is removed or the account becomes private.
- Image URLs from Instagram's CDN expire — never hot-link them.

Approach:
1. **Curated list.** The owner lists the chosen posts in `content/instagram/posts.txt` (pipe table: № | date | caption | link; the agent converts it to `posts.yaml` and strips tracking parameters from links)
   and saves the media (images, and videos where the post is a video) into `content/instagram/media/<post>_<n>.<ext>` (see [content-model.md §3](content-model.md#3-collections)).
2. **Our own cards.** Posts render as `InstagramCard` components in Фото («Из Instagram») and optionally inside photo albums or song pages:
   image(s), date, caption excerpt, «открыть в Instagram» link to the permalink. Fully static, no Meta code, works forever.
3. **Optional original embed (behind a facade).** For a post without saved images, the card shows a teaser and a button
   «показать оригинальный пост»; only on click do we inject Instagram's embed blockquote + `embed.js`. Never on page load.

## 3. Video

- Owner-provided local clips (`content/videos/`): `<video>` with `preload="none"`, poster, MP4 (H.264) + WebM, VTT captions, `playsinline`.
  Never autoplay with sound.
- **YouTube/Vimeo** (if the owner lists links): facade component (`VideoFacade.astro`): poster image + play button; on click, inject the
  `youtube-nocookie.com` / `player.vimeo.com` iframe with `autoplay=1`. The poster is local (a frame provided by the owner or a designed
  typographic card with title, venue and date) — YouTube thumbnail URLs are not hot-linked, so nothing is requested from Google before the click.
  Current list: `content/videos/links.txt` (12 concert/rehearsal videos, see [content-inventory.md](content-inventory.md#6-video)). Inspired by `lite-youtube-embed`; our own small Astro version to match the design.
- **Mixcloud tribute** (nowa ściana wschodnia): link card with description; optional click-to-load embed.
- When a video plays, the music player pauses (single audio focus) and resumes only on user action.

## 4. Search (Pagefind)

- Runs post-build over `dist/`. Indexes lyrics, song/release titles, history, biography, captions.
- Mark indexable regions with `data-pagefind-body`; exclude nav/player with `data-pagefind-ignore`.
- Russian stemming: `<html lang="ru">`; Pagefind picks the language per page (works for later `uk`/`en`).
- UI lives inside the line-map overlay; results grouped by station; full-screen on mobile.

## 5. Analytics (optional, decided at deployment)

- None, or cookie-less, privacy-first (Plausible/Umami). No Google Analytics, no Meta Pixel.
- Useful anonymous events: `play` (recording id), `station_view`, `evening_mode_open`, `name_origin_completed`.

## 6. Secrets

- None are needed for the current scope. If a helper script ever needs one: `.env` locally (gitignored) and CI secrets; never shipped to the client;
  never needed for `pnpm build`.

## 7. Deferred: memory board

The «Воспоминания» station is out of the current scope. If it returns, submissions must be moderated (form service or a single serverless
endpoint), with explicit consent and minimal data — to be designed then and recorded in [decisions.md](decisions.md).
