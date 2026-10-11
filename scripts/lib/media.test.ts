import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { inspectMetadata, stripMetadata } from './exif';
import { computePeaks, pcmToSamples } from './peaks';

function segment(marker: number, payload: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt16BE(0xff00 | marker, 0);
  head.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([head, payload]);
}

/** Minimal big-endian TIFF with IFD0 entries [tag, value]. */
function tiff(entries: [number, number][]): Buffer {
  const buf = Buffer.alloc(8 + 2 + entries.length * 12 + 4);
  buf.write('MM', 0, 'latin1');
  buf.writeUInt16BE(42, 2);
  buf.writeUInt32BE(8, 4);
  buf.writeUInt16BE(entries.length, 8);
  entries.forEach(([tag, value], i) => {
    const o = 10 + i * 12;
    buf.writeUInt16BE(tag, o);
    buf.writeUInt16BE(3, o + 2);
    buf.writeUInt32BE(1, o + 4);
    buf.writeUInt16BE(value, o + 8);
  });
  return buf;
}

function jpeg(...segments: Buffer[]): Buffer {
  const scan = Buffer.from([0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), ...segments, scan]);
}

const jfif = segment(0xe0, Buffer.from('JFIF\0\x01\x01', 'latin1'));
const icc = segment(0xe2, Buffer.from('ICC_PROFILE\0data', 'latin1'));
const exif = (entries: [number, number][]) =>
  segment(0xe1, Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff(entries)]));

describe('exif', () => {
  it('detects EXIF, GPS and orientation', () => {
    const report = inspectMetadata(
      jpeg(
        jfif,
        exif([
          [0x0112, 1],
          [0x8825, 0],
        ]),
      ),
    );
    expect(report).toEqual({ format: 'jpeg', exif: true, gps: true, other: false, orientation: 1 });
  });

  it('strips EXIF but keeps JFIF, the ICC profile and the image data', () => {
    const original = jpeg(jfif, exif([[0x8825, 0]]), icc);
    const stripped = stripMetadata(original);
    expect(stripped).toEqual(jpeg(jfif, icc));
    expect(inspectMetadata(stripped).exif).toBe(false);
  });

  it('refuses to strip a rotated image', () => {
    expect(() => stripMetadata(jpeg(exif([[0x0112, 6]])))).toThrow(/orientation 6/);
  });

  it('leaves files without metadata untouched', () => {
    const clean = jpeg(jfif);
    expect(stripMetadata(clean)).toEqual(clean);
  });

  it('reads a real photo from the archive without throwing', () => {
    const file = 'content/photos/covers/Вне времени.jpg';
    expect(inspectMetadata(readFileSync(file)).format).toBe('jpeg');
  });
});

describe('peaks', () => {
  it('normalises the max amplitude per bucket', () => {
    const samples = Int16Array.from([0, 100, -200, 50, 400, -400, 10, 20]);
    expect(computePeaks(samples, 4)).toEqual([0.25, 0.5, 1, 0.05]);
  });

  it('handles silence and empty input', () => {
    expect(computePeaks(new Int16Array(10), 2)).toEqual([0, 0]);
    expect(computePeaks(new Int16Array(0), 3)).toEqual([0, 0, 0]);
  });

  it('decodes little-endian PCM', () => {
    const pcm = Buffer.alloc(4);
    pcm.writeInt16LE(-2, 0);
    pcm.writeInt16LE(300, 2);
    expect([...pcmToSamples(pcm)]).toEqual([-2, 300]);
  });
});
