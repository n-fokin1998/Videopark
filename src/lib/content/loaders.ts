/**
 * Content Layer loaders that Astro does not ship.
 * `yamlListLoader` reads every `*.yaml` file in a directory, each holding a list of entries with unique `id`s
 * (`content/timeline/<year>.yaml`). Build-time only.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Loader, LoaderContext } from 'astro/loaders';
import { parse } from 'yaml';

async function loadDirectory(dir: string, { store, parseData, generateDigest, collection }: LoaderContext) {
  store.clear();
  const files = (await readdir(dir)).filter((f) => f.endsWith('.yaml')).sort();
  for (const name of files) {
    const filePath = join(dir, name);
    const items: unknown = parse(await readFile(filePath, 'utf8'));
    if (!Array.isArray(items)) throw new Error(`${collection}: ${name} must contain a YAML list`);
    for (const [index, item] of items.entries()) {
      if (typeof item !== 'object' || item === null || typeof (item as { id?: unknown }).id !== 'string') {
        throw new Error(`${collection}: ${name} item #${index + 1} has no string \`id\``);
      }
      const raw = item as Record<string, unknown> & { id: string };
      if (store.has(raw.id)) throw new Error(`${collection}: duplicate id "${raw.id}" in ${name}`);
      const data = await parseData({ id: raw.id, data: raw, filePath });
      store.set({ id: raw.id, data, digest: generateDigest(raw), filePath });
    }
  }
}

/** @param directory relative to the project root, e.g. `content/timeline` */
export function yamlListLoader(directory: string): Loader {
  return {
    name: 'yaml-list-loader',
    load: async (context) => {
      const dir = resolve(fileURLToPath(context.config.root), directory);
      await loadDirectory(dir, context);
      context.watcher?.add(dir);
      context.watcher?.on('all', (_event, changed) => {
        if (resolve(changed).startsWith(dir) && changed.endsWith('.yaml')) void loadDirectory(dir, context);
      });
    },
  };
}
