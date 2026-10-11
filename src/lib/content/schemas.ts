/**
 * Collection schemas — the contract for `content/` (docs/content-model.md).
 *
 * Schemas are built by `defineSchemas(ref, image)` so that one definition serves two readers:
 * - `src/content.config.ts` passes Astro's `reference()` and `image()` (rich entries for pages);
 * - `src/lib/content/raw.ts` passes plain strings (ids and file paths) for the relations graph, unit tests and
 *   `scripts/validate-content.ts`, which run outside Astro.
 */
import { z } from 'astro/zod';
import { isPartialDate } from '~/lib/dates';

export const collectionNames = [
  'releases',
  'songs',
  'recordings',
  'eras',
  'timeline',
  'writings',
  'people',
  'places',
  'quotes',
  'photos',
  'videos',
  'instagram',
  'pages',
  'interviews',
] as const;

export type CollectionName = (typeof collectionNames)[number];

export const partialDate = z
  .string()
  .refine(isPartialDate, { message: 'expected a partial date: YYYY, YYYY-MM or YYYY-MM-DD' });

export const certainty = z.enum(['confirmed', 'probable', 'uncertain']).default('confirmed');

export const localized = z.object({ ru: z.string().min(1), uk: z.string().optional(), en: z.string().optional() });

export const sourceRef = z.object({
  title: z.string().min(1),
  url: z.url().optional(),
  note: z.string().optional(),
});

export const rights = z
  .object({
    /** Owner-provided media is cleared; `hidden` entries are not rendered. */
    status: z.enum(['cleared', 'link-only', 'hidden']).default('cleared'),
    holder: z.string().optional(),
    note: z.string().optional(),
  })
  .default({ status: 'cleared' });

/** Fixed theme vocabulary for songs (Тексты index). Assigned only from imagery literally present in the lyrics. */
export const songThemes = [
  'вода',
  'дождь',
  'лес',
  'весна',
  'вечер',
  'ночь',
  'сны',
  'окна',
  'фонари',
  'дом',
  'город',
  'время',
  'отношения',
] as const;

export const releaseTypes = ['single', 'ep', 'album', 'live', 'compilation'] as const;
export const recordingVersions = ['studio', 'live', 'demo', 'instrumental', 'intro', 'full-release'] as const;
export const timelineRails = ['life', 'recorded', 'released'] as const;
export const timelineKinds = ['life', 'concert', 'rehearsal', 'writing', 'press'] as const;
export const videoKinds = ['clip', 'concert', 'rehearsal', 'home', 'tribute', 'interview', 'other'] as const;
export const personRoles = ['self', 'poet', 'artist', 'label', 'collaborator', 'musician', 'press'] as const;
export const placeKinds = ['city', 'street', 'home', 'metro', 'nature', 'venue'] as const;
export const photoSources = ['family', 'friends', 'band', 'instagram', 'press', 'covers'] as const;

/**
 * @param ref   builds a reference to an entry of another collection (Astro `reference()` or a plain id string)
 * @param image builds an image field (Astro `image()` or a plain relative path)
 */
export function defineSchemas<R extends z.ZodType, I extends z.ZodType>(
  ref: (collection: CollectionName) => R,
  image: () => I,
) {
  const credit = z.object({ role: z.string().min(1), name: z.string().min(1), person: ref('people').optional() });
  const sources = z.array(sourceRef).default([]);
  const span = z.object({ from: partialDate, to: partialDate.optional(), place: ref('places').optional() });

  const releases = z.object({
    title: z.string().min(1),
    type: z.enum(releaseTypes),
    archival: z.boolean().default(false),
    reissueOf: ref('releases').optional(),
    recorded: span.optional(),
    released: partialDate.optional(),
    label: z.string().optional(),
    catalog: z.string().optional(),
    tracks: z.array(ref('recordings')).default([]),
    tracklistKnown: z.boolean().default(true),
    cover: image().optional(),
    credits: z.array(credit).default([]),
    links: z
      .object({
        bandcamp: z.url().optional(),
        soundcloud: z.url().optional(),
        appleMusic: z.url().optional(),
        other: z.array(z.object({ title: z.string(), url: z.url() })).optional(),
      })
      .default({}),
    era: ref('eras'),
    projectName: z.enum(['Станция Видеопарк', 'Видеопарк']).default('Станция Видеопарк'),
    certainty,
    sources,
  });

  const songs = z.object({
    title: z.string().min(1),
    written: partialDate.optional(),
    /** Omitted = Женя Мычак. */
    lyricsBy: ref('people').optional(),
    lyricsSource: z.object({ work: z.string().min(1), person: ref('people') }).optional(),
    coverOf: z.object({ artist: z.string().min(1), title: z.string().min(1), person: ref('people').optional() }).optional(),
    themes: z.array(z.enum(songThemes)).default([]),
    lyricsStatus: z.enum(['complete', 'partial', 'missing', 'instrumental']),
    instrumental: z.boolean().default(false),
    /** Owner-provided raw lyric file in `content/lyrics/` the body was taken from. */
    lyricsFile: z.string().optional(),
    certainty,
    sources,
  });

  const recordings = z
    .object({
      /** Omitted only for `full-release` recordings (a whole release in one file). */
      song: ref('songs').optional(),
      title: z.string().optional(),
      version: z.enum(recordingVersions),
      chapters: z.array(z.object({ t: z.number().nonnegative(), title: z.string() })).optional(),
      recorded: span.optional(),
      duration: z
        .string()
        .regex(/^\d{1,2}:\d{2}$/, 'expected m:ss')
        .optional(),
      audio: z
        .object({
          /** Master path relative to `content/tracks/` (git-ignored; encoded by `pnpm media`). */
          file: z.string().optional(),
          soundcloud: z.url().optional(),
          bandcamp: z.url().optional(),
          rights,
        })
        .default({ rights: { status: 'cleared' } }),
      peaks: z.string().optional(),
      syncedLyrics: z.array(z.object({ t: z.number().nonnegative(), line: z.number().int().nonnegative() })).optional(),
      performers: z.array(credit).default([]),
      certainty,
      sources,
    })
    .refine((r) => r.song !== undefined || r.version === 'full-release', {
      message: 'song is required unless version is full-release',
      path: ['song'],
    });

  const eras = z.object({
    title: localized,
    from: partialDate,
    to: partialDate.optional(),
    summary: localized,
    palette: z.string().optional(),
    cover: image().optional(),
    sources,
  });

  const timeline = z.object({
    id: z.string(),
    date: partialDate,
    rail: z.enum(timelineRails),
    kind: z.enum(timelineKinds).default('life'),
    title: localized,
    text: localized.optional(),
    links: z
      .object({
        releases: z.array(ref('releases')).optional(),
        songs: z.array(ref('songs')).optional(),
        photos: z.array(ref('photos')).optional(),
        people: z.array(ref('people')).optional(),
        places: z.array(ref('places')).optional(),
      })
      .default({}),
    videos: z.array(ref('videos')).default([]),
    certainty,
    sources,
  });

  const writings = z.object({
    title: z.string().min(1),
    kind: z.enum(['poem', 'prose']),
    date: partialDate,
    /** File in `content/knowlage-base/` the text was taken from. */
    source: z.string(),
    order: z.number().int(),
  });

  const people = z.object({
    name: localized,
    role: z.enum(personRoles),
    years: z.string().optional(),
    bio: localized.optional(),
    links: z.array(z.object({ title: z.string(), url: z.url() })).default([]),
    sources,
  });

  const places = z.object({
    name: localized,
    kind: z.enum(placeKinds),
    /** Public places only — never the family home. */
    coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
    within: ref('places').optional(),
    description: localized.optional(),
    sources,
  });

  const quotes = z.object({
    text: z.string().min(1),
    translations: localized.partial().optional(),
    source: sourceRef,
    interview: ref('interviews').optional(),
    context: z.string().optional(),
    featured: z.boolean().default(false),
    certainty,
  });

  const photo = z.object({
    file: image(),
    alt: z.string().min(1),
    caption: z.string().optional(),
    date: partialDate.optional(),
    place: ref('places').optional(),
    people: z.array(ref('people')).default([]),
    credit,
    rights,
    songs: z.array(ref('songs')).default([]),
    /** Selected by the owner (`content/photos/portraits/`): used on the platform and in the biography. */
    featured: z.boolean().default(false),
    /** Large enough (≥ 1600 px) and strong enough to be used as a hero image. */
    hero: z.boolean().default(false),
  });

  const photos = z.object({
    title: localized,
    period: z.object({ from: partialDate, to: partialDate.optional() }).optional(),
    source: z.enum(photoSources),
    order: z.number().int().default(0),
    photos: z.array(photo).default([]),
  });

  const videos = z
    .object({
      title: z.string().min(1),
      /** Title exactly as published by the source (e.g. on YouTube). */
      sourceTitle: z.string().optional(),
      kind: z.enum(videoKinds),
      date: partialDate.optional(),
      event: z
        .object({ name: z.string(), venue: ref('places').optional(), city: ref('places').optional(), date: partialDate.optional() })
        .optional(),
      provider: z.enum(['youtube', 'vimeo', 'local', 'mixcloud']),
      /** Provider id (YouTube video id). */
      id: z.string().optional(),
      /** Local file relative to `content/videos/` (git-ignored; prepared by `pnpm media`). */
      file: z.string().optional(),
      poster: image().optional(),
      captions: z.string().optional(),
      duration: z
        .string()
        .regex(/^\d{1,2}:\d{2}$/)
        .optional(),
      songs: z.array(ref('songs')).default([]),
      credit,
      rights,
      certainty,
      sources,
    })
    .refine((v) => (v.provider === 'local' ? v.file !== undefined : v.id !== undefined), {
      message: 'local videos need `file`, hosted videos need `id`',
    });

  const instagramMedia = z.discriminatedUnion('type', [
    z.object({ type: z.literal('image'), file: image(), alt: z.string().min(1) }),
    /** Videos are git-ignored; `pnpm media` copies them to `public/media/instagram/`. */
    z.object({ type: z.literal('video'), file: z.string(), alt: z.string().min(1), duration: z.string().optional() }),
  ]);

  const instagram = z.object({
    id: z.string(),
    permalink: z.url().regex(/^https:\/\/www\.instagram\.com\/p\/[\w-]+\/$/, 'permalink without tracking parameters'),
    date: partialDate.optional(),
    caption: z.string().optional(),
    media: z.array(instagramMedia).default([]),
    credits: z.array(credit).default([]),
    album: ref('photos').optional(),
    songs: z.array(ref('songs')).default([]),
    rights,
  });

  const pages = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    /** Chapter ids for deep links (`/zhenya#poeziya`), in body order; each matches one `## ` heading. */
    sections: z.array(z.object({ id: z.string(), title: z.string() })).default([]),
    sources,
  });

  const interviews = z.object({
    title: z.string().min(1),
    publisher: z.string().min(1),
    date: partialDate.optional(),
    url: z.url().optional(),
    person: ref('people'),
    turns: z.array(z.object({ speaker: z.enum(['interviewer', 'subject']), text: z.string().min(1) })).min(1),
    /** Silent corrections of plain typos (docs/editorial-guidelines.md §4), recorded for transparency. */
    corrections: z.array(z.object({ original: z.string(), corrected: z.string() })).default([]),
    sources,
  });

  return {
    releases,
    songs,
    recordings,
    eras,
    timeline,
    writings,
    people,
    places,
    quotes,
    photos,
    videos,
    instagram,
    pages,
    interviews,
  } satisfies Record<CollectionName, z.ZodType>;
}
