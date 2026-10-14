<script lang="ts">
  /** Decorative line icon (always `aria-hidden`; the control around it carries the label). */
  import { icons, type IconDef, type IconName } from './icons';

  interface Props {
    name: IconName;
    size?: number;
  }

  let { name, size = 24 }: Props = $props();
  const icon: IconDef = $derived(icons[name]);
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  aria-hidden="true"
  focusable="false"
  fill={icon.filled ? 'currentColor' : 'none'}
  stroke={icon.filled ? 'none' : 'currentColor'}
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#each icon.paths as d (d)}
    <path {d} />
  {/each}
</svg>

<style>
  .icon {
    flex: none;
  }
</style>
