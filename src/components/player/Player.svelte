<!-- Rendered only on the client (after hydration), so its CSS is injected by JS instead of blocking first paint. -->
<svelte:options css="injected" />

<script lang="ts">
  /**
   * The persistent player (D-003; docs/architecture.md §5, docs/design.md §5 «Player bar»).
   * Rendered once in BaseLayout with `client:load` + `transition:persist="player"`, so it survives navigation.
   * - Collapsed: a bottom bar (title, play/pause, next, thin progress) within thumb reach, above the safe area.
   * - Expanded: a native modal <dialog> — full-screen sheet on phones (swipe down to close), a side panel on desktop —
   *   with waveform/seek, timecodes, volume, «Звук», source attribution and the queue.
   * - Keyboard (registered once here): Space play/pause, N/P next/previous, ←/→ ±10 s while expanded.
   * Appears only after the first play (or when a saved queue exists — restored paused, never autoplaying).
   */
  import { onMount } from 'svelte';
  import { interpolate } from '~/i18n/format';
  import type { Dictionary } from '~/i18n/ui/ru';
  import { shortcutFor } from '~/lib/keyboard';
  import { formatTime } from '~/lib/player/time';
  import { $soundFx as soundFx, setSoundFx } from '~/stores/sound';
  import Icon from '~/components/ui/Icon.svelte';
  import { initPlayer, jump, next, previous, SEEK_STEP, seek, seekBy, setVolume, toggle } from './controller';
  import {
    $backendLabel as backendLabel,
    $current as current,
    $duration as duration,
    $expanded as expanded,
    $position as position,
    $queue as queue,
    $status as status,
    $volume as volume,
  } from './store';
  import Waveform from './Waveform.svelte';

  interface Props {
    labels: Dictionary['player'];
    soundLabel: string;
    opensInNewTab: string;
  }

  let { labels, soundLabel, opensInNewTab }: Props = $props();

  let mounted = $state(false);
  let barHeight = $state(0);
  let dialog = $state<HTMLDialogElement>();
  let sheet = $state<HTMLElement>();
  let dragOffset = $state(0);
  let downOnBackdrop = false;

  const isPlaying = $derived($status === 'playing' || $status === 'loading');
  const hasNext = $derived($queue.index < $queue.tracks.length - 1);
  const timeText = $derived(`${formatTime($position)} / ${formatTime($duration)}`);
  const progress = $derived($duration ? Math.min(1, $position / $duration) : 0);
  const playLabel = $derived(
    $current ? interpolate(isPlaying ? labels.pauseTrack : labels.playTrack, { title: $current.title }) : labels.play,
  );

  onMount(() => {
    initPlayer();
    mounted = true;

    const onKeydown = (event: KeyboardEvent) => {
      if (!current.get()) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const shortcut = shortcutFor(
        {
          code: event.code,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          repeat: event.repeat,
          defaultPrevented: event.defaultPrevented,
          target,
        },
        { seekEnabled: expanded.get() },
      );
      switch (shortcut) {
        case 'play-pause':
          event.preventDefault();
          toggle();
          break;
        case 'next':
          next();
          break;
        case 'previous':
          previous();
          break;
        case 'seek-back':
          event.preventDefault();
          seekBy(-SEEK_STEP);
          break;
        case 'seek-forward':
          event.preventDefault();
          seekBy(SEEK_STEP);
          break;
        case 'line-map':
        case undefined:
          break;
        default: {
          const never: never = shortcut;
          throw new Error(`player: unhandled shortcut ${String(never)}`);
        }
      }
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  });

  // `html[data-player]` reveals the «К плееру» skip link (navigation.ts carries it across page swaps).
  $effect(() => {
    const visible = mounted && $current !== undefined;
    if (visible) document.documentElement.dataset.player = 'on';
    else delete document.documentElement.dataset.player;
  });

  // Open/close the native dialog from the store, so other code (Esc, swipe, buttons) only touches $expanded.
  $effect(() => {
    if (!dialog) return;
    if ($expanded && !dialog.open) dialog.showModal();
    if (!$expanded && dialog.open) dialog.close();
  });

  function closeSheet() {
    expanded.set(false);
  }

  // Swipe down on the sheet's handle/header closes it (phones).
  let dragStart: number | undefined;

  function onpointerdown(event: PointerEvent) {
    if (event.pointerType === 'mouse') return;
    dragStart = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onpointermove(event: PointerEvent) {
    if (dragStart === undefined) return;
    dragOffset = Math.max(0, event.clientY - dragStart);
  }

  function onpointerup() {
    if (dragStart === undefined) return;
    const threshold = (sheet?.clientHeight ?? 600) * 0.2;
    if (dragOffset > threshold) closeSheet();
    dragStart = undefined;
    dragOffset = 0;
  }
</script>

{#if mounted && $current}
  <div class="spacer" style:block-size="{barHeight}px" aria-hidden="true"></div>

  <section id="player" class="player" aria-label={labels.region} tabindex="-1" bind:clientHeight={barHeight}>
    <div class="bar__progress" style:--progress={progress} aria-hidden="true"></div>
    <div class="bar">
      <button
        type="button"
        class="bar__info"
        aria-haspopup="dialog"
        aria-expanded={$expanded}
        onclick={() => expanded.set(true)}
      >
        {#if $current.artwork}
          <img class="bar__art" src={$current.artwork} alt="" width="44" height="44" loading="lazy" decoding="async" />
        {:else}
          <span class="bar__art bar__art--empty" aria-hidden="true"></span>
        {/if}
        <span class="bar__text">
          <span class="visually-hidden">{labels.expand}:</span>
          <span class="bar__title">{$current.title}</span>
          <span class="bar__album">
            {#if $status === 'error'}{labels.error}{:else if $status === 'loading'}{labels.loading}{:else}{$current.album ??
                $current.artist}{/if}
          </span>
        </span>
      </button>

      <span class="bar__time" aria-hidden="true">{timeText}</span>

      <div class="bar__controls">
        <button type="button" class="ctl ctl--wide-only" aria-label={labels.previous} onclick={() => previous()}>
          <Icon name="previous" />
        </button>
        <button type="button" class="ctl ctl--main" aria-label={playLabel} onclick={() => toggle()}>
          <Icon name={isPlaying ? 'pause' : 'play'} />
        </button>
        <button type="button" class="ctl" aria-label={labels.next} disabled={!hasNext} onclick={() => next()}>
          <Icon name="next" />
        </button>
        <button
          type="button"
          class="ctl ctl--wide-only"
          aria-label={labels.expand}
          aria-haspopup="dialog"
          aria-expanded={$expanded}
          onclick={() => expanded.set(true)}
        >
          <Icon name="expand" />
        </button>
      </div>
    </div>

    <dialog
      bind:this={dialog}
      class="sheet"
      aria-label={labels.sheet}
      onclose={closeSheet}
      onpointerdown={(event) => (downOnBackdrop = event.target === dialog)}
      onclick={(event) => {
        // Close on a click that both started and ended on the backdrop (not the tail of the tap that opened it).
        if (downOnBackdrop && event.target === dialog) closeSheet();
        downOnBackdrop = false;
      }}
    >
      <div class="sheet__inner" bind:this={sheet} style:translate="0 {dragOffset}px" class:is-dragging={dragOffset > 0}>
        <header class="sheet__head" {onpointerdown} {onpointermove} {onpointerup} onpointercancel={onpointerup}>
          <span class="sheet__grab" aria-hidden="true"></span>
          <p class="meta">{labels.nowPlaying}</p>
          <button type="button" class="ctl" aria-label={labels.collapse} onclick={closeSheet}>
            <Icon name="collapse" />
          </button>
        </header>

        <div class="sheet__now">
          {#if $current.artwork}
            <img class="sheet__art" src={$current.artwork} alt="" width="512" height="512" decoding="async" />
          {/if}
          <div class="sheet__titles">
            <h2 class="sheet__title">{$current.title}</h2>
            <p class="sheet__album">{$current.album ?? $current.artist}</p>
            {#if $backendLabel}
              <p class="meta">{interpolate(labels.source, { service: $backendLabel })}</p>
            {/if}
          </div>
        </div>

        {#if $status === 'error'}
          <p class="sheet__error" role="status">
            {labels.error}
            {#if $current.link}
              <a href={$current.link.url} target="_blank" rel="noopener">
                {$current.link.label}
                <span class="visually-hidden">{opensInNewTab}</span>
                <Icon name="external" size={16} />
              </a>
            {/if}
          </p>
        {/if}

        <div class="sheet__seek">
          <Waveform peaksUrl={$current.peaks} position={$position} duration={$duration} {labels} onseek={seek} />
          <p class="sheet__times meta" aria-hidden="true">
            <span>{formatTime($position)}</span>
            <span>{formatTime($duration)}</span>
          </p>
        </div>

        <div class="sheet__controls">
          <button type="button" class="ctl" aria-label={labels.previous} onclick={() => previous()}>
            <Icon name="previous" size={28} />
          </button>
          <button type="button" class="ctl ctl--main ctl--big" aria-label={playLabel} onclick={() => toggle()}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={32} />
          </button>
          <button type="button" class="ctl" aria-label={labels.next} disabled={!hasNext} onclick={() => next()}>
            <Icon name="next" size={28} />
          </button>
        </div>

        <div class="sheet__settings">
          <label class="sheet__volume">
            <span class="meta">{labels.volume}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={$volume}
              aria-valuetext="{Math.round($volume * 100)}%"
              oninput={(event) => setVolume(Number(event.currentTarget.value))}
            />
          </label>
          <button type="button" class="toggle" aria-pressed={$soundFx} onclick={() => setSoundFx(!soundFx.get())}>
            <Icon name={$soundFx ? 'soundOn' : 'soundOff'} size={20} />
            {soundLabel}
          </button>
        </div>

        {#if $queue.tracks.length > 1}
          <section class="sheet__queue" aria-labelledby="player-queue">
            <h3 id="player-queue" class="meta">{labels.queue}</h3>
            <ol role="list">
              {#each $queue.tracks as track, i (track.id)}
                <li>
                  <button
                    type="button"
                    class="queue__item"
                    aria-current={i === $queue.index ? 'true' : undefined}
                    onclick={() => (i === $queue.index ? toggle() : jump(i))}
                  >
                    <span class="queue__title">{track.title}</span>
                    <span class="queue__meta meta">{formatTime(track.duration)}</span>
                  </button>
                </li>
              {/each}
            </ol>
          </section>
        {/if}
      </div>
    </dialog>
  </section>
{/if}

<style>
  @layer components {
    .spacer {
      flex: none;
    }

    .player {
      position: fixed;
      inset-inline: 0;
      inset-block-end: 0;
      z-index: var(--z-player);
      padding-block-end: env(safe-area-inset-bottom);
      background: color-mix(in srgb, var(--bg-raised) 88%, transparent);
      backdrop-filter: blur(12px);
      border-block-start: var(--border-thin) solid var(--border);
      container: player / inline-size;
      view-transition-name: player;
    }

    .player:focus {
      outline: none;
    }

    .player:focus-visible {
      outline: 2px solid var(--focus);
      outline-offset: -2px;
    }

    .bar__progress {
      block-size: 2px;
      background: linear-gradient(
        to right,
        var(--accent) calc(var(--progress, 0) * 100%),
        transparent calc(var(--progress, 0) * 100%)
      );
    }

    .bar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--space-2xs);
      max-inline-size: var(--content-wide);
      margin-inline: auto;
      padding-block: var(--space-3xs);
      padding-inline: max(var(--space-2xs), env(safe-area-inset-left)) max(var(--space-2xs), env(safe-area-inset-right));
    }

    .bar__info {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      min-inline-size: 0;
      min-block-size: var(--hit-target);
      padding: var(--space-3xs);
      border: 0;
      border-radius: var(--radius-m);
      background: none;
      color: var(--fg);
      text-align: start;
      cursor: pointer;
    }

    .bar__art {
      inline-size: var(--hit-target);
      block-size: var(--hit-target);
      flex: none;
      border-radius: var(--radius-s);
      object-fit: cover;
    }

    .bar__art--empty {
      background: linear-gradient(135deg, var(--sky-top), var(--line));
    }

    .bar__text {
      display: grid;
      min-inline-size: 0;
    }

    .bar__title,
    .bar__album {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .bar__title {
      font-size: var(--fs-ui);
      font-weight: 600;
    }

    .bar__album {
      font-size: var(--fs-meta);
      color: var(--fg-muted);
    }

    .bar__time {
      display: none;
      font-family: var(--font-tape);
      font-size: var(--fs-meta);
      color: var(--fg-muted);
      font-variant-numeric: tabular-nums;
    }

    .bar__controls {
      display: flex;
      align-items: center;
      gap: var(--space-2xs);
    }

    .ctl {
      display: inline-grid;
      place-items: center;
      inline-size: var(--hit-target);
      block-size: var(--hit-target);
      padding: 0;
      border: 0;
      border-radius: var(--radius-round);
      background: none;
      color: var(--fg);
      cursor: pointer;
      transition: background-color var(--dur-instant) var(--ease-out);
    }

    .ctl:hover:not(:disabled) {
      background: color-mix(in srgb, var(--fg) 10%, transparent);
    }

    .ctl:disabled {
      color: var(--fg-muted);
      opacity: 0.6;
      cursor: default;
    }

    .ctl--main {
      background: var(--accent);
      color: var(--bg);
    }

    .ctl--main:hover:not(:disabled) {
      background: color-mix(in srgb, var(--accent) 85%, var(--fg));
    }

    .ctl--big {
      inline-size: calc(var(--hit-target) * 1.5);
      block-size: calc(var(--hit-target) * 1.5);
    }

    .ctl--wide-only {
      display: none;
    }

    @container player (width >= 40rem) {
      .bar {
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: var(--space-m);
        padding-inline: var(--gutter);
      }

      .bar__time,
      .ctl--wide-only {
        display: inline-grid;
      }
    }

    /* ── The sheet ─────────────────────────────────────────────── */

    .sheet {
      inline-size: 100%;
      max-inline-size: 100%;
      block-size: 100dvh;
      max-block-size: 100dvh;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--fg);
      overflow: hidden;
    }

    .sheet::backdrop {
      background: color-mix(in srgb, var(--bg) 70%, transparent);
      backdrop-filter: blur(4px);
    }

    .sheet__inner {
      display: grid;
      align-content: start;
      gap: var(--space-m);
      block-size: 100%;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-block: max(var(--space-s), env(safe-area-inset-top)) max(var(--space-l), env(safe-area-inset-bottom));
      padding-inline: max(var(--gutter), env(safe-area-inset-left)) max(var(--gutter), env(safe-area-inset-right));
      background: linear-gradient(to bottom, var(--sky-top), var(--bg) 60%);
      transition: translate var(--dur-short) var(--ease-out);
    }

    .sheet__inner.is-dragging {
      transition: none;
    }

    .sheet[open] .sheet__inner {
      animation: sheet-in var(--dur-medium) var(--ease-out);
    }

    @keyframes sheet-in {
      from {
        transform: translateY(8%);
        opacity: 0;
      }
    }

    .sheet__head {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block-start: var(--space-2xs);
      touch-action: none;
    }

    .sheet__grab {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 50%;
      inline-size: var(--space-xl);
      block-size: var(--space-3xs);
      border-radius: var(--radius-round);
      background: var(--fg-muted);
      transform: translateX(-50%);
    }

    .sheet__now {
      display: grid;
      gap: var(--space-m);
      justify-items: center;
      text-align: center;
    }

    .sheet__art {
      inline-size: min(100%, 18rem);
      aspect-ratio: 1;
      block-size: auto;
      border-radius: var(--radius-m);
      object-fit: cover;
      box-shadow: 0 var(--space-s) var(--space-xl) var(--shadow);
    }

    .sheet__titles {
      display: grid;
      gap: var(--space-3xs);
    }

    .sheet__title {
      font-size: var(--fs-h2);
    }

    .sheet__album {
      color: var(--fg-muted);
    }

    .sheet__error {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2xs) var(--space-s);
      color: var(--fg);
    }

    .sheet__error a {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3xs);
      min-block-size: var(--hit-target);
    }

    .sheet__times {
      display: flex;
      justify-content: space-between;
      font-variant-numeric: tabular-nums;
    }

    .sheet__controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--space-l);
    }

    .sheet__settings {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-s);
    }

    .sheet__volume {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      min-block-size: var(--hit-target);
    }

    .sheet__volume input {
      inline-size: 9rem;
      accent-color: var(--accent);
    }

    /* Phones and tablets with touch: hardware volume buttons, and iOS ignores `volume`. */
    @media (pointer: coarse) {
      .sheet__volume {
        display: none;
      }
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2xs);
      min-block-size: var(--hit-target);
      padding-inline: var(--space-s);
      border: var(--border-thin) solid var(--border);
      border-radius: var(--radius-round);
      background: none;
      color: var(--fg-muted);
      cursor: pointer;
    }

    .toggle[aria-pressed='true'] {
      border-color: var(--accent);
      color: var(--fg);
    }

    .sheet__queue {
      display: grid;
      gap: var(--space-2xs);
    }

    .sheet__queue ol {
      display: grid;
    }

    .queue__item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-s);
      inline-size: 100%;
      min-block-size: var(--hit-target);
      padding-inline: var(--space-2xs);
      border: 0;
      border-radius: var(--radius-m);
      background: none;
      color: var(--fg);
      text-align: start;
      cursor: pointer;
    }

    .queue__item:hover {
      background: color-mix(in srgb, var(--fg) 8%, transparent);
    }

    .queue__item[aria-current='true'] {
      color: var(--accent);
      font-weight: 600;
    }

    /* Desktop: a panel above the bar instead of a full-screen sheet. */
    @media (width >= 960px) {
      .sheet {
        inline-size: min(34rem, calc(100% - 2 * var(--gutter)));
        block-size: fit-content;
        max-block-size: min(85dvh, 52rem);
        margin: auto var(--gutter) var(--space-l) auto;
        border-radius: var(--radius-l);
        box-shadow: 0 var(--space-m) var(--space-2xl) var(--shadow);
      }

      .sheet__inner {
        block-size: auto;
        max-block-size: inherit;
        padding: var(--space-m);
        background: var(--bg-raised);
        border: var(--border-thin) solid var(--border);
        border-radius: inherit;
      }

      .sheet__grab {
        display: none;
      }

      .sheet__now {
        grid-template-columns: 8rem minmax(0, 1fr);
        justify-items: start;
        align-items: center;
        text-align: start;
      }
    }

    @media (forced-colors: active) {
      .player {
        border-block-start-color: CanvasText;
      }

      .ctl--main {
        border: var(--border-thin) solid ButtonText;
      }
    }
  }
</style>
