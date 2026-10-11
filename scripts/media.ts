/**
 * Media pipeline (`pnpm media`, needs ffmpeg/ffprobe on PATH) — docs/architecture.md §6, decision D-021.
 *
 *   audio   FLAC masters (content/tracks/) → public/media/audio/<recording-id>.m4a (AAC 160k, no tags)
 *           + <recording-id>.peaks.json (waveform)
 *   video   local clips (content/videos/, Instagram videos) → public/media/video|instagram/<name>.mp4 (remuxed, faststart,
 *           no metadata) + .jpg poster frame
 *   images  report EXIF/GPS/XMP/IPTC in content/photos and content/instagram/media; `--strip-exif` removes it in place (lossless)
 *
 * Idempotent: outputs newer than their source are skipped (`--force` rebuilds). Steps: `--only=audio,video,images`.
 * Outputs are git-ignored; never runs during `astro build`.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { loadContent } from '../src/lib/content/raw';
import { inspectMetadata, stripMetadata } from './lib/exif';
import { computePeaks, pcmToSamples, type PeaksFile } from './lib/peaks';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : undefined;
const runs = (step: string) => !only || only.has(step);

const PEAK_BUCKETS = 800;
const PEAK_SAMPLE_RATE = 4000;
const out = join(root, 'public', 'media');
const rel = (p: string) => relative(root, p).replaceAll('\\', '/');

function run(cmd: string, argv: string[], { capture = false } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, { stdio: ['ignore', capture ? 'pipe' : 'ignore', 'pipe'] });
    const chunks: Buffer[] = [];
    let stderr = '';
    child.stdout?.on('data', (c: Buffer) => chunks.push(c));
    child.stderr?.on('data', (c: Buffer) => (stderr += c.toString()));
    child.on('error', (e) => reject(new Error(`${cmd}: ${e.message} — is ffmpeg installed and on PATH?`)));
    child.on('close', (code) =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error(`${cmd} exited ${code}: ${stderr.trim().split('\n').at(-1)}`)),
    );
  });
}

function fresh(output: string, source: string): boolean {
  return !force && existsSync(output) && statSync(output).mtimeMs >= statSync(source).mtimeMs;
}

async function pool<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  size = Math.max(1, Math.floor(availableParallelism() / 2)),
) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item);
    }),
  );
}

async function duration(file: string): Promise<number> {
  const text = (
    await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { capture: true })
  ).toString();
  return Number(text.trim());
}

async function audio(stats: Record<string, number>) {
  const content = loadContent(root);
  const tracks = join(root, 'content', 'tracks');
  if (!existsSync(tracks)) {
    console.log('audio: content/tracks/ not present — skipped (masters are kept by the owner, D-021)');
    return;
  }
  const dir = join(out, 'audio');
  mkdirSync(dir, { recursive: true });
  const jobs = content.recordings.flatMap((r) =>
    r.data.audio.file ? [{ id: r.id, master: join(tracks, r.data.audio.file) }] : [],
  );
  await pool(jobs, async ({ id, master }) => {
    if (!existsSync(master)) {
      console.warn(`audio: ${id} — master missing: ${rel(master)}`);
      stats.missing = (stats.missing ?? 0) + 1;
      return;
    }
    const m4a = join(dir, `${id}.m4a`);
    const peaks = join(dir, `${id}.peaks.json`);
    if (fresh(m4a, master) && fresh(peaks, master)) {
      stats.skipped = (stats.skipped ?? 0) + 1;
      return;
    }
    await run('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-i',
      master,
      '-map',
      '0:a',
      '-map_metadata',
      '-1',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-movflags',
      '+faststart',
      m4a,
    ]);
    const pcm = await run(
      'ffmpeg',
      ['-v', 'error', '-i', master, '-ac', '1', '-ar', String(PEAK_SAMPLE_RATE), '-f', 's16le', '-'],
      { capture: true },
    );
    const file: PeaksFile = {
      version: 1,
      duration: Math.round((await duration(master)) * 100) / 100,
      peaks: computePeaks(pcmToSamples(pcm), PEAK_BUCKETS),
    };
    writeFileSync(peaks, JSON.stringify(file));
    stats.encoded = (stats.encoded ?? 0) + 1;
    console.log(`audio: ${id}`);
  });
}

async function videoFile(source: string, target: string, stats: Record<string, number>) {
  if (!existsSync(source)) {
    console.warn(`video: master missing: ${rel(source)}`);
    stats.missing = (stats.missing ?? 0) + 1;
    return;
  }
  const poster = target.replace(/\.mp4$/, '.jpg');
  if (fresh(target, source) && fresh(poster, source)) {
    stats.skipped = (stats.skipped ?? 0) + 1;
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  await run('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-i',
    source,
    '-map',
    '0',
    '-map_metadata',
    '-1',
    '-c',
    'copy',
    '-movflags',
    '+faststart',
    target,
  ]);
  const at = Math.min(1, (await duration(source)) / 2);
  await run('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-ss',
    String(at),
    '-i',
    source,
    '-frames:v',
    '1',
    '-map_metadata',
    '-1',
    '-q:v',
    '3',
    poster,
  ]);
  stats.encoded = (stats.encoded ?? 0) + 1;
  console.log(`video: ${rel(target)}`);
}

async function video(stats: Record<string, number>) {
  const content = loadContent(root);
  for (const v of content.videos) {
    if (v.data.file)
      await videoFile(join(root, 'content', 'videos', v.data.file), join(out, 'video', `${v.id}.mp4`), stats);
  }
  for (const post of content.instagram) {
    for (const m of post.data.media) {
      if (m.type !== 'video') continue;
      const source = join(root, dirname(post.filePath), m.file);
      await videoFile(source, join(out, 'instagram', basename(m.file)), stats);
    }
  }
}

function images(stats: Record<string, number>) {
  const strip = args.has('--strip-exif');
  const walk = (d: string): string[] =>
    existsSync(d)
      ? readdirSync(d, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
        )
      : [];
  const files = [...walk(join(root, 'content', 'photos')), ...walk(join(root, 'content', 'instagram', 'media'))].filter(
    (f) => /\.(jpe?g|png)$/i.test(f),
  );
  for (const file of files) {
    const buf = readFileSync(file);
    const report = inspectMetadata(buf);
    if (!report.exif && !report.other) continue;
    const what = [report.gps && 'GPS', report.exif && 'EXIF', report.other && 'XMP/IPTC/text']
      .filter(Boolean)
      .join(', ');
    if (!strip) {
      console.log(`images: ${rel(file)} has ${what}${report.gps ? ' ⚠' : ''}`);
      stats[report.gps ? 'gps' : 'metadata'] = (stats[report.gps ? 'gps' : 'metadata'] ?? 0) + 1;
      continue;
    }
    try {
      writeFileSync(file, stripMetadata(buf));
      stats.stripped = (stats.stripped ?? 0) + 1;
      console.log(`images: stripped ${what} from ${rel(file)}`);
    } catch (e) {
      console.warn(`images: ${rel(file)} — ${(e as Error).message}`);
      stats.failed = (stats.failed ?? 0) + 1;
    }
  }
  if (!strip && (stats.gps || stats.metadata))
    console.log('images: run `pnpm media --only=images --strip-exif` to remove it (lossless)');
}

async function main() {
  const report: Record<string, Record<string, number>> = {};
  if (runs('images')) images((report.images = {}));
  if (runs('video')) await video((report.video = {}));
  if (runs('audio')) await audio((report.audio = {}));
  for (const [step, stats] of Object.entries(report)) {
    console.log(
      `${step}: ${
        Object.entries(stats)
          .map(([k, v]) => `${v} ${k}`)
          .join(', ') || 'nothing to do'
      }`,
    );
  }
  if (report.images?.gps || report.images?.failed) process.exitCode = 1;
}

await main();
