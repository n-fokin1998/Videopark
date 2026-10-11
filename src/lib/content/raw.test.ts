import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadContent, readContent } from './raw';

const roots: string[] = [];

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'videopark-content-'));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, 'content', path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('readContent', () => {
  it('reads markdown, yaml, year lists and albums with string references', () => {
    const root = fixture({
      'songs/voda.md': '---\r\ntitle: Вода\r\nlyricsStatus: complete\r\n---\r\n\r\nстрока\r\n',
      'recordings/voda--3.yaml': 'song: voda\nversion: studio\nduration: "3:16"\n',
      'timeline/2016.yaml': '- id: osnovanie\n  date: "2016"\n  rail: life\n  title: { ru: Начало }\n',
      'photos/2016/album.yaml': 'title: { ru: "2016" }\nsource: band\nphotos:\n  - file: ./a.jpg\n    alt: Фото\n    credit: { role: фото, name: Архив }\n',
    });
    const { content, issues } = readContent(root);
    expect(issues).toEqual([]);
    expect(content.songs[0]).toMatchObject({ id: 'voda', body: '\nстрока\n', filePath: 'content/songs/voda.md' });
    expect(content.songs[0]?.data.themes).toEqual([]);
    expect(content.recordings[0]?.data).toMatchObject({ song: 'voda', certainty: 'confirmed' });
    expect(content.timeline[0]?.id).toBe('osnovanie');
    expect(content.photos[0]).toMatchObject({ id: '2016' });
    expect(content.photos[0]?.data.photos[0]?.file).toBe('./a.jpg');
  });

  it('reports schema problems with entry and field', () => {
    const root = fixture({
      'recordings/broken.yaml': 'version: studio\n',
      'releases/x.md': '---\ntitle: X\ntype: ep\nreleased: "2019-02-30"\nera: e\n---\n',
    });
    const { content, issues } = readContent(root);
    expect(content.recordings).toEqual([]);
    expect(issues.map((i) => `${i.collection}/${i.id} ${i.message}`)).toEqual([
      expect.stringMatching(/^releases\/x released: expected a partial date/),
      expect.stringMatching(/^recordings\/broken song: song is required/),
    ]);
    expect(() => loadContent(root)).toThrow(/2 invalid entries/);
  });

  it('rejects Instagram links that still carry tracking parameters', () => {
    const root = fixture({
      'instagram/posts.yaml': '- id: a\n  permalink: https://www.instagram.com/p/abc/?utm_source=x\n',
    });
    expect(readContent(root).issues[0]?.message).toMatch(/tracking/);
  });
});
