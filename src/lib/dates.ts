/**
 * Partial dates: `"2017"`, `"2017-03"`, `"2017-03-01"` (docs/content-model.md §2).
 * The only place that turns them into numbers or text — never call `new Date("2017")` on content dates.
 */
import type { Locale } from '~/i18n/config';

export type PartialDate = string;

export type Precision = 'year' | 'month' | 'day';

export type ParsedPartialDate = {
  year: number;
  month?: number;
  day?: number;
  precision: Precision;
};

const pattern = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parse a partial date; returns `undefined` for malformed or impossible dates (e.g. `2019-02-30`). */
export function tryParsePartialDate(value: string): ParsedPartialDate | undefined {
  const match = pattern.exec(value);
  if (!match?.[1]) return undefined;
  const year = Number(match[1]);
  if (match[2] === undefined) return { year, precision: 'year' };
  const month = Number(match[2]);
  if (month < 1 || month > 12) return undefined;
  if (match[3] === undefined) return { year, month, precision: 'month' };
  const day = Number(match[3]);
  if (day < 1 || day > daysInMonth(year, month)) return undefined;
  return { year, month, day, precision: 'day' };
}

export function isPartialDate(value: string): boolean {
  return tryParsePartialDate(value) !== undefined;
}

export function parsePartialDate(value: string): ParsedPartialDate {
  const parsed = tryParsePartialDate(value);
  if (!parsed) throw new Error(`dates: invalid partial date "${value}"`);
  return parsed;
}

export function yearOf(value: PartialDate): number {
  return parsePartialDate(value).year;
}

/** `YYYY-MM-DD` with `00` for unknown parts, so a less precise date sorts before more precise dates in the same period. */
export function sortKey(value: PartialDate): string {
  const { year, month = 0, day = 0 } = parsePartialDate(value);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function comparePartialDates(a: PartialDate, b: PartialDate): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}

const intlLocale: Record<Locale, string> = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-GB' };

/** Human-readable date at its own precision: «2017», «март 2017», «2 августа 2020». */
export function formatPartialDate(value: PartialDate, locale: Locale): string {
  const { year, month, day, precision } = parsePartialDate(value);
  if (precision === 'year') return String(year);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  const options: Intl.DateTimeFormatOptions =
    precision === 'month'
      ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  // ru/uk append a year abbreviation («2017 г.», «2017 р.») — the archive's typography omits it.
  return new Intl.DateTimeFormat(intlLocale[locale], options).format(date).replace(/\s*(г\.|р\.)$/u, '');
}
