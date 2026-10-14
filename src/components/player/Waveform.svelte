<!-- Rendered only on the client (after hydration), so its CSS is injected by JS instead of blocking first paint. -->
<svelte:options css="injected" />

<script lang="ts">
  /**
   * Waveform + seek slider (docs/design.md §5 «Player bar»): precomputed peaks drawn in `--fg-muted`, the played part
   * in `--accent`. Peaks are fetched on demand; without them (SoundCloud, missing file) a neutral progress line is drawn.
   * The slider is a real `<input type="range">` with a text value («1:12 из 2:37») — the drawing is decorative.
   */
  import { interpolate } from '~/i18n/format';
  import type { Dictionary } from '~/i18n/ui/ru';
  import { formatTime } from '~/lib/player/time';
  import { cachedPeaks } from './peaks';

  interface Props {
    peaksUrl?: string | undefined;
    position: number;
    duration: number | undefined;
    labels: Pick<Dictionary['player'], 'seek' | 'position'>;
    onseek: (seconds: number) => void;
    bars?: number;
  }

  let { peaksUrl, position, duration, labels, onseek, bars = 120 }: Props = $props();

  const uid = $props.id();
  let peaks = $state<number[] | undefined>(undefined);

  $effect(() => {
    const url = peaksUrl;
    peaks = undefined;
    if (!url) return;
    let current = true;
    void cachedPeaks(url, bars).then((values) => {
      if (current) peaks = values;
    });
    return () => {
      current = false;
    };
  });

  const max = $derived(duration && duration > 0 ? duration : 0);
  const progress = $derived(max > 0 ? Math.min(1, position / max) : 0);
  const valueText = $derived(
    interpolate(labels.position, { position: formatTime(position), duration: formatTime(duration) }),
  );
  const barWidth = $derived(peaks && peaks.length > 0 ? 100 / peaks.length : 0);
</script>

<div class="wave" style:--progress={progress}>
  <svg class="wave__art" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {#if peaks && peaks.length > 0}
      <defs>
        <clipPath id={`${uid}-played`}>
          <rect x="0" y="0" width={progress * 100} height="40" />
        </clipPath>
      </defs>
      <g class="wave__bars">
        {#each peaks as peak, i (i)}
          <rect
            x={i * barWidth + barWidth * 0.2}
            y={20 - Math.max(0.6, peak * 18)}
            width={barWidth * 0.6}
            height={Math.max(1.2, peak * 36)}
          />
        {/each}
      </g>
      <g class="wave__bars wave__bars--played" clip-path={`url(#${uid}-played)`}>
        {#each peaks as peak, i (i)}
          <rect
            x={i * barWidth + barWidth * 0.2}
            y={20 - Math.max(0.6, peak * 18)}
            width={barWidth * 0.6}
            height={Math.max(1.2, peak * 36)}
          />
        {/each}
      </g>
    {:else}
      <rect class="wave__track" x="0" y="19" width="100" height="2" />
      <rect class="wave__played" x="0" y="19" width={progress * 100} height="2" />
    {/if}
  </svg>
  <input
    class="wave__input"
    type="range"
    min="0"
    max={max || 1}
    step="1"
    value={Math.floor(position)}
    disabled={max === 0}
    aria-label={labels.seek}
    aria-valuetext={valueText}
    oninput={(event) => onseek(Number(event.currentTarget.value))}
  />
</div>

<style>
  @layer components {
    .wave {
      position: relative;
      block-size: calc(var(--hit-target) * 1.25);
    }

    .wave__art {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
    }

    .wave__bars rect,
    .wave__track {
      fill: var(--fg-muted);
      opacity: 0.55;
    }

    .wave__bars--played rect,
    .wave__played {
      fill: var(--accent);
      opacity: 1;
    }

    /* The real control sits on top, transparent, so it gets pointer, touch and keyboard input. */
    .wave__input {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      margin: 0;
      opacity: 0;
      cursor: pointer;
    }

    .wave__input:disabled {
      cursor: default;
    }

    .wave:has(.wave__input:focus-visible) {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
      border-radius: var(--radius-s);
    }

    @media (forced-colors: active) {
      .wave__bars--played rect,
      .wave__played {
        fill: Highlight;
      }
    }
  }
</style>
