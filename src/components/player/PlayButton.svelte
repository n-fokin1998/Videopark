<script lang="ts">
  /**
   * A play button anywhere on the site (docs/architecture.md §4: `client:visible`). Plays `tracks` from `start`
   * through the shared player, or toggles when that track is already the current one.
   * Render it only for playable tracks — unplayable ones get an external link instead (never a dead button).
   */
  import { interpolate } from '~/i18n/format';
  import type { Dictionary } from '~/i18n/ui/ru';
  import type { Track } from '~/lib/player/track';
  import Icon from '~/components/ui/Icon.svelte';
  import { playTracks, toggle } from './controller';
  import { $current as current, $status as status } from './store';

  interface Props {
    tracks: Track[];
    start?: number;
    labels: Pick<Dictionary['player'], 'playTrack' | 'pauseTrack'>;
    /** `lamp`: the large glowing button of the track of the evening. */
    variant?: 'default' | 'lamp';
  }

  let { tracks, start = 0, labels, variant = 'default' }: Props = $props();

  const track = $derived(tracks[start]);
  const isCurrent = $derived(track !== undefined && $current?.id === track.id);
  const isPlaying = $derived(isCurrent && ($status === 'playing' || $status === 'loading'));
  const label = $derived(
    track ? interpolate(isPlaying ? labels.pauseTrack : labels.playTrack, { title: track.title }) : '',
  );

  function onclick() {
    if (isCurrent) toggle();
    else playTracks(tracks, start);
  }
</script>

{#if track}
  <button
    type="button"
    class="play"
    class:lamp={variant === 'lamp'}
    class:is-playing={isPlaying}
    aria-label={label}
    {onclick}
  >
    <Icon name={isPlaying ? 'pause' : 'play'} size={variant === 'lamp' ? 32 : 24} />
  </button>
{/if}

<style>
  @layer components {
    .play {
      display: inline-grid;
      place-items: center;
      inline-size: var(--hit-target);
      block-size: var(--hit-target);
      padding: 0;
      border: var(--border-thin) solid var(--border);
      border-radius: var(--radius-round);
      background: var(--bg-raised);
      color: var(--fg);
      cursor: pointer;
      transition:
        background-color var(--dur-instant) var(--ease-out),
        color var(--dur-instant) var(--ease-out),
        transform var(--dur-instant) var(--ease-out);
    }

    .play:hover,
    .play.is-playing {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--bg);
    }

    .play:active {
      transform: scale(0.96);
    }

    /* The «lamp»: a soft amber glow behind the button of the track of the evening. */
    .lamp {
      position: relative;
      inline-size: calc(var(--hit-target) * 1.6);
      block-size: calc(var(--hit-target) * 1.6);
      background: var(--accent);
      border-color: var(--accent);
      color: var(--bg);
      box-shadow: 0 0 var(--space-l) color-mix(in srgb, var(--accent) 45%, transparent);
    }

    .lamp:hover {
      box-shadow: 0 0 var(--space-xl) color-mix(in srgb, var(--accent) 60%, transparent);
    }

    @media (forced-colors: active) {
      .play {
        border-color: ButtonText;
      }
    }
  }
</style>
