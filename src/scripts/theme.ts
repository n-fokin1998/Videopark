/**
 * Time-of-day theming on the client (docs/design.md §8). The inline pre-paint script in BaseLayout already chose the
 * theme before first paint; this keeps it right afterwards: when a theme is pinned in «Схема», at the next scheduled
 * boundary (17:00 → evening…), when the tab becomes visible again, or when the OS colour scheme changes.
 * Colours transition over --dur-slow (global.css).
 */
import { $themePreference } from '~/stores/theme';
import { msUntilNextBoundary, resolveTheme, type ColorScheme } from '~/lib/time-of-day';

const dark = window.matchMedia('(prefers-color-scheme: dark)');
const light = window.matchMedia('(prefers-color-scheme: light)');
let timer: number | undefined;

function scheme(): ColorScheme {
  return dark.matches ? 'dark' : light.matches ? 'light' : 'no-preference';
}

function apply(): void {
  const now = new Date();
  const theme = resolveTheme($themePreference.get(), now.getHours(), scheme());
  if (document.documentElement.dataset.theme !== theme) document.documentElement.dataset.theme = theme;
  window.clearTimeout(timer);
  if ($themePreference.get() === 'auto') timer = window.setTimeout(apply, msUntilNextBoundary(now));
}

$themePreference.listen(apply);
dark.addEventListener('change', apply);
light.addEventListener('change', apply);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') apply();
});
apply();
