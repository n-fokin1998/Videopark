import { describe, expect, it } from 'vitest';
import { isTypingTarget, shortcutFor, type ShortcutEvent, type ShortcutTarget } from './keyboard';

const el = (tagName: string, extra: Partial<NonNullable<ShortcutTarget>> = {}): ShortcutTarget => ({
  tagName,
  isContentEditable: false,
  getAttribute: () => null,
  ...extra,
});

const key = (code: string, extra: Partial<ShortcutEvent> = {}): ShortcutEvent => ({
  code,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  repeat: false,
  defaultPrevented: false,
  target: el('BODY'),
  ...extra,
});

describe('isTypingTarget', () => {
  it('detects fields and contenteditable', () => {
    expect(isTypingTarget(el('INPUT'))).toBe(true);
    expect(isTypingTarget(el('textarea'))).toBe(true);
    expect(isTypingTarget(el('DIV', { isContentEditable: true }))).toBe(true);
    expect(isTypingTarget(el('DIV'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('shortcutFor', () => {
  it('maps physical keys (layout-independent)', () => {
    expect(shortcutFor(key('KeyM'))).toBe('line-map');
    expect(shortcutFor(key('KeyN'))).toBe('next');
    expect(shortcutFor(key('KeyP'))).toBe('previous');
    expect(shortcutFor(key('Space'))).toBe('play-pause');
    expect(shortcutFor(key('KeyQ'))).toBeUndefined();
  });

  it('never fires while typing or with modifiers', () => {
    expect(shortcutFor(key('KeyM', { target: el('INPUT') }))).toBeUndefined();
    expect(shortcutFor(key('Space', { target: el('TEXTAREA') }))).toBeUndefined();
    expect(shortcutFor(key('KeyM', { ctrlKey: true }))).toBeUndefined();
    expect(shortcutFor(key('KeyN', { metaKey: true }))).toBeUndefined();
    expect(shortcutFor(key('KeyM', { defaultPrevented: true }))).toBeUndefined();
  });

  it('leaves Space to focused buttons and links', () => {
    expect(shortcutFor(key('Space', { target: el('BUTTON') }))).toBeUndefined();
    expect(shortcutFor(key('Space', { target: el('A') }))).toBeUndefined();
    expect(shortcutFor(key('Space', { target: el('DIV', { getAttribute: () => 'slider' }) }))).toBeUndefined();
  });

  it('seeks only in the expanded player', () => {
    expect(shortcutFor(key('ArrowRight'))).toBeUndefined();
    expect(shortcutFor(key('ArrowRight'), { seekEnabled: true })).toBe('seek-forward');
    expect(shortcutFor(key('ArrowLeft'), { seekEnabled: true })).toBe('seek-back');
    expect(shortcutFor(key('ArrowLeft', { target: el('INPUT') }), { seekEnabled: true })).toBeUndefined();
  });
});
