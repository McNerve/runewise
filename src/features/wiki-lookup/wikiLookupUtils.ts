import type { WikiLookupDocument } from "../../lib/wiki/lookup";

/** Sections that default to collapsed in wiki/boss article views. */
export const COLLAPSED_SECTIONS = [
  "used in recommended equipment",
  "item sources",
  "products",
  "gallery",
  "drop sources",
  "spawns",
  // Combat stats stay open — they are the reason you opened an item page.
  "changes",
  "sound effects",
  "trivia",
  "update history",
  "history",
  "creation",
  "shop locations",
  "item sources",
  "treasure trails",
  "products",
];

/** Strip /Strategies (and similar) so wiki titles map to boss workspace names. */
export function stripWikiStrategySuffix(title: string): string {
  return title
    .replace(/\/strategies$/i, "")
    .replace(/\/challenge mode\/strategies$/i, "")
    .replace(/\/challenge mode$/i, "")
    .trim();
}

export function isWikiStrategyTitle(title: string): boolean {
  return /\/strategies$/i.test(title) || /strategies$/i.test(title);
}

export function shouldCollapseSection(title: string): boolean {
  const lower = title.toLowerCase();
  return COLLAPSED_SECTIONS.some((s) => lower.includes(s));
}

/**
 * Shared section class names for wiki HTML blocks (boss guides + wiki lookup).
 * Keeps loadout/requirements styling in one place.
 */
export function sectionContentClasses(title: string): string {
  const lower = title.toLowerCase();
  if (
    lower.includes("suggested skills") ||
    lower.includes("recommended skills") ||
    lower.includes("requirements")
  ) {
    return "article-content--structured article-content--requirements";
  }
  if (
    lower.includes("equipment") ||
    lower.includes("inventory") ||
    lower.includes("gear")
  ) {
    return "article-content--structured article-content--loadout article-content--loadout-table";
  }
  return "";
}

// Task 4: Date pill filter
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function isDatePill(title: string): boolean {
  if (title.length <= 2) return true;
  if (/^\d{4}$/.test(title)) return true;
  if (MONTH_NAMES.includes(title)) return true;
  if (/^\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)$/.test(title)) return true;
  if (/^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/.test(title)) return true;
  return false;
}

// Task 5: TOC heading extraction
export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractTocEntries(sections: WikiLookupDocument["sections"]): TocEntry[] {
  return sections.flatMap((s): TocEntry[] => [
    { id: s.id, text: s.title, level: 2 },
    ...(s.subsections ?? []).map(
      (sub): TocEntry => ({ id: sub.id, text: sub.title, level: 3 })
    ),
  ]);
}

// Task 6: Upgrade snapshot image URL
export function upgradeImageUrl(url: string | null): string | null {
  if (!url) return null;
  // Pattern: /thumb/hash/name/NNpx-name.ext  →  swap NNpx with 300px
  const thumbMatch = url.match(/^(.*\/thumb\/.+\/)(\d+)px-(.+)$/);
  if (thumbMatch) {
    return `${thumbMatch[1]}300px-${thumbMatch[3]}`;
  }
  return url;
}
