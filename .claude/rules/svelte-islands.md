---
paths:
  - "src/**/*.svelte"
  - "src/components/player/**"
  - "src/stores/**"
---

# Svelte islands & client state

- **Svelte 5 runes only** (`$state`, `$derived`, `$effect`, `$props`). No legacy `export let` / `$:` syntax.
- Islands are small and focused: Player, PlayButton, LineMap, Timeline (interaction layer), SyncedLyrics, Lightbox, ShareLine, NameOriginScene (История, if it needs state beyond GSAP).
  Do not grow an island into a page; static markup stays in `.astro`.
- Cross-island state uses **nanostores** (`src/components/player/store.ts` and `src/stores/*`), consumed in Svelte via `$store` auto-subscription.
  Persist only what must survive reloads (`@nanostores/persistent`): queue, current recording id, position, volume, sound-fx toggle, pinned theme.
- Never auto-start playback from restored state. Restoring = paused at the saved position.
- `$effect` must clean up (listeners, observers, GSAP contexts, rAF loops). Islands may be unmounted on navigation unless persisted.

## Player specifics
- Exactly one `HTMLAudioElement` per session, owned by `audio-engine.ts`. UI components never create their own `<audio>`.
- The engine exposes one interface regardless of backend (`file` | `soundcloud` | `link`): `load(recordingId)`, `play()`, `pause()`, `seek(s)`,
  events `progress`, `ended`, `error`. Backends are lazy-imported (the SoundCloud widget script loads only after the first play of a SoundCloud-backed recording).
- Integrate the Media Session API (metadata + action handlers).
- Audio focus: when a video starts, the engine pauses and remembers; it does not auto-resume.
- Errors (network, 404, blocked autoplay) produce a calm inline message and an external-link fallback — never a broken silent button.
- Keyboard shortcuts are registered once (in the persisted Player) and ignored when focus is in inputs/textarea/contenteditable.
- The player is a `region` with `aria-label`, controls are real `<button>`s with labels from `t()`, progress is an accessible slider.
