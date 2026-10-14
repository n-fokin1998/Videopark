/**
 * The custom line-icon set (docs/design.md §10): 24×24, 1.5px stroke, `currentColor`. Shared by `Icon.astro`
 * and `Icon.svelte`. Each icon is a list of SVG path `d` strings; `filled` icons are drawn with fill instead of stroke.
 */
export type IconDef = { paths: readonly string[]; filled?: boolean };

export const icons = {
  play: { paths: ['M8 5.5v13l10.5-6.5z'], filled: true },
  pause: { paths: ['M7.5 5.5h3v13h-3z', 'M13.5 5.5h3v13h-3z'], filled: true },
  next: { paths: ['M6 6l8.5 6L6 18z', 'M17.5 6v12'] },
  previous: { paths: ['M18 6L9.5 12l8.5 6z', 'M6.5 6v12'] },
  queue: { paths: ['M4 7h12', 'M4 12h12', 'M4 17h8', 'M17 15v5l3.5-2.5z'] },
  expand: { paths: ['M6 14.5l6-6 6 6'] },
  collapse: { paths: ['M6 9.5l6 6 6-6'] },
  close: { paths: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'] },
  // A line with three stations and a transfer branch.
  map: {
    paths: [
      'M7.75 9h2.5',
      'M13.75 9h2.5',
      'M3 9h2.25',
      'M18.75 9H21',
      'M5.25 9a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0',
      'M10.75 9a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0',
      'M16.25 9a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0-2.5 0',
      'M12 10.5V16a2 2 0 0 0 2 2h4',
    ],
  },
  soundOn: { paths: ['M4.5 9.5h3l4-3.5v12l-4-3.5h-3z', 'M15 9.5a3.5 3.5 0 0 1 0 5', 'M17.5 7a7 7 0 0 1 0 10'] },
  soundOff: { paths: ['M4.5 9.5h3l4-3.5v12l-4-3.5h-3z', 'M15.5 9.5l5 5', 'M20.5 9.5l-5 5'] },
  external: { paths: ['M13.5 5.5h5v5', 'M18.5 5.5l-8 8', 'M16.5 13.5v5h-11v-11h5'] },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;
