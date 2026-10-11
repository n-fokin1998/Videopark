import { defaultLocale, type Locale } from './config';
import { ru, type Dictionary } from './ui/ru';

/** Dot-separated paths to every string leaf of the dictionary, e.g. `station.music.name`. */
export type TranslationKey = Leaves<Dictionary>;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationParams = Record<string, string | number>;

const dictionaries: Record<Locale, Dictionary | undefined> = {
  ru,
  uk: undefined,
  en: undefined,
};

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Translate `key` for `locale`, falling back to the default locale. Throws on an unknown key (build-time safety). */
export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const value = lookup(dictionaries[locale] ?? ru, key) ?? lookup(dictionaries[defaultLocale] ?? ru, key);
  if (value === undefined) throw new Error(`i18n: missing key "${key}" for locale "${locale}"`);
  return interpolate(value, params);
}

export function useTranslations(locale: Locale = defaultLocale) {
  return (key: TranslationKey, params?: TranslationParams): string => translate(locale, key, params);
}

/** Default-locale shortcut for code that has no locale context yet. Prefer `useTranslations(Astro.currentLocale)`. */
export const t = useTranslations(defaultLocale);

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Pick the plural form for `n` (ru/uk: one / few / many / other). Never concatenate numbers with nouns by hand. */
export function plural(locale: Locale, n: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(locale).select(n);
  return forms[rule] ?? forms.other;
}
