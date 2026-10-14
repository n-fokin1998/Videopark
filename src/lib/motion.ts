/**
 * Motion helpers (D-005, .claude/rules/motion.md). Phase 2 needs no GSAP: the arrival is CSS keyframes driven by
 * classes. GSAP stays a dynamic import for later sequences (name-origin scene, timeline).
 * Safe to import during SSR: every browser API is guarded.
 */

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type DeviceHints = {
  deviceMemory?: number | undefined;
  hardwareConcurrency?: number | undefined;
  saveData?: boolean | undefined;
  reducedData?: boolean | undefined;
};

/** Low-end or data-saving devices get the lighter version of heavy effects (docs/design.md §6). */
export function isLowEndDevice(hints: DeviceHints): boolean {
  if (hints.saveData || hints.reducedData) return true;
  if (hints.deviceMemory !== undefined && hints.deviceMemory < 4) return true;
  if (hints.hardwareConcurrency !== undefined && hints.hardwareConcurrency < 4) return true;
  return false;
}

/** Device hints of the current browser (non-standard fields where available). */
export function currentDeviceHints(): DeviceHints {
  if (typeof navigator === 'undefined') return {};
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
    reducedData: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-data: reduce)').matches,
  };
}
