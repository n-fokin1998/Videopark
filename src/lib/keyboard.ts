/**
 * Global keyboard shortcuts (.claude/rules/accessibility.md): `M` line map, `Space` play/pause, `N`/`P` next/previous,
 * `←`/`→` seek in the expanded player. Shortcuts never fire while typing, and never steal keys from the focused control.
 * Keys are matched by physical `KeyboardEvent.code`, so they also work on the Russian/Ukrainian layout («ь» sits on `KeyM`).
 */

export type Shortcut = 'line-map' | 'play-pause' | 'next' | 'previous' | 'seek-back' | 'seek-forward';

/** Minimal shape of the event target we inspect — keeps this module testable without a DOM. */
export type ShortcutTarget = {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
} | null;

export type ShortcutEvent = {
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  repeat: boolean;
  defaultPrevented: boolean;
  target: ShortcutTarget;
};

const typingTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Elements that already use Space/arrows themselves. */
const interactiveTags = new Set(['BUTTON', 'A', 'SUMMARY', 'AUDIO', 'VIDEO', 'IFRAME', 'DETAILS']);
const interactiveRoles = new Set([
  'button',
  'link',
  'slider',
  'checkbox',
  'radio',
  'switch',
  'menuitem',
  'tab',
  'option',
]);

export function isTypingTarget(target: ShortcutTarget): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  return typingTags.has((target.tagName ?? '').toUpperCase());
}

function isInteractiveTarget(target: ShortcutTarget): boolean {
  if (!target) return false;
  if (interactiveTags.has((target.tagName ?? '').toUpperCase())) return true;
  const role = target.getAttribute?.('role');
  return role ? interactiveRoles.has(role) : false;
}

/** Which shortcut (if any) this keydown means. `seek` shortcuts only exist while the expanded player is open. */
export function shortcutFor(event: ShortcutEvent, { seekEnabled = false } = {}): Shortcut | undefined {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return undefined;
  if (isTypingTarget(event.target)) return undefined;
  switch (event.code) {
    case 'KeyM':
      return event.shiftKey || event.repeat ? undefined : 'line-map';
    case 'KeyN':
      return event.shiftKey || event.repeat ? undefined : 'next';
    case 'KeyP':
      return event.shiftKey || event.repeat ? undefined : 'previous';
    case 'Space':
      return event.repeat || isInteractiveTarget(event.target) ? undefined : 'play-pause';
    case 'ArrowLeft':
      return seekEnabled && !isInteractiveTarget(event.target) ? 'seek-back' : undefined;
    case 'ArrowRight':
      return seekEnabled && !isInteractiveTarget(event.target) ? 'seek-forward' : undefined;
    default:
      return undefined;
  }
}
