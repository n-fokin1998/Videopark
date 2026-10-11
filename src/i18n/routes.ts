import { defaultLocale, isLocale, type Locale } from './config';

/** Normalise a pathname: leading slash, no trailing slash (except root), no `.html` suffix. */
export function normalizePath(pathname: string): string {
  let path = pathname.split(/[?#]/)[0] ?? '/';
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path === '' ? '/' : path;
}

/** Build a link for `path` in `locale`: `/music` (ru), `/uk/music`, `/en/music`. */
export function localizedPath(path: string, locale: Locale = defaultLocale): string {
  const normalized = normalizePath(path);
  if (locale === defaultLocale) return normalized;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

/** Split a pathname into its locale and the locale-independent path. */
export function parseLocalizedPath(pathname: string): { locale: Locale; path: string } {
  const normalized = normalizePath(pathname);
  const [, first = '', ...rest] = normalized.split('/');
  if (first !== defaultLocale && isLocale(first)) {
    return { locale: first, path: rest.length ? `/${rest.join('/')}` : '/' };
  }
  return { locale: defaultLocale, path: normalized };
}
