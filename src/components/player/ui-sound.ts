/**
 * The only UI sound: a soft, very quiet click on play/pause (docs/design.md §9), synthesised with Web Audio — no asset
 * to download. Audible only when «Звук» is on; never repeats rapidly.
 */
import { $soundFx } from '~/stores/sound';

const MIN_INTERVAL_MS = 250;
let context: AudioContext | undefined;
let last = 0;

export function uiClick(): void {
  if (!$soundFx.get() || typeof window === 'undefined' || !('AudioContext' in window)) return;
  const now = performance.now();
  if (now - last < MIN_INTERVAL_MS) return;
  last = now;
  try {
    context ??= new AudioContext();
    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.04);
    // ≈ −30 dBFS peak, gone in 60 ms.
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.03, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain).connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch {
    /* a missing click is not worth an error */
  }
}
