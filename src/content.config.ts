/**
 * Content collections (docs/content-model.md). Schemas live in `src/lib/content/schemas.ts` so the relations graph,
 * unit tests and `scripts/validate-content.ts` validate against exactly the same contract.
 * Entry ids are file names (already stable Latin slugs) — no slugger rewriting.
 */
import { defineCollection, reference, type SchemaContext } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { defineSchemas, type CollectionName } from '~/lib/content/schemas';
import { yamlListLoader } from '~/lib/content/loaders';

const fileId = ({ entry }: { entry: string }) => entry.replace(/\.(md|ya?ml)$/, '');

const files = (base: string, pattern: string) => glob({ base, pattern, generateId: fileId });

/** Each collection builds its schema from the shared definitions with Astro's `reference()` and `image()`. */
function schemaFor<C extends CollectionName>(name: C) {
  return ({ image }: SchemaContext) => defineSchemas((collection) => reference(collection), image)[name];
}

export const collections = {
  releases: defineCollection({ loader: files('content/releases', '*.md'), schema: schemaFor('releases') }),
  songs: defineCollection({ loader: files('content/songs', '*.md'), schema: schemaFor('songs') }),
  recordings: defineCollection({ loader: files('content/recordings', '*.yaml'), schema: schemaFor('recordings') }),
  eras: defineCollection({ loader: files('content/eras', '*.md'), schema: schemaFor('eras') }),
  timeline: defineCollection({ loader: yamlListLoader('content/timeline'), schema: schemaFor('timeline') }),
  writings: defineCollection({ loader: files('content/writings', '*.md'), schema: schemaFor('writings') }),
  people: defineCollection({ loader: files('content/people', '*.yaml'), schema: schemaFor('people') }),
  places: defineCollection({ loader: files('content/places', '*.yaml'), schema: schemaFor('places') }),
  quotes: defineCollection({ loader: files('content/quotes', '*.yaml'), schema: schemaFor('quotes') }),
  photos: defineCollection({
    loader: glob({
      base: 'content/photos',
      pattern: '*/album.yaml',
      generateId: ({ entry }) => entry.replace(/\/album\.yaml$/, ''),
    }),
    schema: schemaFor('photos'),
  }),
  videos: defineCollection({ loader: files('content/videos', '*.yaml'), schema: schemaFor('videos') }),
  instagram: defineCollection({ loader: file('content/instagram/posts.yaml'), schema: schemaFor('instagram') }),
  pages: defineCollection({ loader: files('content/pages', '*.md'), schema: schemaFor('pages') }),
  interviews: defineCollection({ loader: files('content/interviews', '*.md'), schema: schemaFor('interviews') }),
};
