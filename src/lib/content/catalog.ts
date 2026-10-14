/**
 * Build-time track catalog for the player (docs/architecture.md §5): one `Track` per recording, resolved from content.
 * - `src` only when `pnpm media` has produced `public/media/audio/<id>.m4a` (masters are git-ignored, D-021) — a fresh
 *   clone without media falls back to SoundCloud or an external link, never to a dead play button;
 * - `link` from the recording's own Bandcamp URL or the first release that has one;
 * - artwork: the cover of the earliest release containing the recording, as a small optimised image.
 * Astro-only (uses `astro:content` / `astro:assets`); the pure logic lives in `~/lib/player/*`.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getImage } from 'astro:assets';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '~/i18n/config';
import { translate } from '~/i18n/t';
import { comparePartialDates } from '~/lib/dates';
import { parseDuration, type Track } from '~/lib/player/track';

const AUDIO_DIR = join(process.cwd(), 'public', 'media', 'audio');
const ARTWORK_SIZE = 512;

type Release = CollectionEntry<'releases'>;

const services: [key: 'bandcamp' | 'soundcloud' | 'appleMusic', name: string][] = [
  ['bandcamp', 'Bandcamp'],
  ['soundcloud', 'SoundCloud'],
  ['appleMusic', 'Apple Music'],
];

function byRelease(a: Release, b: Release): number {
  if (a.data.released && b.data.released) return comparePartialDates(a.data.released, b.data.released);
  return a.data.released ? -1 : b.data.released ? 1 : 0;
}

/** Where else to listen: the recording's own Bandcamp page, else the first release link by service priority. */
function listenLink(bandcamp: string | undefined, releases: readonly Release[]): { service: string; url: string } | undefined {
  if (bandcamp) return { service: 'Bandcamp', url: bandcamp };
  for (const [key, service] of services) {
    const url = releases.map((r) => r.data.links[key]).find((u) => u !== undefined);
    if (url) return { service, url };
  }
  return undefined;
}

async function buildCatalog(locale: Locale): Promise<Map<string, Track>> {
  const [recordings, songs, releases] = await Promise.all([
    getCollection('recordings'),
    getCollection('songs'),
    getCollection('releases'),
  ]);
  const songTitles = new Map(songs.map((s) => [s.id, s.data.title]));
  const containing = new Map<string, Release[]>();
  for (const release of [...releases].sort(byRelease)) {
    for (const track of release.data.tracks) containing.set(track.id, [...(containing.get(track.id) ?? []), release]);
  }

  const artworkCache = new Map<string, Promise<string | undefined>>();
  const artworkFor = (release: Release | undefined) => {
    const cover = release?.data.cover;
    if (!release || !cover) return Promise.resolve(undefined);
    if (!artworkCache.has(release.id)) {
      artworkCache.set(
        release.id,
        getImage({ src: cover, width: ARTWORK_SIZE, height: ARTWORK_SIZE, format: 'webp', fit: 'cover' }).then(
          (image) => image.src,
        ),
      );
    }
    return artworkCache.get(release.id) ?? Promise.resolve(undefined);
  };

  const entries = await Promise.all(
    recordings
      .filter((r) => r.data.audio.rights.status !== 'hidden')
      .map(async ({ id, data }): Promise<[string, Track]> => {
        const onReleases = containing.get(id) ?? [];
        const release = onReleases[0];
        const title = data.title ?? (data.song ? songTitles.get(data.song.id) : undefined) ?? release?.data.title;
        if (!title) throw new Error(`catalog: recording "${id}" has no title, song or release`);
        const selfHosted = data.audio.rights.status === 'cleared' && data.audio.file !== undefined;
        const hasFile = selfHosted && existsSync(join(AUDIO_DIR, `${id}.m4a`));
        const listen = listenLink(data.audio.bandcamp, onReleases);
        return [
          id,
          {
            id,
            title,
            album: release?.data.title ?? translate(locale, 'player.separateSongs'),
            artist: release?.data.projectName ?? translate(locale, 'site.name'),
            duration: parseDuration(data.duration),
            src: hasFile ? `/media/audio/${id}.m4a` : undefined,
            peaks: hasFile && existsSync(join(AUDIO_DIR, `${id}.peaks.json`)) ? `/media/audio/${id}.peaks.json` : undefined,
            soundcloud: data.audio.soundcloud,
            link: listen && { url: listen.url, label: translate(locale, 'player.listenOn', { service: listen.service }) },
            artwork: await artworkFor(onReleases.find((r) => r.data.cover)),
          },
        ];
      }),
  );
  return new Map(entries);
}

const catalogs = new Map<Locale, Promise<Map<string, Track>>>();

/** All tracks by recording id (memoised per build). */
export function getTrackCatalog(locale: Locale): Promise<Map<string, Track>> {
  let catalog = catalogs.get(locale);
  if (!catalog) {
    catalog = buildCatalog(locale);
    catalogs.set(locale, catalog);
  }
  return catalog;
}

/**
 * Candidates for «Трек вечера»: one playable song recording per song (its earliest studio/live version), no intros,
 * instrumentals or whole-release files. Sorted by id so the daily rotation is stable between builds.
 */
export async function getEveningTracks(locale: Locale): Promise<Track[]> {
  const catalog = await getTrackCatalog(locale);
  const recordings = await getCollection('recordings');
  const seen = new Set<string>();
  const picks: Track[] = [];
  for (const { id, data } of [...recordings].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!data.song || seen.has(data.song.id)) continue;
    if (data.version !== 'studio' && data.version !== 'live') continue;
    const track = catalog.get(id);
    if (!track?.src) continue;
    seen.add(data.song.id);
    picks.push(track);
  }
  return picks;
}
