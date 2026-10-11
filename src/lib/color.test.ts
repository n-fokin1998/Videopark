import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex } from './color';
import { themes } from './themes';

describe('color helpers', () => {
  it('parses short and long hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex('171E2A')).toEqual({ r: 23, g: 30, b: 42 });
    expect(() => parseHex('red')).toThrow();
  });

  it('computes WCAG contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});

/** Token sheet check (docs/design.md §12.2): every theme meets AA for its semantic pairs. */
const read = (file: string) => readFileSync(fileURLToPath(new URL(`../styles/${file}`, import.meta.url)), 'utf8');

function declarations(block: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (name && value) map.set(name, value.trim());
  }
  return map;
}

const palette = declarations(read('tokens.css'));
const themeCss = read('themes.css');

function themeTokens(theme: string): Map<string, string> {
  const block = new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`).exec(themeCss)?.[1];
  if (!block) throw new Error(`themes.css: no block for ${theme}`);
  return declarations(block);
}

function resolve(tokens: Map<string, string>, name: string): string {
  let value = tokens.get(name) ?? palette.get(name);
  for (let depth = 0; value?.startsWith('var(') && depth < 5; depth++) {
    const ref = /var\((--[\w-]+)\)/.exec(value)?.[1] ?? '';
    value = tokens.get(ref) ?? palette.get(ref);
  }
  if (!value) throw new Error(`token ${name} is not defined`);
  return value;
}

const pairs: [fg: string, bg: string, min: number][] = [
  ['--fg', '--bg', 4.5],
  ['--fg', '--bg-raised', 4.5],
  ['--fg-muted', '--bg', 4.5],
  ['--fg-muted', '--bg-raised', 4.5],
  ['--link', '--bg', 4.5],
  ['--link', '--bg-raised', 4.5],
  ['--accent', '--bg', 3],
  ['--line', '--bg', 3],
  ['--line', '--bg-raised', 3],
  ['--focus', '--bg', 3],
  ['--focus', '--bg-raised', 3],
  ['--on-paper', '--paper', 4.5],
];

describe.each(themes)('theme %s', (theme) => {
  const tokens = themeTokens(theme);
  it.each(pairs)('%s on %s ≥ %d:1', (fg, bg, min) => {
    expect(contrastRatio(resolve(tokens, fg), resolve(tokens, bg))).toBeGreaterThanOrEqual(min);
  });
});
