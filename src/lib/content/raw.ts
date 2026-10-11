/**
 * Reads `content/` straight from disk and validates it with the shared schemas, with references as plain id strings
 * and images as paths relative to the entry file. Used by the relations graph, unit tests and
 * `scripts/validate-content.ts` — code that runs outside Astro's content layer. Server/build-time only (node:fs).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { collectionNames, defineSchemas, type CollectionName } from './schemas';

const rawSchemas = defineSchemas(
  () => z.string().min(1),
  () => z.string().min(1),
);

type RawSchemas = typeof rawSchemas;

export type RawData<C extends CollectionName> = z.output<RawSchemas[C]>;

export type RawEntry<C extends CollectionName> = {
  id: string;
  data: RawData<C>;
  /** Markdown/plain-text body for `.md` entries (CRLF normalised to LF). */
  body?: string;
  /** Project-relative path with forward slashes. */
  filePath: string;
};

export type RawContent = { [C in CollectionName]: RawEntry<C>[] };

export type ContentIssue = { collection: CollectionName; id: string; filePath: string; message: string };

type Layout = { dir: string; kind: 'md' | 'yaml' | 'albums' | 'yaml-list' | 'yaml-file' };

const layout: Record<CollectionName, Layout> = {
  releases: { dir: 'releases', kind: 'md' },
  songs: { dir: 'songs', kind: 'md' },
  recordings: { dir: 'recordings', kind: 'yaml' },
  eras: { dir: 'eras', kind: 'md' },
  timeline: { dir: 'timeline', kind: 'yaml-list' },
  writings: { dir: 'writings', kind: 'md' },
  people: { dir: 'people', kind: 'yaml' },
  places: { dir: 'places', kind: 'yaml' },
  quotes: { dir: 'quotes', kind: 'yaml' },
  photos: { dir: 'photos', kind: 'albums' },
  videos: { dir: 'videos', kind: 'yaml' },
  instagram: { dir: 'instagram/posts.yaml', kind: 'yaml-file' },
  pages: { dir: 'pages', kind: 'md' },
  interviews: { dir: 'interviews', kind: 'md' },
};

const frontmatter = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

type Unparsed = { id: string; data: unknown; body?: string; filePath: string };

function readText(path: string): string {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function listFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort();
}

function readUnparsed(root: string, { dir, kind }: Layout): Unparsed[] {
  const base = join(root, 'content', dir);
  const rel = (p: string) => relative(root, p).replaceAll('\\', '/');
  switch (kind) {
    case 'md':
      return listFiles(base, '.md').map((name) => {
        const path = join(base, name);
        const match = frontmatter.exec(readText(path));
        if (!match) throw new Error(`content: ${rel(path)} has no frontmatter`);
        return { id: name.replace(/\.md$/, ''), data: parse(match[1] ?? ''), body: match[2] ?? '', filePath: rel(path) };
      });
    case 'yaml':
      return listFiles(base, '.yaml').map((name) => {
        const path = join(base, name);
        return { id: name.replace(/\.yaml$/, ''), data: parse(readText(path)), filePath: rel(path) };
      });
    case 'albums':
      if (!existsSync(base)) return [];
      return readdirSync(base, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(base, d.name, 'album.yaml')))
        .map((d) => d.name)
        .sort()
        .map((name) => {
          const path = join(base, name, 'album.yaml');
          return { id: name, data: parse(readText(path)), filePath: rel(path) };
        });
    case 'yaml-list':
      return listFiles(base, '.yaml').flatMap((name) => {
        const path = join(base, name);
        const items: unknown = parse(readText(path));
        if (!Array.isArray(items)) throw new Error(`content: ${rel(path)} must contain a YAML list`);
        return items.map((item: unknown) => ({ id: idOf(item, rel(path)), data: item, filePath: rel(path) }));
      });
    case 'yaml-file': {
      if (!existsSync(base)) return [];
      const items: unknown = parse(readText(base));
      if (!Array.isArray(items)) throw new Error(`content: ${rel(base)} must contain a YAML list`);
      return items.map((item: unknown) => ({ id: idOf(item, rel(base)), data: item, filePath: rel(base) }));
    }
    default: {
      const never: never = kind;
      throw new Error(`content: unknown layout ${String(never)}`);
    }
  }
}

function idOf(item: unknown, file: string): string {
  if (typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string') return item.id;
  throw new Error(`content: an item in ${file} has no string \`id\``);
}

function readCollection<C extends CollectionName>(root: string, name: C, issues: ContentIssue[]): RawEntry<C>[] {
  const schema = rawSchemas[name];
  const entries: RawEntry<C>[] = [];
  const seen = new Set<string>();
  for (const item of readUnparsed(root, layout[name])) {
    if (seen.has(item.id)) {
      issues.push({ collection: name, id: item.id, filePath: item.filePath, message: 'duplicate id' });
      continue;
    }
    seen.add(item.id);
    const result = schema.safeParse(item.data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({
          collection: name,
          id: item.id,
          filePath: item.filePath,
          message: `${issue.path.join('.') || '(root)'}: ${issue.message}`,
        });
      }
      continue;
    }
    entries.push({ id: item.id, data: result.data as RawData<C>, filePath: item.filePath, ...(item.body !== undefined && { body: item.body }) });
  }
  return entries;
}

/** Read and validate every collection. Invalid entries are left out and reported in `issues`. */
export function readContent(root: string = process.cwd()): { content: RawContent; issues: ContentIssue[] } {
  const issues: ContentIssue[] = [];
  const content = Object.fromEntries(collectionNames.map((name) => [name, readCollection(root, name, issues)])) as RawContent;
  return { content, issues };
}

/** Read every collection and throw on the first schema problem (tests, build-time pages). */
export function loadContent(root: string = process.cwd()): RawContent {
  const { content, issues } = readContent(root);
  if (issues.length > 0) {
    const list = issues.map((i) => `  ${i.filePath} [${i.collection}/${i.id}] ${i.message}`).join('\n');
    throw new Error(`content: ${issues.length} invalid entr${issues.length === 1 ? 'y' : 'ies'}\n${list}`);
  }
  return content;
}
