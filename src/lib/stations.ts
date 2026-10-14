/**
 * The single registry of stations (docs/architecture.md §3, docs/information-architecture.md §1).
 * Line indicator, line map, next-station footer and transition direction all read from here.
 * Adding a station (e.g. the deferred «Воспоминания») is a data change in this file plus its route and UI strings.
 */
import { normalizePath, parseLocalizedPath } from '~/i18n/routes';
import type { TranslationKey } from '~/i18n/t';

export type StationId =
  'platform' | 'music' | 'history' | 'lyrics' | 'photos' | 'video' | 'brovary' | 'zhenya' | 'about';

/**
 * - `line`: a station on the single line, in travel order.
 * - `deep`: a deeper platform reached by transfer (Женя).
 * - `service`: a service room outside the line (Об архиве).
 */
export type StationKind = 'line' | 'deep' | 'service';

export type Station = {
  id: StationId;
  /** Locale-independent route; build links with `localizedPath()`. */
  path: string;
  kind: StationKind;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  /** A few words under the station name in the line map. */
  taglineKey: TranslationKey;
  /** Stations reachable by transfer from this one, shown in the next-station footer. */
  transfers: readonly StationId[];
};

function station(id: StationId, path: string, kind: StationKind, transfers: readonly StationId[] = []): Station {
  return {
    id,
    path,
    kind,
    nameKey: `station.${id}.name`,
    descriptionKey: `station.${id}.description`,
    taglineKey: `station.${id}.tagline`,
    transfers,
  };
}

/** Order matters: line stations are listed in travel direction; the last line station is the terminal. */
export const stations: readonly Station[] = [
  station('platform', '/', 'line'),
  station('music', '/music', 'line'),
  station('history', '/history', 'line', ['zhenya']),
  station('lyrics', '/lyrics', 'line'),
  station('photos', '/photos', 'line'),
  station('video', '/video', 'line'),
  station('brovary', '/brovary', 'line', ['zhenya']),
  station('zhenya', '/zhenya', 'deep', ['history', 'brovary']),
  station('about', '/about', 'service', ['platform']),
];

export const lineStations: readonly Station[] = stations.filter((s) => s.kind === 'line');

export function getStation(id: StationId): Station {
  const found = stations.find((s) => s.id === id);
  if (!found) throw new Error(`stations: unknown station "${id}"`);
  return found;
}

/** Position on the line (0 = Платформа), or `undefined` for deep/service stations. */
export function lineIndex(id: StationId): number | undefined {
  const index = lineStations.findIndex((s) => s.id === id);
  return index === -1 ? undefined : index;
}

export function isTerminal(id: StationId): boolean {
  return lineStations.at(-1)?.id === id;
}

export function neighbours(id: StationId): { previous: Station | undefined; next: Station | undefined } {
  const index = lineIndex(id);
  if (index === undefined) return { previous: undefined, next: undefined };
  return { previous: lineStations[index - 1], next: lineStations[index + 1] };
}

/** The station a pathname belongs to (`/music/some-release` → Музыка). Locale prefixes are ignored. */
export function stationForPath(pathname: string): Station | undefined {
  const { path } = parseLocalizedPath(normalizePath(pathname));
  if (path === '/') return getStation('platform');
  return stations.find((s) => s.path !== '/' && (path === s.path || path.startsWith(`${s.path}/`)));
}

export type TransitionDirection = 'forward' | 'back' | 'none' | 'map';

/**
 * Direction of travel between two pages: forward/back along the line, `none` (crossfade) for jumps involving
 * deep/service stations, unknown pages, or navigation within one station.
 */
export function transitionDirection(fromPathname: string, toPathname: string): TransitionDirection {
  const from = stationForPath(fromPathname);
  const to = stationForPath(toPathname);
  if (!from || !to || from.id === to.id) return 'none';
  const fromIndex = lineIndex(from.id);
  const toIndex = lineIndex(to.id);
  if (fromIndex === undefined || toIndex === undefined) return 'none';
  return toIndex > fromIndex ? 'forward' : 'back';
}

/** A jump chosen on the line map zooms into the target instead of sliding (docs/information-architecture.md §4). */
export function navigationDirection(
  fromPathname: string,
  toPathname: string,
  { viaLineMap = false }: { viaLineMap?: boolean } = {},
): TransitionDirection {
  if (viaLineMap && stationForPath(fromPathname)?.id !== stationForPath(toPathname)?.id) return 'map';
  return transitionDirection(fromPathname, toPathname);
}
