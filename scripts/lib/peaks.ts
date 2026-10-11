/**
 * Waveform peaks for the player (docs/architecture.md §6). Computed from decoded mono 16-bit PCM;
 * the client only fetches the JSON, it never decodes audio for a waveform.
 */

export type PeaksFile = {
  version: 1;
  /** Seconds. */
  duration: number;
  /** One value per bucket, 0–1, normalised to the loudest bucket. */
  peaks: number[];
};

/** Max absolute amplitude per bucket, normalised to 0–1 and rounded to 2 decimals. */
export function computePeaks(samples: Int16Array, buckets: number): number[] {
  if (buckets < 1) throw new Error('peaks: buckets must be ≥ 1');
  if (samples.length === 0) return Array.from({ length: buckets }, () => 0);
  const raw = new Array<number>(buckets).fill(0);
  const size = samples.length / buckets;
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor(b * size);
    const to = Math.max(from + 1, Math.floor((b + 1) * size));
    let max = 0;
    for (let i = from; i < to && i < samples.length; i++) {
      const v = Math.abs(samples[i] ?? 0);
      if (v > max) max = v;
    }
    raw[b] = max;
  }
  const loudest = Math.max(...raw);
  return raw.map((v) => (loudest === 0 ? 0 : Math.round((v / loudest) * 100) / 100));
}

/** Little-endian s16 PCM bytes (ffmpeg `-f s16le`) → samples. */
export function pcmToSamples(pcm: Buffer): Int16Array {
  const samples = new Int16Array(Math.floor(pcm.length / 2));
  for (let i = 0; i < samples.length; i++) samples[i] = pcm.readInt16LE(i * 2);
  return samples;
}
