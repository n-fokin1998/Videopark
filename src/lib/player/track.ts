/**
 * What the player knows about a recording (docs/architecture.md §5). Built at build time from content
 * (`src/lib/content/catalog.ts`), passed to islands as small serialisable objects and persisted with the queue.
 */

export type Track = {
  /** Recording id. */
  id: string;
  title: string;
  /** Release title (or «Отдельные песни»), shown under the title and in Media Session `album`. */
  album?: string | undefined;
  artist: string;
  /** Seconds, from content (`m:ss`); the audio element's own duration wins once known. */
  duration?: number | undefined;
  /** Self-hosted file (`/media/audio/<id>.m4a`), present only when `pnpm media` produced it. */
  src?: string | undefined;
  /** Waveform peaks JSON, fetched on demand. */
  peaks?: string | undefined;
  /** SoundCloud permalink, used through the Widget API when there is no local file. */
  soundcloud?: string | undefined;
  /** Where else to listen (Bandcamp, SoundCloud…); the fallback when nothing can be played here. */
  link?: { url: string; label: string } | undefined;
  /** Small cover image for the player and the lock screen. */
  artwork?: string | undefined;
  /** Page of the song or release, once those stations exist. */
  href?: string | undefined;
};

export type TrackSource =
  { kind: 'file'; src: string } | { kind: 'soundcloud'; url: string } | { kind: 'link'; url: string; label: string };

/** Resolver order (D-008): self-hosted file → SoundCloud widget → external link. `undefined` = nothing at all. */
export function resolveSource(track: Track): TrackSource | undefined {
  if (track.src) return { kind: 'file', src: track.src };
  if (track.soundcloud) return { kind: 'soundcloud', url: track.soundcloud };
  if (track.link) return { kind: 'link', ...track.link };
  return undefined;
}

/** Can the player itself produce sound for this track (as opposed to linking out)? */
export function isPlayable(track: Track): boolean {
  const source = resolveSource(track);
  return source?.kind === 'file' || source?.kind === 'soundcloud';
}

/** Content durations are `m:ss`; returns seconds or `undefined`. */
export function parseDuration(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Validate a value restored from storage (it may be stale or tampered with). */
export function isTrack(value: unknown): value is Track {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const optionalString = (key: string) => v[key] === undefined || typeof v[key] === 'string';
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.artist === 'string' &&
    ['album', 'src', 'peaks', 'soundcloud', 'artwork', 'href'].every(optionalString) &&
    (v.duration === undefined || typeof v.duration === 'number') &&
    (v.link === undefined ||
      (typeof v.link === 'object' &&
        v.link !== null &&
        typeof (v.link as Record<string, unknown>).url === 'string' &&
        typeof (v.link as Record<string, unknown>).label === 'string'))
  );
}
