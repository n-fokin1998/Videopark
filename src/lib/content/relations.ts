/**
 * The relations graph (docs/content-model.md §4). Entries reference each other one way, by id; this module builds the
 * reverse links once, at build time, and answers the questions pages ask: «Пересадки» (transfers), versions of a
 * song, releases containing a recording, and chronological orders for the player and the timeline.
 *
 * Pure: takes already-loaded content (`RawContent` from `./raw`) and never touches the file system.
 */
import { comparePartialDates, type PartialDate } from '~/lib/dates';
import type { RawContent, RawData } from './raw';
import type { CollectionName } from './schemas';

export type EntityRef = { collection: CollectionName; id: string };

export type Entity = EntityRef & {
  title: string;
  /** The date the entity is placed at in time (release date, recording date, event date…). */
  date?: PartialDate;
};

export type Relation =
  | 'track'
  | 'song'
  | 'reissue'
  | 'era'
  | 'credit'
  | 'performer'
  | 'lyrics'
  | 'cover-of'
  | 'place'
  | 'link'
  | 'video'
  | 'person'
  | 'album'
  | 'interview'
  | 'within';

export type Edge = { from: string; to: string; rel: Relation };

export type ContentGraph = {
  entities: ReadonlyMap<string, Entity>;
  outgoing: ReadonlyMap<string, readonly Edge[]>;
  incoming: ReadonlyMap<string, readonly Edge[]>;
  /** References whose target does not exist (also reported by `scripts/validate-content.ts`). */
  broken: readonly (Edge & { target: EntityRef })[];
  content: RawContent;
};

export type TransferGroup = { collection: CollectionName; entities: Entity[] };

export function keyOf({ collection, id }: EntityRef): string {
  return `${collection}/${id}`;
}

function refOf(key: string): EntityRef {
  const slash = key.indexOf('/');
  return { collection: key.slice(0, slash) as CollectionName, id: key.slice(slash + 1) };
}

const versionLabel: Record<RawData<'recordings'>['version'], string> = {
  studio: 'studio',
  live: 'live',
  demo: 'demo',
  instrumental: 'instrumental',
  intro: 'intro',
  'full-release': 'full release',
};

function truncate(text: string, length = 60): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > length ? `${flat.slice(0, length - 1)}…` : flat;
}

export function buildGraph(content: RawContent): ContentGraph {
  const entities = new Map<string, Entity>();
  const edges: Edge[] = [];
  const pending: { from: string; target: EntityRef; rel: Relation }[] = [];

  const add = (entity: Entity) => entities.set(keyOf(entity), entity);
  const link = (from: EntityRef, collection: CollectionName, id: string | undefined, rel: Relation) => {
    if (id !== undefined) pending.push({ from: keyOf(from), target: { collection, id }, rel });
  };
  const linkAll = (from: EntityRef, collection: CollectionName, ids: readonly string[] | undefined, rel: Relation) => {
    for (const id of ids ?? []) link(from, collection, id, rel);
  };

  const songTitles = new Map(content.songs.map((s) => [s.id, s.data.title]));

  for (const { id, data } of content.releases) {
    const self = { collection: 'releases', id } as const;
    add({ ...self, title: data.title, ...(data.released && { date: data.released }) });
    linkAll(self, 'recordings', data.tracks, 'track');
    link(self, 'releases', data.reissueOf, 'reissue');
    link(self, 'eras', data.era, 'era');
    link(self, 'places', data.recorded?.place, 'place');
    for (const c of data.credits) link(self, 'people', c.person, 'credit');
  }

  for (const { id, data } of content.recordings) {
    const self = { collection: 'recordings', id } as const;
    const base = data.title ?? (data.song ? songTitles.get(data.song) : undefined) ?? id;
    add({ ...self, title: `${base} (${versionLabel[data.version]})`, ...(data.recorded && { date: data.recorded.from }) });
    link(self, 'songs', data.song, 'song');
    link(self, 'places', data.recorded?.place, 'place');
    for (const p of data.performers) link(self, 'people', p.person, 'performer');
  }

  for (const { id, data } of content.songs) {
    const self = { collection: 'songs', id } as const;
    add({ ...self, title: data.title, ...(data.written && { date: data.written }) });
    link(self, 'people', data.lyricsBy, 'lyrics');
    link(self, 'people', data.lyricsSource?.person, 'lyrics');
    link(self, 'people', data.coverOf?.person, 'cover-of');
  }

  for (const { id, data } of content.eras) add({ collection: 'eras', id, title: data.title.ru, date: data.from });

  for (const { id, data } of content.timeline) {
    const self = { collection: 'timeline', id } as const;
    add({ ...self, title: data.title.ru, date: data.date });
    linkAll(self, 'releases', data.links.releases, 'link');
    linkAll(self, 'songs', data.links.songs, 'link');
    linkAll(self, 'photos', data.links.photos, 'link');
    linkAll(self, 'people', data.links.people, 'link');
    linkAll(self, 'places', data.links.places, 'link');
    linkAll(self, 'videos', data.videos, 'video');
  }

  for (const { id, data } of content.writings) add({ collection: 'writings', id, title: data.title, date: data.date });

  for (const { id, data } of content.people) add({ collection: 'people', id, title: data.name.ru });

  for (const { id, data } of content.places) {
    const self = { collection: 'places', id } as const;
    add({ ...self, title: data.name.ru });
    link(self, 'places', data.within, 'within');
  }

  for (const { id, data } of content.quotes) {
    const self = { collection: 'quotes', id } as const;
    add({ ...self, title: truncate(data.text) });
    link(self, 'interviews', data.interview, 'interview');
  }

  for (const { id, data } of content.photos) {
    const self = { collection: 'photos', id } as const;
    add({ ...self, title: data.title.ru, ...(data.period && { date: data.period.from }) });
    for (const photo of data.photos) {
      link(self, 'places', photo.place, 'place');
      linkAll(self, 'people', photo.people, 'person');
      linkAll(self, 'songs', photo.songs, 'song');
      link(self, 'people', photo.credit.person, 'credit');
    }
  }

  for (const { id, data } of content.videos) {
    const self = { collection: 'videos', id } as const;
    add({ ...self, title: data.title, ...(data.date && { date: data.date }) });
    linkAll(self, 'songs', data.songs, 'song');
    link(self, 'places', data.event?.venue, 'place');
    link(self, 'places', data.event?.city, 'place');
  }

  for (const { id, data } of content.instagram) {
    const self = { collection: 'instagram', id } as const;
    add({ ...self, title: data.caption ? truncate(data.caption) : id, ...(data.date && { date: data.date }) });
    link(self, 'photos', data.album, 'album');
    linkAll(self, 'songs', data.songs, 'song');
    for (const c of data.credits) link(self, 'people', c.person, 'credit');
  }

  for (const { id, data } of content.pages) add({ collection: 'pages', id, title: data.title });

  for (const { id, data } of content.interviews) {
    const self = { collection: 'interviews', id } as const;
    add({ ...self, title: data.title, ...(data.date && { date: data.date }) });
    link(self, 'people', data.person, 'person');
  }

  const broken: ContentGraph['broken'][number][] = [];
  for (const { from, target, rel } of pending) {
    const to = keyOf(target);
    if (entities.has(to)) edges.push({ from, to, rel });
    else broken.push({ from, to, rel, target });
  }

  const outgoing = new Map<string, Edge[]>();
  const incoming = new Map<string, Edge[]>();
  for (const edge of edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);
  }

  return { entities, outgoing, incoming, broken, content };
}

export function getEntity(graph: ContentGraph, ref: EntityRef): Entity {
  const entity = graph.entities.get(keyOf(ref));
  if (!entity) throw new Error(`relations: unknown entity ${keyOf(ref)}`);
  return entity;
}

function neighbours(graph: ContentGraph, key: string): string[] {
  return [
    ...(graph.outgoing.get(key) ?? []).map((e) => e.to),
    ...(graph.incoming.get(key) ?? []).map((e) => e.from),
  ];
}

function byDateThenTitle(a: Entity, b: Entity): number {
  if (a.date && b.date) {
    const order = comparePartialDates(a.date, b.date);
    if (order !== 0) return order;
  } else if (a.date || b.date) {
    return a.date ? -1 : 1;
  }
  return a.title.localeCompare(b.title, 'ru');
}

/** Display order of transfer groups — music first. */
const transferOrder: readonly CollectionName[] = [
  'songs',
  'releases',
  'videos',
  'photos',
  'instagram',
  'writings',
  'people',
  'places',
  'eras',
  'timeline',
  'quotes',
  'interviews',
  'pages',
  'recordings',
];

/**
 * Related entities for the «Пересадки» block, grouped by collection.
 * Recordings are an internal layer: from a song you transfer to the releases it is on, from a release to its songs.
 */
export function transfersFor(graph: ContentGraph, ref: EntityRef): TransferGroup[] {
  const origin = keyOf(ref);
  getEntity(graph, ref);
  const found = new Set<string>();
  for (const key of neighbours(graph, origin)) {
    if (ref.collection !== 'recordings' && refOf(key).collection === 'recordings') {
      for (const next of neighbours(graph, key)) found.add(next);
    } else {
      found.add(key);
    }
  }
  found.delete(origin);

  const groups = new Map<CollectionName, Entity[]>();
  for (const key of found) {
    const entity = graph.entities.get(key);
    if (!entity) continue;
    groups.set(entity.collection, [...(groups.get(entity.collection) ?? []), entity]);
  }
  return transferOrder
    .filter((c) => groups.has(c))
    .map((collection) => ({ collection, entities: (groups.get(collection) ?? []).sort(byDateThenTitle) }));
}

/** Recordings of a song, oldest first. */
export function recordingsOf(graph: ContentGraph, songId: string): Entity[] {
  return (graph.incoming.get(keyOf({ collection: 'songs', id: songId })) ?? [])
    .filter((e) => e.rel === 'song' && refOf(e.from).collection === 'recordings')
    .map((e) => getEntity(graph, refOf(e.from)))
    .sort(byDateThenTitle);
}

/** Releases whose tracklist contains the recording, oldest release first. */
export function releasesContaining(graph: ContentGraph, recordingId: string): Entity[] {
  return (graph.incoming.get(keyOf({ collection: 'recordings', id: recordingId })) ?? [])
    .filter((e) => e.rel === 'track')
    .map((e) => getEntity(graph, refOf(e.from)))
    .sort(byDateThenTitle);
}

export type Version = { recording: Entity; releases: Entity[] };

/** Every version of a song with the releases it appears on («Вода»: EP «3» and «RAW STUFF VOL. 5»). */
export function versionsOf(graph: ContentGraph, songId: string): Version[] {
  return recordingsOf(graph, songId).map((recording) => ({
    recording,
    releases: releasesContaining(graph, recording.id),
  }));
}

export type ChronologyItem = { recording: Entity; date: PartialDate | undefined };

/**
 * All recordings in time order — by recording date (falling back to the containing release's recording period)
 * or by first release date. Recordings without a known date come last, by title.
 */
export function chronology(graph: ContentGraph, { by }: { by: 'recorded' | 'released' }): ChronologyItem[] {
  const releases = new Map(graph.content.releases.map((r) => [r.id, r.data]));
  const items = graph.content.recordings.map(({ id, data }): ChronologyItem => {
    const recording = getEntity(graph, { collection: 'recordings', id });
    const containing = releasesContaining(graph, id).map((r) => releases.get(r.id));
    let date: PartialDate | undefined;
    if (by === 'recorded') {
      date = data.recorded?.from ?? containing.map((r) => r?.recorded?.from).find((d) => d !== undefined);
    } else {
      date = containing
        .map((r) => r?.released)
        .filter((d): d is string => d !== undefined)
        .sort(comparePartialDates)[0];
    }
    return { recording, date };
  });
  return items.sort((a, b) => {
    if (a.date && b.date) return comparePartialDates(a.date, b.date) || a.recording.title.localeCompare(b.recording.title, 'ru');
    if (a.date || b.date) return a.date ? -1 : 1;
    return a.recording.title.localeCompare(b.recording.title, 'ru');
  });
}

export type TimelinePoint = {
  date: PartialDate;
  rail: RawData<'timeline'>['rail'];
  kind: RawData<'timeline'>['kind'] | 'release';
  title: string;
  ref: EntityRef;
};

/** Timeline events plus the points derived from releases (recorded and released rails), in time order. */
export function timelinePoints(graph: ContentGraph): TimelinePoint[] {
  const points: TimelinePoint[] = graph.content.timeline.map(({ id, data }) => ({
    date: data.date,
    rail: data.rail,
    kind: data.kind,
    title: data.title.ru,
    ref: { collection: 'timeline', id },
  }));
  for (const { id, data } of graph.content.releases) {
    const ref = { collection: 'releases', id } as const;
    if (data.recorded) points.push({ date: data.recorded.from, rail: 'recorded', kind: 'release', title: data.title, ref });
    if (data.released) points.push({ date: data.released, rail: 'released', kind: 'release', title: data.title, ref });
  }
  return points.sort((a, b) => comparePartialDates(a.date, b.date) || a.title.localeCompare(b.title, 'ru'));
}

/** Entities that nothing references and that reference nothing (useful for the debug page and validation). */
export function isolatedEntities(graph: ContentGraph): Entity[] {
  return [...graph.entities.entries()]
    .filter(([key]) => !graph.outgoing.has(key) && !graph.incoming.has(key))
    .map(([, entity]) => entity);
}
