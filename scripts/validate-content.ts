/**
 * Content validation beyond the Zod schemas (docs/content-model.md §8, .claude/rules/testing.md):
 * broken references, missing media files, unreferenced media, credits, certainty report, TODO(content) markers and
 * known invariants. Usage: `pnpm validate:content` (exit code 1 on errors). Never runs during `astro build`.
 *
 * Masters (FLAC, MP4) are git-ignored (D-021): if `content/tracks/` is absent, audio checks are skipped with a notice.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { readContent, type RawContent } from '../src/lib/content/raw';
import { buildGraph, versionsOf } from '../src/lib/content/relations';
import { collectionNames } from '../src/lib/content/schemas';

export type Severity = 'error' | 'warning' | 'info';
export type Finding = { severity: Severity; check: string; message: string };

const posix = (p: string) => p.replaceAll('\\', '/');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  );
}

const mediaPattern = /\.(jpe?g|png|webp|avif|tiff?|gif|flac|wav|aiff?|mp3|m4a|mp4|mov|webm)$/i;

export function validateContent(root: string = process.cwd()): Finding[] {
  const findings: Finding[] = [];
  const add = (severity: Severity, check: string, message: string) => findings.push({ severity, check, message });
  const rel = (p: string) => posix(relative(root, p));

  const { content, issues } = readContent(root);
  for (const i of issues) add('error', 'schema', `${i.filePath} [${i.collection}/${i.id}] ${i.message}`);

  const graph = buildGraph(content);
  for (const b of graph.broken) add('error', 'references', `${b.from} → ${b.to} (${b.rel}) does not exist`);

  /** Absolute paths of every media file some entry points to. */
  const referenced = new Set<string>();
  const entryFile = (filePath: string, file: string) => join(root, dirname(filePath), file);
  const requireFile = (path: string, owner: string, check = 'media') => {
    referenced.add(path);
    if (!existsSync(path)) add('error', check, `${owner}: file not found — ${rel(path)}`);
  };

  // Images referenced relative to their entry file.
  for (const r of content.releases)
    if (r.data.cover) requireFile(entryFile(r.filePath, r.data.cover), `releases/${r.id} cover`);
  for (const e of content.eras)
    if (e.data.cover) requireFile(entryFile(e.filePath, e.data.cover), `eras/${e.id} cover`);
  for (const a of content.photos) {
    for (const p of a.data.photos) requireFile(entryFile(a.filePath, p.file), `photos/${a.id}`);
  }
  for (const v of content.videos)
    if (v.data.poster) requireFile(entryFile(v.filePath, v.data.poster), `videos/${v.id} poster`);

  // Git-ignored masters: only checked when present on this machine.
  const tracksDir = join(root, 'content', 'tracks');
  const haveMasters = existsSync(tracksDir);
  if (!haveMasters)
    add('info', 'audio', 'content/tracks/ is not present (masters are git-ignored) — audio file checks skipped');
  const audioOwners = new Map<string, string[]>();
  for (const r of content.recordings) {
    const file = r.data.audio.file;
    if (!file) continue;
    const path = join(tracksDir, file);
    audioOwners.set(path, [...(audioOwners.get(path) ?? []), r.id]);
    if (haveMasters) requireFile(path, `recordings/${r.id}`, 'audio');
    else referenced.add(path);
  }
  for (const [path, owners] of audioOwners) {
    if (owners.length > 1) add('error', 'audio', `${rel(path)} is used by several recordings: ${owners.join(', ')}`);
  }

  const videosDir = join(root, 'content', 'videos');
  for (const v of content.videos) {
    if (!v.data.file) continue;
    const path = join(videosDir, v.data.file);
    referenced.add(path);
    if (!existsSync(path))
      add('warning', 'video', `videos/${v.id}: local file not present (git-ignored master) — ${rel(path)}`);
  }
  for (const post of content.instagram) {
    for (const m of post.data.media) {
      const path = entryFile(post.filePath, m.file);
      if (m.type === 'image') requireFile(path, `instagram/${post.id}`);
      else {
        referenced.add(path);
        if (!existsSync(path))
          add('warning', 'video', `instagram/${post.id}: video not present (git-ignored master) — ${rel(path)}`);
      }
    }
  }

  // Lyrics and writings: raw owner files must be referenced; bodies must match their status.
  for (const s of content.songs) {
    const hasText = (s.body ?? '').trim().length > 0;
    if (s.data.lyricsFile) {
      requireFile(join(root, s.data.lyricsFile), `songs/${s.id} lyricsFile`, 'lyrics');
      const raw = existsSync(join(root, s.data.lyricsFile))
        ? readFileSync(join(root, s.data.lyricsFile), 'utf8').replace(/\r\n/g, '\n').trim()
        : undefined;
      if (raw !== undefined && raw !== (s.body ?? '').trim()) {
        add('error', 'lyrics', `songs/${s.id}: body differs from ${s.data.lyricsFile} (lyrics must be verbatim)`);
      }
    }
    if ((s.data.lyricsStatus === 'complete' || s.data.lyricsStatus === 'partial') && !hasText) {
      add('error', 'lyrics', `songs/${s.id}: lyricsStatus ${s.data.lyricsStatus} but no text`);
    }
    if ((s.data.lyricsStatus === 'missing' || s.data.lyricsStatus === 'instrumental') && hasText) {
      add('error', 'lyrics', `songs/${s.id}: lyricsStatus ${s.data.lyricsStatus} but the body has text`);
    }
  }
  for (const w of content.writings) {
    if (!(w.body ?? '').trim()) add('error', 'writings', `writings/${w.id}: empty text`);
    requireFile(join(root, w.data.source), `writings/${w.id} source`, 'writings');
  }

  // Unreferenced media and lyric files (owner uploads that no entry uses yet).
  const portraitsDir = join(root, 'content', 'photos', 'portraits');
  const featured = new Set(
    content.photos.flatMap((a) =>
      a.data.photos.filter((p) => p.featured).map((p) => posix(entryFile(a.filePath, p.file))),
    ),
  );
  const mediaFiles = [
    ...walk(join(root, 'content', 'photos')),
    ...walk(join(root, 'content', 'instagram', 'media')),
    ...walk(tracksDir),
    ...readdirSync(videosDir).map((f) => join(videosDir, f)),
  ].filter((p) => mediaPattern.test(p));
  const referencedPosix = new Set([...referenced].map(posix));
  const unusedList = join(root, 'content', 'unused-media.yaml');
  const knownUnused = new Map<string, string>(
    existsSync(unusedList)
      ? (parse(readFileSync(unusedList, 'utf8')) as { path: string; reason: string }[]).map((u) => [u.path, u.reason])
      : [],
  );
  for (const [path] of knownUnused) {
    if (existsSync(join(root, path)) && referencedPosix.has(posix(join(root, path)))) {
      add('warning', 'unreferenced', `${path} is listed in unused-media.yaml but is used by an entry`);
    }
  }
  for (const path of mediaFiles) {
    if (referencedPosix.has(posix(path))) continue;
    const known = knownUnused.get(rel(path));
    if (known) {
      add('info', 'unused-media', `${rel(path)}: ${known}`);
      continue;
    }
    if (posix(dirname(path)) === posix(portraitsDir)) {
      // portraits/ holds copies of year-folder photos; they must be marked `featured` there.
      const name = path.slice(portraitsDir.length + 1);
      const original = [...featured].find((f) => f.endsWith(`/${name}`));
      if (!original) add('warning', 'portraits', `${rel(path)}: no featured photo with this file name in a year album`);
      else if (statSync(original).size !== statSync(path).size)
        add('warning', 'portraits', `${rel(path)} differs from ${rel(original)}`);
      continue;
    }
    add('warning', 'unreferenced', `${rel(path)} is not used by any entry`);
  }
  const lyricFiles = new Set(content.songs.map((s) => s.data.lyricsFile).filter((f): f is string => f !== undefined));
  for (const path of walk(join(root, 'content', 'lyrics'))) {
    if (!lyricFiles.has(rel(path))) add('warning', 'unreferenced', `${rel(path)} is not used by any song`);
  }

  // Credits and sources.
  for (const r of content.releases) {
    if (r.data.cover && !r.data.credits.some((c) => c.role.includes('обложка'))) {
      add('info', 'credits', `releases/${r.id}: cover author unknown`);
    }
    if (r.data.sources.length === 0) add('warning', 'sources', `releases/${r.id}: no sources`);
  }
  for (const name of ['timeline', 'people', 'places', 'eras', 'pages', 'videos'] as const) {
    for (const e of content[name] as RawContent[typeof name]) {
      const sources = 'sources' in e.data ? e.data.sources : [];
      const needsSource = name !== 'places' || ('description' in e.data && e.data.description !== undefined);
      if (needsSource && sources.length === 0) add('warning', 'sources', `${name}/${e.id}: no sources`);
    }
  }

  // Pages: chapter list matches the `## ` headings.
  for (const p of content.pages) {
    if (p.data.sections.length === 0) continue;
    const headings = [...(p.body ?? '').matchAll(/^## (.+)$/gm)].map((m) => m[1]?.trim());
    const titles = p.data.sections.map((s) => s.title);
    if (JSON.stringify(headings) !== JSON.stringify(titles)) {
      add(
        'error',
        'pages',
        `pages/${p.id}: sections ${JSON.stringify(titles)} do not match headings ${JSON.stringify(headings)}`,
      );
    }
  }

  // Known invariants (.claude/rules/testing.md).
  const voda = versionsOf(graph, 'voda').flatMap((v) => v.releases.map((r) => r.id));
  if (!voda.includes('3-ep-2016') || !voda.includes('raw-stuff-vol-5')) {
    add('error', 'invariants', '«Вода» must have recordings on «3» and «RAW STUFF VOL. 5»');
  }
  if (content.releases.find((r) => r.id === 'moi-milyi-dom')?.data.tracklistKnown !== false) {
    add('error', 'invariants', '«Мой милый дом» must have tracklistKnown: false');
  }

  // Reports: hidden items, «Архив ищет», certainty, TODO(content).
  const allRights = [
    ...content.photos.flatMap((a) =>
      a.data.photos.map((p) => ({ owner: `photos/${a.id}/${p.file.replace(/^\.\//, '')}`, rights: p.rights })),
    ),
    ...content.instagram.map((p) => ({ owner: `instagram/${p.id}`, rights: p.data.rights })),
    ...content.videos.map((v) => ({ owner: `videos/${v.id}`, rights: v.data.rights })),
    ...content.recordings.map((r) => ({ owner: `recordings/${r.id}`, rights: r.data.audio.rights })),
  ];
  for (const { owner, rights } of allRights) {
    if (rights.status === 'hidden') add('info', 'hidden', `${owner} is hidden (not rendered)`);
  }
  for (const r of content.recordings) {
    if (!r.data.audio.file && !r.data.audio.soundcloud && !r.data.audio.bandcamp) {
      add('info', 'archive-is-looking', `recordings/${r.id}: no audio source`);
    }
  }
  const missingLyrics = content.songs.filter((s) => s.data.lyricsStatus === 'missing').length;
  add('info', 'archive-is-looking', `${missingLyrics} of ${content.songs.length} songs have no lyrics yet`);

  for (const name of collectionNames) {
    const entries = content[name] as { id: string; data: { certainty?: string } }[];
    const uncertain = entries.filter((e) => e.data.certainty && e.data.certainty !== 'confirmed');
    if (uncertain.length > 0) {
      add('info', 'certainty', `${name}: ${uncertain.map((e) => `${e.id} (${e.data.certainty})`).join(', ')}`);
    }
  }

  const todoCounts = new Map<string, number>();
  for (const path of walk(join(root, 'content')).filter(
    (p) => /\.(md|ya?ml)$/.test(p) && !p.includes('knowlage-base'),
  )) {
    const count = (readFileSync(path, 'utf8').match(/TODO\(content\)/g) ?? []).length;
    if (count > 0) todoCounts.set(rel(path), count);
  }
  if (todoCounts.size > 0) {
    const total = [...todoCounts.values()].reduce((a, b) => a + b, 0);
    add('info', 'todo', `${total} TODO(content) markers in ${todoCounts.size} files`);
  }

  return findings;
}

function main() {
  const verbose = process.argv.includes('--verbose');
  const findings = validateContent();
  const order: Severity[] = ['error', 'warning', 'info'];
  const icon: Record<Severity, string> = { error: '✖', warning: '▲', info: '·' };
  for (const severity of order) {
    const list = findings.filter((f) => f.severity === severity);
    if (list.length === 0) continue;
    const checks = new Map<string, Finding[]>();
    for (const f of list) checks.set(f.check, [...(checks.get(f.check) ?? []), f]);
    console.log(`\n${severity.toUpperCase()} (${list.length})`);
    for (const [check, items] of checks) {
      const shown = severity === 'info' && !verbose ? items.slice(0, 5) : items;
      console.log(`  ${check}`);
      for (const f of shown) console.log(`    ${icon[severity]} ${f.message}`);
      if (shown.length < items.length) console.log(`    … ${items.length - shown.length} more (--verbose)`);
    }
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  console.log(`\nvalidate-content: ${errors} error(s), ${warnings} warning(s)`);
  process.exitCode = errors > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
