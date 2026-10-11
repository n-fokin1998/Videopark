import { describe, expect, it } from 'vitest';
import { isSlug, slugify, transliterate } from './slug';

describe('slugify', () => {
  it.each([
    ['Плавится лёд', 'plavitsya-lyod'],
    ['Вне времени', 'vne-vremeni'],
    ['33 шага / 37 минут', '33-shaga-37-minut'],
    ['Мой милый дом', 'moi-milyi-dom'],
    ['Ещё один день', 'eshchyo-odin-den'],
    ['Мальчик в метро', 'malchik-v-metro'],
    ['Дом как студия', 'dom-kak-studiya'],
    ['Музыка продолжается', 'muzyka-prodolzhaetsya'],
    ['Женя Мычак', 'zhenya-mychak'],
    ['RAW STUFF VOL. 5', 'raw-stuff-vol-5'],
    ['Какой-то там час (интро)', 'kakoi-to-tam-chas-intro'],
    ['Бровари, ґанок, їжак, є', 'brovari-ganok-yizhak-ye'],
    ['Rafał Wojaczek', 'rafal-wojaczek'],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('throws when nothing is left', () => {
    expect(() => slugify(' / ')).toThrow(/cannot slugify/);
  });
});

describe('transliterate', () => {
  it('keeps non-Cyrillic characters', () => {
    expect(transliterate('Гриптэйп 2019!')).toBe('gripteip 2019!');
  });
});

describe('isSlug', () => {
  it('accepts slugs and rejects everything else', () => {
    expect(isSlug('ty-ep-2020')).toBe(true);
    expect(isSlug('Ty')).toBe(false);
    expect(isSlug('ty--ep')).toBe(false);
    expect(isSlug('-ty')).toBe(false);
  });
});
