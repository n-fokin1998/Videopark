/**
 * Content queries for pages (.claude/rules/astro.md «Content access»): sorting and rights filtering happen here,
 * not in pages. Astro-only (`astro:content`).
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Quote = CollectionEntry<'quotes'>;
export type Photo = CollectionEntry<'photos'>['data']['photos'][number];
export type AlbumPhoto = { album: string; photo: Photo };

/** Featured quotes in a stable order (the platform rotates through them daily). */
export async function getFeaturedQuotes(): Promise<Quote[]> {
  const quotes = await getCollection('quotes', (q) => q.data.featured);
  return quotes.sort((a, b) => a.id.localeCompare(b.id));
}

/** Photos the owner selected as featured (`content/photos/portraits/`), visible ones only, oldest album first. */
export async function getFeaturedPhotos(limit = Infinity): Promise<AlbumPhoto[]> {
  const albums = await getCollection('photos');
  return albums
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))
    .flatMap((album) =>
      album.data.photos
        .filter((photo) => photo.featured && photo.rights.status === 'cleared')
        .map((photo) => ({ album: album.id, photo })),
    )
    .slice(0, limit);
}
