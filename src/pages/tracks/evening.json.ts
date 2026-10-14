/**
 * Candidates for «Трек вечера» as a static JSON file (`/tracks/evening.json`), fetched by the platform's island after
 * hydration — keeps ~40 tracks out of the platform HTML. Same order as the server-side pick (src/lib/content/catalog.ts).
 */
import type { APIRoute } from 'astro';
import { defaultLocale } from '~/i18n';
import { getEveningTracks } from '~/lib/content/catalog';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getEveningTracks(defaultLocale)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
