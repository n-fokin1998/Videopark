---
paths:
  - "src/components/media/**"
  - "src/components/player/**"
  - "scripts/**"
  - "content/instagram/**"
  - "content/videos/**"
  - "content/tracks/**"
  - "content/photos/**"
---

# Media & third-party integration rules

Spec: [docs/integrations.md](../../docs/integrations.md).

- **Own media first.** Audio, photos, video and lyrics are provided by the owner in `content/`. The player plays self-hosted files first.
- **Build offline.** `astro build` must succeed without network and never call external APIs. Optional helper scripts (e.g. SoundCloud oEmbed
  link check) write results into `content/` and are committed via PR.
- **No third-party code before interaction.** YouTube/Vimeo/Bandcamp/SoundCloud/Mixcloud are facades (poster + button) that inject the iframe
  on click. Use privacy-enhanced hosts (`youtube-nocookie.com`). Meta scripts (Instagram `embed.js`) may only load after an explicit click on
  «показать оригинальный пост» — never on page load.
- Audio resolver order per recording: self-hosted file → SoundCloud Widget API behind our UI → external link. One UI for all backends.
  Show the source attribution (e.g. "SoundCloud") when a third-party backend plays.
- **Instagram (instagram.com/evgeniymychak):** there is no account access and no API token. Only specific, curated posts are shown, listed by
  permalink in `content/instagram/posts.txt` (converted to `posts.yaml`, tracking parameters stripped), with media saved locally by the owner and rendered as our own cards linking to the
  original. Never scrape Instagram, never hot-link Instagram CDN URLs (they expire).
- Every external link to official releases (Bandcamp, Raw Pop Syndicate, Apple Music, Instagram) uses `rel="noopener"`; links that would
  interrupt playback open in a new tab with an accessible "opens in new tab" hint.
- Secrets (if any helper script ever needs one) only in `.env` / CI secrets; never imported in client code and never prefixed `PUBLIC_`.
- Video and music share audio focus: starting a video pauses the music player.
- Verify current terms/behaviour of any third-party embed before implementing and record findings in `docs/decisions.md`.
