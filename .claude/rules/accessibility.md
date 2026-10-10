---
paths:
  - "src/**/*.astro"
  - "src/**/*.svelte"
  - "src/styles/**"
  - "tests/**"
---

# Accessibility rules (WCAG 2.2 AA minimum)

- Semantic HTML first: landmarks (`header`, `nav`, `main`, `footer`), one `<h1>` per page (the station/entity name), ordered headings,
  `<button>` for actions, `<a href>` for navigation. No clickable `<div>`s.
- Skip links: «К содержанию», «К плееру». After a ClientRouter navigation, move focus to the new `<h1>` and announce the station name in
  the polite live region from `BaseLayout`.
- Keyboard: every feature works without a mouse — line map (`M` / `Esc`), timeline (arrow keys, Home/End), lightbox (arrows, Esc, focus trap
  and focus return), player (Space, N/P, ←/→ in expanded player). Shortcuts never fire inside text inputs. Document shortcuts in «Схема».
- Overlays/dialogs: native `<dialog>` or proper `role="dialog"` + `aria-modal`, focus trap, `inert` background, restore focus on close.
- Contrast ≥ 4.5:1 body text, ≥ 3:1 large text and UI components/focus indicators — in **every** theme (dawn/day/evening/night).
- Never convey meaning by colour alone (timeline rails labelled «записано» / «вышло»; certainty markers have text/tooltip).
- Media: `alt` on all content images (decorative → `alt=""` + `aria-hidden`); captions (VTT) for video with speech/lyrics; transcripts for the interview audio if any.
  Lyrics are real text, never images.
- Motion: honour `prefers-reduced-motion`; nothing flashes more than 3 times per second; autoplaying motion > 5 s has a pause control.
- Sound: no autoplay; visible mute/sound toggle; player controls have accessible names and states (`aria-pressed`, slider values with text, e.g. «1:12 из 2:37»).
- Hit targets ≥ 44×44 px (24×24 absolute minimum per WCAG 2.2 with spacing).
- `lang` attributes correct for mixed-language content.
- Tests: every route gets a Playwright + axe check (zero violations at `serious`/`critical`). Manual VoiceOver + NVDA pass each milestone.
