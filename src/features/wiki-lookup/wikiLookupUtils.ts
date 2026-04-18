import type { WikiLookupDocument } from "../../lib/wiki/lookup";

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
  return sections.map((s) => ({
    id: s.id,
    text: s.title,
    level: 2 as const,
  }));
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
