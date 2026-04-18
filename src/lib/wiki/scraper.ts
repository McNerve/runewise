/**
 * Pure parsing utilities extracted from StructuredSection.tsx so they can be
 * unit-tested independently.  StructuredSection imports from here.
 */

export const INVALID_LOADOUT_LABELS = [
  "n/a",
  "see ranged",
  "see melee",
  "see magic",
  "see mage",
  "see inventory",
  "see equipment",
  "ranged",
  "melee",
  "magic",
  "mage",
] as const;

export type InvalidLoadoutLabel = (typeof INVALID_LOADOUT_LABELS)[number];

export interface EquipmentEntry {
  type: "item" | "see-section";
  icon: string | null;
  text: string;
  sectionRef?: string;
}

export interface LoadoutRow {
  slot: { icon: string | null; text: string };
  options: EquipmentEntry[];
}

/** Recognisable OSRS skill names (canonical capitalisation). */
export const OSRS_SKILLS = [
  "Attack",
  "Strength",
  "Defence",
  "Ranged",
  "Prayer",
  "Magic",
  "Runecraft",
  "Hitpoints",
  "Crafting",
  "Mining",
  "Smithing",
  "Fishing",
  "Cooking",
  "Firemaking",
  "Woodcutting",
  "Agility",
  "Herblore",
  "Thieving",
  "Fletching",
  "Slayer",
  "Farming",
  "Construction",
  "Hunter",
  "Sailing",
] as const;

export type OsrsSkill = (typeof OSRS_SKILLS)[number];

/** Keyword → skill mappings for method/qualifier phrases. */
const KEYWORD_SKILL_MAP: Array<[RegExp, OsrsSkill]> = [
  [/\branged method\b|\bbow\b|\bcrossbow\b/i, "Ranged"],
  [/\bmelee method\b|\bscimitar\b|\bhalberd\b/i, "Attack"],
  [/\bmage\b|\bmagic method\b/i, "Magic"],
  [/\bpiety\b|\brigour\b|\baugury\b/i, "Prayer"],
  [/\bornate rejuvenation pool\b/i, "Construction"],
  [/\bsalve amulet\b/i, "Slayer"],
];

export interface SuggestedSkill {
  skill: OsrsSkill;
  level: number | null;
  qualifier: string | null;
}

export interface SuggestedSkillFallback {
  fallback: string;
  icon: string | null;
}

export type SuggestedSkillResult = SuggestedSkill | SuggestedSkillFallback;

export function isSuggestedSkillFallback(
  result: SuggestedSkillResult
): result is SuggestedSkillFallback {
  return "fallback" in result;
}

// ---------------------------------------------------------------------------
// Text normalisation helpers
// ---------------------------------------------------------------------------

export function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[•◦▪▸►●○◆◇‣⁃\-–—]\s*/, "")
    .trim();
}

function isInvalidLabel(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return INVALID_LOADOUT_LABELS.includes(normalized as InvalidLoadoutLabel);
}

/**
 * Split a raw text string on ` / ` separators (with at least one space on
 * each side, or at string start/end).  Returns one or more trimmed parts,
 * with empty strings removed.
 *
 * Handles edge cases:
 *   "A / B"           → ["A", "B"]
 *   "A /"             → ["A"]       (trailing slash, missing second item)
 *   "/ B"             → ["B"]       (leading slash, missing first item)
 *   "A/B" (no spaces) → ["A/B"]     (don't split — could be part of a URL)
 */
export function splitOnSlash(text: string): string[] {
  // Normalise: strip any standalone leading or trailing slash before splitting
  const normalised = text
    .replace(/^\s*\/\s*/, "")   // leading "/ " or "/"
    .replace(/\s*\/\s*$/, "");  // trailing " /" or "/"

  // Now split on " / " (both spaces required to avoid URL segments)
  return normalised
    .split(" / ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

// ---------------------------------------------------------------------------
// Equipment cell parsing
// ---------------------------------------------------------------------------

/**
 * Parse all equipment entries from a single table cell.
 *
 * Priority:
 * 1. Cells with `<a>` links → use link text + sibling/child image.
 *    Each linked text is further split on ` / ` so "A / B" inside one link
 *    becomes two distinct entries.
 * 2. Fallback: plain text split on common separators (bullet, pipe, "or", " / ").
 *
 * In both paths:
 * - Entries whose text matches INVALID_LOADOUT_LABELS are dropped.
 * - "See X" entries are returned with type: 'see-section'.
 */
export function parseEquipmentCellEntries(cell: Element): EquipmentEntry[] {
  const entries: EquipmentEntry[] = [];

  const links = Array.from(cell.querySelectorAll("a"));

  if (links.length > 0) {
    const seen = new Set<string>();

    for (const link of links) {
      const rawText = normalizeText(link.textContent ?? "");
      if (!rawText) continue;

      const imgSrc =
        link.querySelector("img")?.getAttribute("src") ??
        (link.previousElementSibling?.tagName === "IMG"
          ? link.previousElementSibling.getAttribute("src")
          : null) ??
        null;

      // Split on " / " within the link text (e.g. "Masori mask (f) / Void ranger helm")
      const parts = splitOnSlash(rawText);

      for (let i = 0; i < parts.length; i++) {
        const text = parts[i];
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        if (isInvalidLabel(text)) continue;

        const seeSectionMatch = text.match(/^see\s+(.+)/i);
        if (seeSectionMatch) {
          entries.push({ type: "see-section", icon: imgSrc, text, sectionRef: seeSectionMatch[1].trim() });
        } else {
          // Only the first split part gets the image; subsequent parts share it if it's the only one
          entries.push({ type: "item", icon: i === 0 ? imgSrc : null, text });
        }
      }
    }

    return entries;
  }

  // Fallback: extract from plain text
  const images = Array.from(cell.querySelectorAll("img")).map(
    (img) => img.getAttribute("src") ?? null
  );

  const raw = cell.textContent ?? "";
  const parts = raw
    .replace(/\s*[>•|]\s*/g, "\n")
    .replace(/\s+or\s+/gi, "\n")
    .replace(/\s+\/\s+/g, "\n")
    .split("\n")
    .map((part) => normalizeText(part))
    .filter((part) => part.length > 0);

  const seen = new Set<string>();
  for (let i = 0; i < parts.length; i++) {
    const text = parts[i];
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (isInvalidLabel(text)) continue;

    const seeSectionMatch = text.match(/^see\s+(.+)/i);
    if (seeSectionMatch) {
      entries.push({
        type: "see-section",
        icon: images[i] ?? images[0] ?? null,
        text,
        sectionRef: seeSectionMatch[1].trim(),
      });
    } else {
      entries.push({ type: "item", icon: images[i] ?? images[0] ?? null, text });
    }
  }

  return entries;
}

function extractSlotLabel(cell: Element): string {
  const image = cell.querySelector("img");
  const fromImage =
    image?.getAttribute("alt") ||
    image?.getAttribute("title") ||
    image?.closest("a")?.getAttribute("title") ||
    "";

  const fromText = normalizeText(cell.textContent ?? "");
  const raw = fromText || fromImage;
  return (
    raw
      .replace(/_+/g, " ")
      .replace(/\bslot\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "Slot"
  );
}

export function parseLoadoutRowsWithEntries(doc: Document): LoadoutRow[] {
  const rows = Array.from(doc.querySelectorAll("table tr")).slice(1);

  return rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 2) return null;

      const slot = {
        icon: cells[0].querySelector("img")?.getAttribute("src") ?? null,
        text: extractSlotLabel(cells[0]),
      };

      const options = cells
        .slice(1)
        .flatMap((cell) => parseEquipmentCellEntries(cell));

      if (options.length === 0) return null;
      return { slot, options };
    })
    .filter((row): row is LoadoutRow => row !== null);
}

// ---------------------------------------------------------------------------
// Suggested skill parsing
// ---------------------------------------------------------------------------

/**
 * Parse a single suggested-skill prose string (e.g. from a `<li>` in the
 * Suggested Skills section) into a structured result.
 *
 * Returns SuggestedSkill when a recognisable skill name can be resolved.
 * Returns SuggestedSkillFallback when it cannot — callers should render the
 * fallback text directly rather than show "Unknown".
 */
export function parseSuggestedSkill(
  text: string,
  icon: string | null = null
): SuggestedSkillResult {
  const normalized = normalizeText(text);

  // Extract level: "85+" / "level 85" / "85" near start
  const levelMatch = normalized.match(/\b(\d{1,3})\+?/);
  const level = levelMatch ? parseInt(levelMatch[1], 10) : null;

  // Try direct skill name match (case-insensitive)
  for (const skill of OSRS_SKILLS) {
    if (new RegExp(`\\b${skill}\\b`, "i").test(normalized)) {
      return {
        skill,
        level,
        qualifier: normalized,
      };
    }
  }

  // Try keyword → skill mapping
  for (const [pattern, skill] of KEYWORD_SKILL_MAP) {
    if (pattern.test(normalized)) {
      return {
        skill,
        level,
        qualifier: normalized,
      };
    }
  }

  // Unresolvable — return fallback shape
  return {
    fallback: normalized,
    icon,
  };
}

/**
 * Parse all suggested skill items from a list/paragraph section HTML doc.
 * Each `<li>` or `<p>` becomes one result.
 */
export function parseSuggestedSkillItems(
  doc: Document,
  sectionTitle: string
): SuggestedSkillResult[] {
  const MAX_LENGTH = 80;

  return Array.from(doc.querySelectorAll("li, p"))
    .map((node) => {
      const icon = node.querySelector("img")?.getAttribute("src") ?? null;
      const text = normalizeText(node.textContent ?? "");
      return { icon, text };
    })
    .filter(({ text }) => text.length > 0)
    .filter(({ text }) => text.toLowerCase() !== sectionTitle.trim().toLowerCase())
    .filter(({ text, icon }) => text.length <= MAX_LENGTH || icon !== null)
    .map(({ text, icon }) => parseSuggestedSkill(text, icon));
}
