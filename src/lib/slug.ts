/**
 * Stable Latin slugs for content ids (docs/content-model.md §5).
 * «Плавится лёд» → `plavitsya-lyod`, «33 шага / 37 минут» → `33-shaga-37-minut`.
 * Slugs are permanent once published: changing these rules changes ids, so extend the table, never rewrite it.
 */

// prettier-ignore
const table: Readonly<Record<string, string>> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // Ukrainian letters
  і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
  // Latin letters without a Unicode decomposition (names of poets and labels)
  ł: 'l', ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss',
};

/** Transliterate Cyrillic to Latin (lowercase), leaving other characters untouched. */
export function transliterate(text: string): string {
  let out = '';
  for (const char of text.toLowerCase()) out += table[char] ?? char;
  return out;
}

/** Lowercase, hyphenated, ASCII-only slug. Throws on input that produces an empty slug. */
export function slugify(text: string): string {
  const slug = transliterate(text.normalize('NFC'))
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error(`slug: cannot slugify "${text}"`);
  return slug;
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSlug(value: string): boolean {
  return slugPattern.test(value);
}
