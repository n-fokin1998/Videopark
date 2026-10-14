<script lang="ts">
  /**
   * «Трек вечера» on the platform (docs/vision.md §7.14): one song a day, deterministic by the visitor's local date.
   * The server renders the pick for the build date; after hydration the island picks for the visitor's date and,
   * only if that is a different track, fetches the candidate list (`/tracks/evening.json`, same order) — so the
   * platform HTML carries one track, not forty. Never plays by itself — only the lamp button starts the music.
   */
  import { onMount } from 'svelte';
  import type { Dictionary } from '~/i18n/ui/ru';
  import { localDateKey, pickIndexForDate } from '~/lib/evening';
  import { formatTime } from '~/lib/player/time';
  import { isTrack, type Track } from '~/lib/player/track';
  import PlayButton from './PlayButton.svelte';

  interface Props {
    /** The pick for the build date (SSR / no-JS) and its index among the candidates. */
    initial: Track;
    initialIndex: number;
    count: number;
    /** URL of the candidate list. */
    source: string;
    labels: Pick<Dictionary['player'], 'eveningLabel' | 'eveningNote' | 'playTrack' | 'pauseTrack'>;
  }

  let { initial, initialIndex, count, source, labels }: Props = $props();
  let picked = $state<Track | undefined>(undefined);
  const track = $derived(picked ?? initial);

  onMount(() => {
    const index = pickIndexForDate(localDateKey(new Date()), count, 'track');
    if (index === initialIndex) return;
    const controller = new AbortController();
    fetch(source, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((tracks: unknown) => {
        const candidate = Array.isArray(tracks) && tracks.length === count ? tracks[index] : undefined;
        if (isTrack(candidate)) picked = candidate;
      })
      .catch(() => {
        /* offline or stale build: keep the server's pick */
      });
    return () => controller.abort();
  });
</script>

{#if track}
  <div class="evening">
    <div class="evening__text">
      <p class="meta">{labels.eveningLabel}</p>
      <p class="evening__title">{track.title}</p>
      <p class="evening__album">
        {track.album}
        {#if track.duration}<span class="evening__time">· {formatTime(track.duration)}</span>{/if}
      </p>
      <p class="evening__note">{labels.eveningNote}</p>
    </div>
    <div class="evening__lamp">
      <PlayButton tracks={[track]} {labels} variant="lamp" />
    </div>
  </div>
{/if}

<style>
  @layer components {
    .evening {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--space-m);
    }

    .evening__text {
      display: grid;
      gap: var(--space-3xs);
    }

    .evening__title {
      font-size: var(--fs-h2);
      font-weight: 600;
      line-height: var(--lh-heading);
      /* Reserve two lines so the client-side pick does not shift the layout. */
      min-block-size: calc(2em * var(--lh-heading));
      display: flex;
      align-items: end;
      text-wrap: balance;
    }

    .evening__album {
      color: var(--fg-muted);
    }

    .evening__time {
      font-family: var(--font-tape);
      font-size: var(--fs-meta);
    }

    .evening__note {
      margin-block-start: var(--space-2xs);
      font-family: var(--font-poem);
      font-style: italic;
      color: var(--fg-muted);
    }

    .evening__lamp {
      padding: var(--space-s);
    }
  }
</style>
