/**
 * When the silent arrival sequence plays (docs/information-architecture.md §5): only on a first visit that starts
 * at the platform, never under reduced motion. Deep links and returning visitors go straight to the platform state.
 * The inline pre-paint script in BaseLayout applies the same rule before first paint (it cannot import modules).
 */

/** localStorage flag: the visitor has arrived once (set after the arrival, or on any deep-link landing). */
export const ARRIVAL_STORAGE_KEY = 'vp:arrived';

export type ArrivalContext = {
  pathname: string;
  /** Platform paths for every enabled locale (`/`, later `/uk`, `/en`). */
  platformPaths: readonly string[];
  arrived: boolean;
  reducedMotion: boolean;
};

export function shouldShowArrival({ pathname, platformPaths, arrived, reducedMotion }: ArrivalContext): boolean {
  if (arrived || reducedMotion) return false;
  const path = pathname.replace(/\/index\.html$/, '/').replace(/(.)\/$/, '$1');
  return platformPaths.includes(path);
}
