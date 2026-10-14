import { persistentAtom } from '@nanostores/persistent';

/**
 * «Звук» (docs/design.md §9): quiet ambient/UI sounds. Off by default, persisted, switched on only by the visitor.
 * Music is separate — it plays only after pressing play.
 */
export const $soundFx = persistentAtom<boolean>('vp:sound', false, {
  encode: (value) => (value ? 'on' : 'off'),
  decode: (raw) => raw === 'on',
});

export function setSoundFx(on: boolean): void {
  $soundFx.set(on);
}
