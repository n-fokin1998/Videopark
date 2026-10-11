import { beforeAll, describe, expect, it } from 'vitest';
import { loadContent, type RawContent } from './raw';
import {
  buildGraph,
  chronology,
  isolatedEntities,
  releasesContaining,
  recordingsOf,
  timelinePoints,
  transfersFor,
  versionsOf,
  type ContentGraph,
} from './relations';

/** Tests run against the real content in `content/` (docs/content-model.md §4). */
let content: RawContent;
let graph: ContentGraph;

beforeAll(() => {
  content = loadContent();
  graph = buildGraph(content);
});

const ids = (entities: { id: string }[]) => entities.map((e) => e.id);

describe('content graph (real data)', () => {
  it('has no broken references', () => {
    expect(graph.broken).toEqual([]);
  });

  it('«Вода» has two recordings: EP «3» and «RAW STUFF VOL. 5»', () => {
    const versions = versionsOf(graph, 'voda');
    expect(versions.map((v) => v.recording.id)).toEqual(['voda--3', 'voda--raw-stuff-vol-5']);
    expect(ids(versions[0]!.releases)).toEqual(['3-ep-2016', '3-ep-2020']);
    expect(ids(versions[1]!.releases)).toEqual(['raw-stuff-vol-5']);
  });

  it('«Мой милый дом» is one full-release recording with an unknown tracklist', () => {
    const release = content.releases.find((r) => r.id === 'moi-milyi-dom');
    expect(release?.data.tracklistKnown).toBe(false);
    expect(release?.data.tracks).toEqual(['moi-milyi-dom--full']);
    const recording = content.recordings.find((r) => r.id === 'moi-milyi-dom--full');
    expect(recording?.data.version).toBe('full-release');
    expect(recording?.data.song).toBeUndefined();
  });

  it('the duplicated «Будни» file is one recording shared by two releases (issue B)', () => {
    expect(ids(releasesContaining(graph, 'budni--v-nogu-s-suetoi'))).toEqual([
      'khoroshee-vremya',
      'v-nogu-s-suetoi-single-2020',
    ]);
  });

  it('files duplicated between «Хорошее время» and «RAW STUFF VOL. 5» are one shared recording (issues A, I)', () => {
    for (const id of ['33-shaga-37-minut--raw-stuff-vol-5', 'khoroshee-vremya--raw-stuff-vol-5', 'avtootvetchik--raw-stuff-vol-5']) {
      expect(ids(releasesContaining(graph, id)), id).toEqual(['khoroshee-vremya', 'raw-stuff-vol-5']);
    }
    expect(versionsOf(graph, '33-shaga-37-minut').map((v) => v.recording.id).sort()).toEqual([
      '33-shaga-37-minut--raw-stuff-vol-5',
      '33-shaga-37-minut--single',
    ]);
  });

  it('every archival reissue points at an existing original', () => {
    const byId = new Map(content.releases.map((r) => [r.id, r]));
    for (const release of content.releases.filter((r) => r.data.reissueOf)) {
      expect(byId.has(release.data.reissueOf!), release.id).toBe(true);
      expect(release.data.archival, release.id).toBe(true);
    }
  });

  it('borrowed words are linked to their poets', () => {
    expect(content.songs.find((s) => s.id === 'prikhodit-k-tebe')?.data.lyricsSource).toEqual({
      work: 'Последнее стихотворение',
      person: 'robert-desnos',
    });
    expect(content.songs.find((s) => s.id === 'plavitsya-lyod')?.data.lyricsBy).toBe('ilya-kormiltsev');
  });

  it('songs known only from video have no recordings but have videos', () => {
    for (const id of ['ya-vklyuchayu-elektrichestvo', 'northern-sun', 'lyublyu-otdykhat', 'zaliv']) {
      expect(recordingsOf(graph, id), id).toEqual([]);
      const videos = transfersFor(graph, { collection: 'songs', id }).find((g) => g.collection === 'videos');
      expect(videos?.entities.length, id).toBeGreaterThan(0);
    }
  });

  it('every recording is on a release or in «Отдельные песни»', () => {
    for (const { id } of content.recordings) {
      const onRelease = releasesContaining(graph, id).length > 0;
      expect(onRelease || id.endsWith('--otdelnye'), id).toBe(true);
    }
  });

  it('every song, release and recording is connected to something', () => {
    const isolated = isolatedEntities(graph).filter((e) => ['songs', 'releases', 'recordings'].includes(e.collection));
    expect(isolated).toEqual([]);
  });
});

describe('transfersFor', () => {
  it('goes from a release straight to its songs, skipping the recording layer', () => {
    const groups = transfersFor(graph, { collection: 'releases', id: 'vne-vremeni' });
    expect(groups[0]?.collection).toBe('songs');
    expect(ids(groups[0]!.entities).sort()).toEqual(['bumazhnyi-korablik', 'otzvuki', 'vne-vremeni', 'vsem-znakomo']);
    expect(groups.some((g) => g.collection === 'recordings')).toBe(false);
    expect(groups.find((g) => g.collection === 'people')?.entities.map((e) => e.id)).toContain('dima-komarov');
  });

  it('goes from a song to every release it appears on, oldest first', () => {
    const releases = transfersFor(graph, { collection: 'songs', id: 'prikhodit-k-tebe' }).find((g) => g.collection === 'releases');
    expect(ids(releases!.entities)).toEqual(['raw-stuff-vol-5', 'eshchyo-odin-den-ep-2020']);
  });

  it('includes reverse links (a person sees the releases that credit them)', () => {
    const releases = transfersFor(graph, { collection: 'people', id: 'danil-manzhos' }).find((g) => g.collection === 'releases');
    expect(ids(releases!.entities)).toEqual(['33-shaga-37-minut', 'khoroshee-vremya']);
  });

  it('throws for an unknown entity', () => {
    expect(() => transfersFor(graph, { collection: 'songs', id: 'nope' })).toThrow(/unknown entity/);
  });
});

describe('chronology', () => {
  it('orders by recording date, starting with August 2016', () => {
    const items = chronology(graph, { by: 'recorded' });
    expect(items[0]?.date).toBe('2016-08');
    const dated = items.filter((i) => i.date !== undefined);
    expect(dated.at(-1)?.recording.id).toMatch(/--vne-vremeni$/);
    const firstUndated = items.findIndex((i) => i.date === undefined);
    expect(items.slice(firstUndated).every((i) => i.date === undefined)).toBe(true);
  });

  it('orders by first release date', () => {
    const items = chronology(graph, { by: 'released' });
    const voda = items.find((i) => i.recording.id === 'voda--3');
    expect(voda?.date).toBe('2016');
    const live = items.find((i) => i.recording.id === 'voda--raw-stuff-vol-5');
    expect(live?.date).toBe('2020-04-11');
  });
});

describe('timelinePoints', () => {
  it('merges events with derived release points in time order', () => {
    const points = timelinePoints(graph);
    expect(points[0]?.ref).toEqual({ collection: 'timeline', id: 'rozhdenie' });
    const vne = points.filter((p) => p.ref.id === 'vne-vremeni');
    expect(vne.map((p) => [p.rail, p.date])).toEqual([
      ['recorded', '2020-03'],
      ['released', '2020-04-21'],
    ]);
    const dates = points.map((p) => p.date);
    expect(dates).toEqual([...dates].sort((a, b) => a.localeCompare(b)));
  });
});
