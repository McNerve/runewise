/**
 * Global item icon resolver.
 * Uses GE mapping icon filenames (accurate) with itemIcon() fallback (name-based guess).
 * Call initItemIconCache() once at app startup to populate.
 */

import { fetchMapping } from "./api/ge";
import { setIconCache } from "./sprites";

let iconMap: Map<string, string> | null = null;
let initPromise: Promise<void> | null = null;

/** Call once at app startup to populate the icon cache from GE mapping. */
export function initItemIconCache(): Promise<void> {
  if (iconMap) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = fetchMapping()
    .then((items) => {
      iconMap = new Map();
      for (const item of items) {
        if (item.icon) iconMap.set(item.name.toLowerCase(), item.icon);
      }
      // Wire into sprites.ts so itemIcon() uses this cache globally
      setIconCache(iconMap);
    })
    .catch(() => {
      iconMap = new Map();
    });
  return initPromise;
}
