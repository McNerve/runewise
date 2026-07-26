import { fetchJson } from "../api/client";
import { setCache, getCached } from "../api/cache";
import type { WikiGuideBlock, WikiGuideTemplate } from "./blocks";
import { classifyWikiPage } from "./classify";
import {
  WIKI_API,
  slugify,
  normalizeImages,
  normalizeGalleries,
  normalizeLinks,
  wrapTablesForScroll,
  transformTabbers,
  extractSummary,
  sanitizeHtml,
  type WikiTextResponse,
} from "./helpers";

const GUIDE_TTL = 60 * 60 * 1000;

/** Prose prefixes that indicate a navigation/meta paragraph, not the boss description. */
const NAVIGATION_PARAGRAPH_PREFIXES = [
  "this article",
  "this page",
  "the following guide",
  "for strategies",
  "for information on",
  "see also",
  "this guide",
  "this strategy",
];

function isNavigationParagraph(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return NAVIGATION_PARAGRAPH_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Parse the wiki infobox from raw full-page HTML and extract the "Weakness"
 * row value, if present. Returns null when no infobox or weakness row exists.
 */
export function extractWeaknessFromInfobox(fullHtml: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, "text/html");
  const infoboxes = Array.from(
    doc.querySelectorAll("table.infobox, table.rsw-infobox, .infobox table, .rsw-infobox table")
  );
  for (const table of infoboxes) {
    const rows = Array.from(table.querySelectorAll("tr"));
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("th, td"));
      const labelCell = cells[0];
      if (!labelCell) continue;
      const label = (labelCell.textContent ?? "").trim().toLowerCase();
      if (label === "weakness" || label === "weak to") {
        const valueCell = cells[1] ?? cells[0];
        const value = (valueCell.textContent ?? "").replace(/\s+/g, " ").trim();
        if (value && value.toLowerCase() !== "weakness" && value.toLowerCase() !== "weak to") {
          return value;
        }
      }
    }
  }
  return null;
}

interface WikiSection {
  /** Hierarchical number from the TOC, e.g. "7.9.1" — used for parent links. */
  number: string;
  /**
   * Sequential section index for `action=parse&section=` — NOT the same as
   * `number`. Nested headings only resolve when this field is used.
   */
  index: string;
  line: string;
  /** toclevel from the API: 1 = H2, 2 = H3, etc. */
  toclevel: number;
}

export interface BossGuideSection {
  id: string;
  title: string;
  /** Heading level: 2 for H2, 3 for H3/H4 */
  level: 2 | 3;
  /** id of the parent section card (set for nested sections) */
  parentId?: string;
  /** Wiki TOC hierarchical number, e.g. "7.9.1" — used to wire parent links. */
  wikiNumber?: string;
  html: string;
}

export interface BossGuideDocument {
  template: WikiGuideTemplate;
  summary: string | null;
  weakness: string | null;
  recommendedApproach: string | null;
  teamSize: string | null;
  combatLevel: string | null;
  sections: BossGuideSection[];
  blocks: WikiGuideBlock[];
  fetchedAt: number;
}

// -----------------------------------------------------------------------
// Suggested-skill types
// -----------------------------------------------------------------------

export interface SuggestedSkill {
  skill: string;
  level: number;
  qualifier?: string;
  boostAllowed?: boolean;
  optional?: boolean;
  description?: string;
}

// -----------------------------------------------------------------------
// Equipment-entry types
// -----------------------------------------------------------------------

export type EquipmentEntry =
  | {
      type: "item";
      name: string;
      wikiLink?: string;
      badge?: "best" | "good" | "viable";
      imageUrl?: string;
    }
  | { type: "see-section"; targetSectionTitle: string };

// -----------------------------------------------------------------------
// Section label allowlist (top-level H2 anchors we care about)
// -----------------------------------------------------------------------

const SECTION_LABELS = [
  "requirements",
  "suggested skills",
  "recommended skills",
  "equipment",
  "inventory",
  "inventory setups",
  "gear",
  "setup",
  "recommended equipment",
  "suggested equipment",
  "getting there",
  "transportation",
  "location",
  "overview",
  "fight overview",
  "strategy",
  "general strategy",
  "advanced strategies",
  "the fight",
  "mechanics",
  "special attacks",
  "phases",
  "attacks",
  // Note: "drops" intentionally omitted — Loot tab owns drop tables.
  "safespotting",
  "prayer flicking",
  "tips",
  "trip efficiency",
  "forms",
  "recommendations",
  "suggested stats",
  "starting the fight",
  "awakened mode",
  "advanced tips",
  "plugins",
  "inventory recommendations",
  "shields and totems",
  "stat draining",
  "damage reduction",
  "enrage",
  "battle phase",
  // Raid paths / sub-areas
  "path of crondis",
  "path of scabaras",
  "path of het",
  "path of apmeken",
  "warden",
  "wardens",
  "obelisk",
  "akkha",
  "kephri",
  "zebak",
  "baba",
  "ba-ba",
  "tumeken's warden",
  "elidinis' warden",
  "zombified spawn",
  "acid phase",
  "ice phase",
  "woox walk",
  "player death",
  "banking and transportation",
  "divine potions",
  "defence reduction",
  "standard attacks",
  "dragonfire",
  // Intermediate technique headings (often H4 under room Strategy)
  "skipping",
  "stacking",
  "safespot",
  "rotations",
  "enrage phase",
  "power blast",
  "green ball",
  "sticky webs",
  "shadow maze",
  "waves overview",
  "nylocas",
  "using melee",
  "invocation",
  "invocations",
  "raid level",
  "the nexus",
  "the wardens",
  "path clearing",
  "challenge room",
  "shield skip",
  "shielded phase",
  "phase 1",
  "phase 2",
  "phase 3",
] as const;

/**
 * H2 containers that are pure indexes of rooms/encounters — include the H2
 * and every non-meta child (CoX Combat → Tekton/Olm, ToB Bosses, puzzles…).
 */
const STRUCTURAL_PARENT_H2 = [
  "combat",
  "bosses",
  "puzzles",
  "encounters",
  "rooms",
  "paths",
  "path of",
  "challenge mode",
  "the wardens",
  "the nexus",
  "forms",
  "invocations and raid level",
] as const;

/** Exact H2/H3 titles that are pure loot tables (Loot tab owns these). */
const DROP_SECTION_EXACT = new Set([
  "drops",
  "drop table",
  "100%",
  "uniques",
  "unique",
  "mutagens",
  "weapons and armour",
  "runes",
  "herbs",
  "seeds",
  // Note: plain "resources" is NOT here — CoX Strategies uses it for in-raid
  // farming/herblore. Drop tables use more specific labels above.
  "shark drop table",
  "rare drop table",
  "tertiary",
  "always drops",
  "pre-roll",
  "main drop",
  "other drops",
  "gem drop table",
  "supplies",
]);

/** End-matter / non-guide H2s we never surface in Strategy. */
const META_SECTION_DENY = [
  "references",
  "changes",
  "gallery",
  "trivia",
  "see also",
  "external links",
  "notes",
  "history",
  "further reading",
  "sources",
  "footnotes",
  "music",
  "developers",
  "official worlds",
  "money making",
  "rewards",
  "combat achievements",
  "reward system",
];

// -----------------------------------------------------------------------
// Infobox field extractors (approach / team / combat / weakness)
// -----------------------------------------------------------------------

function extractInfoboxField(fullHtml: string, labels: string[]): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, "text/html");
  const rows = doc.querySelectorAll("table.infobox tr, table.rsw-infobox tr, .infobox tr");
  for (const row of rows) {
    const header = row.querySelector("th");
    const data = row.querySelector("td");
    if (!header || !data) continue;
    const headerText = (header.textContent ?? "").trim().toLowerCase();
    if (labels.some((label) => headerText.includes(label.toLowerCase()))) {
      const text = (data.textContent ?? "").trim();
      if (text) return text;
    }
  }
  return null;
}

export function extractRecommendedApproach(fullHtml: string): string | null {
  return extractInfoboxField(fullHtml, [
    "recommended approach",
    "combat approach",
    "attack style",
  ]);
}

export function extractTeamSize(fullHtml: string): string | null {
  return extractInfoboxField(fullHtml, [
    "recommended team size",
    "team size",
    "group size",
  ]);
}

export function extractCombatLevel(fullHtml: string): string | null {
  return extractInfoboxField(fullHtml, ["combat level", "combat lvl"]);
}

// -----------------------------------------------------------------------
// HTML cleaning
// -----------------------------------------------------------------------

function cleanSectionHtml(
  rawHtml: string,
  sectionTitle: string
): { html: string; summary: string | null } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  content
    .querySelectorAll(
      "script, style, sup.reference, .mw-editsection, .navbox, .catlinks, .printfooter, .noprint, iframe, object, embed, form, .toc, #toc, [role='navigation'], .mw-headline-anchor"
    )
    .forEach((element) => element.remove());

  content.querySelectorAll("div, table").forEach((element) => {
    const text = element.textContent?.trim() ?? "";
    const className = element.className ?? "";
    if (
      className.includes("toc") ||
      className.includes("infobox") ||
      className.includes("rsw-infobox") ||
      (text.startsWith("Contents") && element.querySelectorAll("li").length > 0 && text.length < 500)
    ) {
      element.remove();
    }
  });

  content.querySelectorAll("*").forEach((element) => {
    for (const attr of [...element.attributes]) {
      if (attr.name.startsWith("on")) element.removeAttribute(attr.name);
    }
  });

  // Keep wiki anchors as in-app deep links (item → market, page → wiki lookup).
  normalizeLinks(content);
  wrapTablesForScroll(content);
  // Inventory/equipment multi-setup tabbers → native details (no JS race).
  transformTabbers(content, doc);

  normalizeGalleries(content);

  content.querySelectorAll("img[alt]").forEach((img) => {
    const alt = img.getAttribute("alt");
    if (alt && !img.getAttribute("title")) {
      img.setAttribute("title", alt);
    }
  });

  content.querySelectorAll(".tilemarker-div").forEach((div) => {
    const json = (div.textContent ?? "").trim();
    if (!json) return;
    const wrapper = document.createElement("div");
    wrapper.className = "tile-marker-wrapper";
    const btn = document.createElement("button");
    btn.className = "tile-marker-copy";
    btn.setAttribute("data-tiles", json);
    btn.textContent = "📋 Copy Tile Markers for RuneLite";
    wrapper.appendChild(btn);
    div.replaceWith(wrapper);
  });

  const firstParagraph = content.querySelector("p");
  if (firstParagraph) {
    const text = (firstParagraph.textContent ?? "").trim();
    if (
      text.toLowerCase() === sectionTitle.trim().toLowerCase() ||
      isNavigationParagraph(text)
    ) {
      firstParagraph.remove();
    }
  }

  // MediaWiki `section=` responses include the heading itself — remove the
  // first H2–H4 that matches this section title (or its leaf after "Parent > ")
  // so the card chrome title isn't doubled by a nested heading in the body.
  const titleNorm = sectionTitle.trim().toLowerCase();
  const titleLeaf = titleNorm.includes(" > ")
    ? titleNorm.slice(titleNorm.lastIndexOf(" > ") + 3).trim()
    : titleNorm;
  const leadHeading = content.querySelector(
    ":scope > .mw-heading2, :scope > .mw-heading3, :scope > .mw-heading4, :scope > h2, :scope > h3, :scope > h4, .mw-heading2, .mw-heading3, .mw-heading4, h2, h3, h4"
  );
  if (leadHeading) {
    const leadText = (leadHeading.textContent ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (
      leadText === titleNorm ||
      leadText === titleLeaf ||
      titleNorm.endsWith(leadText)
    ) {
      leadHeading.remove();
    }
  }

  normalizeImages(content);

  const summaryParagraphs = Array.from(content.querySelectorAll("p"));
  const summaryPara = summaryParagraphs.find((p) => {
    const text = (p.textContent ?? "").trim();
    return text.length >= 60 && !isNavigationParagraph(text);
  });
  const summary = summaryPara?.textContent?.trim() ?? extractSummary(content);
  // Preserve anchors so players can jump to related wiki pages / market items.
  const sanitized = sanitizeHtml(content);

  return { html: sanitized, summary };
}

// -----------------------------------------------------------------------
// Wiki API fetchers
// -----------------------------------------------------------------------

async function fetchWikiSections(wikiPage: string): Promise<WikiSection[]> {
  return fetchJson<WikiSection[]>({
    url: `${WIKI_API}?action=parse&page=${wikiPage}&prop=sections&format=json&redirects=1`,
    cacheKey: `boss-guide-sections:v5:${wikiPage}`,
    ttlMs: GUIDE_TTL,
    transform: (json) => {
      if (
        typeof json !== "object" ||
        json === null ||
        !("parse" in json) ||
        typeof json.parse !== "object" ||
        json.parse === null ||
        !("sections" in json.parse) ||
        !Array.isArray(json.parse.sections)
      ) {
        return [];
      }
      return (json.parse.sections as Array<Record<string, unknown>>)
        .map((raw): WikiSection | null => {
          const line = typeof raw.line === "string" ? raw.line : "";
          const number = typeof raw.number === "string" ? raw.number : "";
          const index =
            typeof raw.index === "string" || typeof raw.index === "number"
              ? String(raw.index)
              : "";
          const toclevel =
            typeof raw.toclevel === "number" ? raw.toclevel : 1;
          if (!line || !number || !index) return null;
          return { line, number, index, toclevel };
        })
        .filter((s): s is WikiSection => s !== null);
    },
  });
}

async function fetchSectionHtml(
  wikiPage: string,
  sectionIndex: string
): Promise<string> {
  return fetchJson<string>({
    url: `${WIKI_API}?action=parse&page=${wikiPage}&prop=text&section=${sectionIndex}&format=json&redirects=1`,
    dedupeKey: `boss-guide:${wikiPage}:idx:${sectionIndex}`,
    transform: (json) =>
      ((json as WikiTextResponse).parse?.text?.["*"] ?? "").trim(),
  });
}

async function fetchFullHtml(wikiPage: string): Promise<string> {
  return fetchJson<string>({
    url: `${WIKI_API}?action=parse&page=${wikiPage}&prop=text&format=json&redirects=1`,
    dedupeKey: `boss-guide-full:${wikiPage}`,
    transform: (json) =>
      ((json as WikiTextResponse).parse?.text?.["*"] ?? "").trim(),
  });
}

// -----------------------------------------------------------------------
// Section HTML extraction from full-page dump
// -----------------------------------------------------------------------

function normalizeHeadingMatch(input: string) {
  return input
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Extract the HTML content that belongs to a given heading, stopping at the
 * next heading of equal or lesser depth.
 *
 * headingLevel: 2 for H2, 3 for H3. When extracting H3 we also break on H4 so
 * nested technique sections can be their own cards without double-rendering.
 */
function extractSectionHtmlFromFullPage(
  fullHtml: string,
  sectionTitle: string,
  headingLevel: 2 | 3 = 2
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  // Selectors for "this level" and break boundaries (equal-or-higher headings)
  const thisSelector =
    headingLevel === 2
      ? ".mw-heading2, h2"
      : ".mw-heading3, h3";
  // H3 extract also stops at H4 — those become separate guide cards.
  const breakSelector =
    headingLevel === 2
      ? ".mw-heading2, h2"
      : ".mw-heading2, .mw-heading3, .mw-heading4, h2, h3, h4";

  const headingContainer = Array.from(
    content.querySelectorAll(thisSelector)
  ).find((node) => {
    const heading =
      node.matches("h2, h3, h4") ? node : node.querySelector("h2, h3, h4");
    const text = heading?.textContent ?? node.textContent ?? "";
    return normalizeHeadingMatch(text) === normalizeHeadingMatch(sectionTitle);
  });

  if (!headingContainer) return "";

  const fragment = document.createElement("div");
  let cursor = headingContainer.nextElementSibling;

  while (cursor) {
    if (cursor.matches(breakSelector)) break;
    fragment.appendChild(cursor.cloneNode(true));
    cursor = cursor.nextElementSibling;
  }

  return fragment.innerHTML.trim();
}

// -----------------------------------------------------------------------
// Section selection / fallback logic
// -----------------------------------------------------------------------

function isDropSection(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (DROP_SECTION_EXACT.has(lower)) return true;
  if (lower.startsWith("drops") || lower.includes("drop table")) return true;
  return false;
}

function isMetaSection(line: string): boolean {
  const lower = line.toLowerCase().trim();
  return META_SECTION_DENY.some(
    (d) => lower === d || lower.startsWith(d + " ") || lower.startsWith(d + ":")
  );
}

function isStructuralParentH2(line: string): boolean {
  const lower = line.toLowerCase().trim();
  return STRUCTURAL_PARENT_H2.some(
    (p) => lower === p || lower.startsWith(p + " ") || lower.includes(p)
  );
}

function sectionMatchesLabel(line: string): boolean {
  if (isDropSection(line) || isMetaSection(line)) return false;
  const lower = line.toLowerCase();
  return SECTION_LABELS.some((l) => lower.includes(l));
}

function parentSectionNumber(number: string): string | null {
  const parts = number.split(".");
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join(".");
}

function isDescendantOf(number: string, ancestor: string): boolean {
  return number === ancestor || number.startsWith(ancestor + ".");
}

/**
 * Pick guide sections from a wiki TOC.
 *
 * Rules:
 *  - Skip drop tables and end-matter (References, Changes…).
 *  - Include H2s that match strategy labels OR are structural indexes
 *    (Combat, Bosses, Puzzles) OR have a matching strategy child.
 *  - When an H2 is included, pull its full non-meta descendant tree
 *    (H3 rooms + H4 techniques like Skipping / Safespotting / Phases).
 *  - Orphan H3s that match labels (under a filtered-out parent) still come in.
 */
function filterRelevantSections(sections: WikiSection[]): WikiSection[] {
  // Precompute which H2 numbers should expand their whole subtree.
  const h2IncludeAll = new Set<string>();
  const h2IncludeSelf = new Set<string>();

  for (const s of sections) {
    if (s.toclevel !== 1) continue;
    if (isDropSection(s.line) || isMetaSection(s.line)) continue;

    const labelMatch = sectionMatchesLabel(s.line);
    const structural = isStructuralParentH2(s.line);
    const childMatch = sections.some(
      (c) =>
        c.toclevel > 1 &&
        isDescendantOf(c.number, s.number) &&
        !isDropSection(c.line) &&
        !isMetaSection(c.line) &&
        sectionMatchesLabel(c.line)
    );

    if (labelMatch || structural || childMatch) {
      h2IncludeSelf.add(s.number);
      // Always expand: room pages (Maiden) and indexes (Combat) both benefit
      // from shipping their full technique tree.
      h2IncludeAll.add(s.number);
    }
  }

  const result: WikiSection[] = [];
  const includedNumbers = new Set<string>();

  for (const s of sections) {
    if (isDropSection(s.line) || isMetaSection(s.line)) continue;

    if (s.toclevel === 1) {
      if (!h2IncludeSelf.has(s.number)) continue;
      result.push(s);
      includedNumbers.add(s.number);
      continue;
    }

    // Find nearest included ancestor H2.
    const parts = s.number.split(".");
    const h2Number = parts[0];
    if (!h2Number || !h2IncludeAll.has(h2Number)) {
      // Orphan H3/H4 whose parent H2 was filtered — still keep label matches.
      if (sectionMatchesLabel(s.line)) {
        result.push(s);
        includedNumbers.add(s.number);
      }
      continue;
    }

    // Under an expanded H2: take H3 + H4 (toclevel 2 and 3).
    if (s.toclevel === 2 || s.toclevel === 3) {
      result.push(s);
      includedNumbers.add(s.number);
    }
  }

  return result;
}

async function fetchSectionsWithFallback(wikiPage: string): Promise<{
  page: string;
  sections: WikiSection[];
  allSections: WikiSection[];
}> {
  const hasStrategies = wikiPage.endsWith("/Strategies");
  const altPage = hasStrategies
    ? wikiPage.replace(/\/Strategies$/, "")
    : `${wikiPage}/Strategies`;

  const [sections, altSections] = await Promise.all([
    fetchWikiSections(wikiPage).catch(() => [] as WikiSection[]),
    fetchWikiSections(altPage).catch(() => [] as WikiSection[]),
  ]);

  const matched = filterRelevantSections(sections);
  const altMatched = filterRelevantSections(altSections);

  const sortByNumber = (list: WikiSection[]) =>
    [...list].sort((a, b) => compareSectionNumbers(a.number, b.number));

  // Always prefer the /Strategies page when it has guide content — the main
  // boss page often has more TOC nodes (rewards, drop tables, trivia) that
  // inflate match count after structural expansion (e.g. CoX main > Strategies).
  const primaryIsStrategies = hasStrategies;
  const strategiesMatched = primaryIsStrategies ? matched : altMatched;
  const strategiesPage = primaryIsStrategies ? wikiPage : altPage;
  const strategiesAll = primaryIsStrategies ? sections : altSections;
  const otherMatched = primaryIsStrategies ? altMatched : matched;
  const otherPage = primaryIsStrategies ? altPage : wikiPage;
  const otherAll = primaryIsStrategies ? altSections : sections;

  if (strategiesMatched.length > 0) {
    return {
      page: strategiesPage,
      sections: sortByNumber(strategiesMatched),
      allSections: strategiesAll,
    };
  }
  if (otherMatched.length > 0) {
    return {
      page: otherPage,
      sections: sortByNumber(otherMatched),
      allSections: otherAll,
    };
  }
  return {
    page: strategiesPage,
    sections: [],
    allSections: strategiesAll,
  };
}

function compareSectionNumbers(a: string, b: string): number {
  const ap = a.split(".").map((n) => parseInt(n, 10) || 0);
  const bp = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(ap.length, bp.length);
  for (let i = 0; i < len; i++) {
    const d = (ap[i] ?? 0) - (bp[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// -----------------------------------------------------------------------
// Deduplication helper
// -----------------------------------------------------------------------

function disambiguateTitle(
  title: string,
  parentTitle: string | undefined
): string {
  return parentTitle ? `${parentTitle} > ${title}` : title;
}

function sectionTitleLeaf(title: string): string {
  const idx = title.lastIndexOf(" > ");
  return (idx >= 0 ? title.slice(idx + 3) : title).trim().toLowerCase();
}

/**
 * Drop duplicate cards: identical titles, or a bare "Shield Skip" next to
 * "Fight overview > Shield Skip" / "Shielded phase > Shield Skip".
 * Keeps the longer HTML body.
 */
function collapseDuplicateSections<
  T extends { id: string; title: string; html: string; parentId?: string },
>(sections: T[]): T[] {
  const byExact = new Map<string, T>();
  for (const s of sections) {
    const key = s.title.trim().toLowerCase();
    const prev = byExact.get(key);
    if (!prev || s.html.length > prev.html.length) {
      byExact.set(key, s);
    }
  }
  const exactKept = [...byExact.values()];

  // Prefer "Parent > Leaf" over bare "Leaf" when both exist.
  const prefixedLeaves = new Set(
    exactKept
      .filter((s) => s.title.includes(" > "))
      .map((s) => sectionTitleLeaf(s.title))
  );

  const out: T[] = [];
  const seenIds = new Set<string>();
  for (const s of exactKept) {
    const leaf = sectionTitleLeaf(s.title);
    if (!s.title.includes(" > ") && prefixedLeaves.has(leaf)) {
      continue;
    }
    if (seenIds.has(s.id)) continue;
    seenIds.add(s.id);
    out.push(s);
  }

  // Preserve original document order.
  const order = new Map(sections.map((s, i) => [s.id, i]));
  out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return out;
}

/**
 * Remove nested H3/H4 blocks from a section body when those nested headings
 * are rendered as their own guide cards.
 */
function stripNestedHeadings(rawHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const root = doc.querySelector(".mw-parser-output") || doc.body;

  // Drop everything from the first nested section heading onward.
  const kids = Array.from(root.children);
  let cut = -1;
  for (let i = 0; i < kids.length; i++) {
    const el = kids[i];
    if (
      el.matches(
        ".mw-heading3, .mw-heading4, h3, h4, .mw-heading2, h2"
      )
    ) {
      cut = i;
      break;
    }
  }
  if (cut >= 0) {
    for (let i = kids.length - 1; i >= cut; i--) {
      kids[i].remove();
    }
  }
  return root.innerHTML.trim();
}

// -----------------------------------------------------------------------
// Main export
// -----------------------------------------------------------------------

export async function fetchBossGuideDocument(
  wikiPage: string
): Promise<BossGuideDocument> {
  const cacheKey = `boss-guide:v19:${wikiPage}`;
  const cached = getCached<BossGuideDocument>(cacheKey, GUIDE_TTL);
  if (cached) return cached;

  const { page: resolvedPage, sections: targetSections, allSections } =
    await fetchSectionsWithFallback(wikiPage);

  const [classification, fullHtml] = await Promise.all([
    classifyWikiPage(resolvedPage),
    fetchFullHtml(resolvedPage),
  ]);

  // Map every wiki section number → title (including H2s we filtered out of
  // the guide body). Needed so orphaned H3s like repeated "Strategy" under
  // raid rooms still get a parent label for disambiguation.
  const sectionTitleByNumber = new Map<string, string>();
  for (const s of allSections) {
    sectionTitleByNumber.set(s.number, s.line);
  }

  // Count repeated deep titles (H3/H4) so every instance carries its parent
  // room — "Maiden > Strategy", "Bloat > Strategy", "Olm > Phases".
  const deepTitleCounts = new Map<string, number>();
  for (const s of targetSections) {
    if (s.toclevel >= 2) {
      const key = s.line.toLowerCase();
      deepTitleCounts.set(key, (deepTitleCounts.get(key) ?? 0) + 1);
    }
  }

  type NormalizedSection = BossGuideSection & { summary: string | null };

  // Sections that have their own child cards — parent bodies must not also
  // embed that nested content (avoids Strategy + Skipping double-render).
  const numbersWithChildCards = new Set<string>();
  for (const s of targetSections) {
    const parent = parentSectionNumber(s.number);
    if (parent) numbersWithChildCards.add(parent);
  }

  const rawSections = await Promise.all(
    targetSections.map(async (section): Promise<NormalizedSection | null> => {
      // toclevel 1 = H2 → card level 2; toclevel 2/3 = H3/H4 → card level 3
      const level: 2 | 3 = section.toclevel <= 1 ? 2 : 3;

      // Nearest parent section (H4 → H3, H3 → H2), not only the root H2.
      let parentId: string | undefined;
      let parentTitle: string | undefined;
      if (section.toclevel >= 2) {
        const parentNumber = parentSectionNumber(section.number);
        if (parentNumber) {
          parentTitle = sectionTitleByNumber.get(parentNumber);
          if (parentTitle) {
            parentId = slugify(parentTitle);
          }
        }
      }

      const hasChildCards = numbersWithChildCards.has(section.number);

      // Prefer full-page extract (can stop before nested H4s). API section
      // fetch uses the sequential `index` (not hierarchical `number`) and
      // includes nested subsections — strip those when child cards exist.
      let rawHtml = "";
      if (section.toclevel >= 3) {
        rawHtml = await fetchSectionHtml(resolvedPage, section.index);
      } else {
        rawHtml = extractSectionHtmlFromFullPage(
          fullHtml,
          section.line,
          section.toclevel <= 1 ? 2 : 3
        );
        if (!rawHtml) {
          rawHtml = await fetchSectionHtml(resolvedPage, section.index);
        }
        if (hasChildCards && rawHtml) {
          rawHtml = stripNestedHeadings(rawHtml);
        }
      }

      const { html, summary } = cleanSectionHtml(rawHtml, section.line);
      if (html.length < 20) return null;

      // Deep titles: always prefix with nearest parent when duplicated, or when
      // the bare title is a generic technique label (Phases, Safespotting…).
      let displayTitle = section.line;
      const genericDeep =
        section.toclevel >= 3 &&
        /^(phases?|safespotting|skipping|stacking|strategy|attacks?|enrage|rotations?)/i.test(
          section.line.trim()
        );
      const duplicatedDeep =
        section.toclevel >= 2 &&
        (deepTitleCounts.get(section.line.toLowerCase()) ?? 0) > 1;
      if (parentTitle && (duplicatedDeep || genericDeep)) {
        displayTitle = disambiguateTitle(section.line, parentTitle);
      }

      return {
        id: slugify(section.line + (parentId ? `-${parentId}` : "")),
        title: displayTitle,
        level,
        parentId,
        wikiNumber: section.number,
        html,
        summary,
      };
    })
  );

  const normalizedSections: NormalizedSection[] = rawSections.filter(
    (s): s is NormalizedSection => s !== null
  );

  // Ensure section ids are unique (wiki pages occasionally have repeated H2
  // titles like "Strategy" or "Equipment"). Append a counter suffix on
  // collision so React keys and scroll-target ids stay distinct.
  const seenIds = new Map<string, number>();
  for (const s of normalizedSections) {
    const baseId = s.id;
    const count = (seenIds.get(baseId) ?? 0) + 1;
    seenIds.set(baseId, count);
    if (count > 1) s.id = `${baseId}-${count}`;
  }

  // Rewire parentId to the actual parent *card* id using wiki numbers
  // (slugify(parentTitle) does not match ids like "great-olm-combat").
  const idByWikiNumber = new Map<string, string>();
  for (const s of normalizedSections) {
    if (s.wikiNumber) idByWikiNumber.set(s.wikiNumber, s.id);
  }
  for (const s of normalizedSections) {
    if (!s.wikiNumber) continue;
    const parentNum = parentSectionNumber(s.wikiNumber);
    if (!parentNum) {
      s.parentId = undefined;
      continue;
    }
    s.parentId = idByWikiNumber.get(parentNum);
  }

  // Second dedup pass: if same title appears multiple times, prefix with parent
  // room / H2 context so ToB "Strategy" under Maiden vs Bloat is readable.
  const titleCounts = new Map<string, number>();
  for (const s of normalizedSections) {
    titleCounts.set(s.title, (titleCounts.get(s.title) ?? 0) + 1);
  }
  for (const s of normalizedSections) {
    if ((titleCounts.get(s.title) ?? 0) <= 1) continue;
    if (s.level === 3 && s.parentId) {
      // Prefer the human parent title stored during parse (may be a raid room
      // H2 that itself was filtered out of the body).
      const parentFromDoc = normalizedSections.find((p) => p.id === s.parentId);
      const parentLabel =
        parentFromDoc?.title ??
        // parentId is slugify(parentTitle) — reverse via section map when possible
        s.parentId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (parentLabel && !s.title.includes(" > ")) {
        s.title = disambiguateTitle(s.title, parentLabel);
      }
    }
  }

  // Final collapse: drop exact duplicate titles (and bare-leaf duplicates of a
  // "Parent > Leaf" card) keeping the longer body.
  const collapsed = collapseDuplicateSections(normalizedSections);

  const doc = {
    template: classification.template,
    summary:
      collapsed.find((section) => section.summary)?.summary ?? null,
    weakness: extractWeaknessFromInfobox(fullHtml),
    recommendedApproach: extractRecommendedApproach(fullHtml),
    teamSize: extractTeamSize(fullHtml),
    combatLevel: extractCombatLevel(fullHtml),
    sections: collapsed.map((section) => ({
      id: section.id,
      title: section.title,
      level: section.level,
      parentId: section.parentId,
      wikiNumber: section.wikiNumber,
      html: section.html,
    })),
    blocks: collapsed.map((section) => ({
      id: section.id,
      title: section.title,
      type: "article" as const,
      html: section.html,
    })),
    fetchedAt: Date.now(),
  };

  setCache(cacheKey, doc);
  return doc;
}

// -----------------------------------------------------------------------
// Equipment parsing helpers (used by StructuredSection)
// -----------------------------------------------------------------------

const SEE_SECTION_RE = /^see\s*:?\s+(.+?)\s+sections?$/i;

/** Labels that wiki emits as equipment entries but carry no useful signal. */
const INVALID_EQUIPMENT_LABELS = new Set([
  "n/a",
  "na",
  "-",
  "—",
  "ranged",
  "melee",
  "magic",
  "mage",
]);

/**
 * Split on ` / ` (with spaces) between alternative items. Preserves URL-style
 * slashes and names that contain `/` without spaces. Also trims bare leading/
 * trailing slashes that result from partial wiki templates.
 */
function splitOnSlash(text: string): string[] {
  return text
    .split(/\s+\/\s+/)
    .map((p) => p.replace(/^\/+\s*|\s*\/+$/g, "").trim())
    .filter((p) => p.length > 0);
}

/** Parse a single list item's text into an EquipmentEntry. */
export function parseEquipmentEntry(
  text: string,
  imageUrl?: string
): EquipmentEntry {
  const trimmed = text.trim().replace(/^\/+\s*|\s*\/+$/g, "").trim();
  const m = trimmed.match(SEE_SECTION_RE);
  if (m) {
    return { type: "see-section", targetSectionTitle: m[1] };
  }
  return { type: "item", name: trimmed, imageUrl };
}

/** Filter out equipment entries that are N/A or redundant style labels. */
function isValidEquipmentEntry(entry: EquipmentEntry): boolean {
  if (entry.type === "see-section") return true;
  const normalized = entry.name.trim().toLowerCase();
  if (!normalized) return false;
  return !INVALID_EQUIPMENT_LABELS.has(normalized);
}

/**
 * Split a cell's content into individual EquipmentEntry items.
 * Splits on <li> boundaries or <br> elements rather than stripping to plain text.
 * Then splits each resulting text on ` / ` for slash-joined alternatives.
 */
export function parseEquipmentCellEntries(cell: Element): EquipmentEntry[] {
  // If the cell has <li> items, use those
  const listItems = cell.querySelectorAll("li");
  if (listItems.length > 0) {
    const entries = Array.from(listItems).flatMap((li) => {
      const text = (li.textContent ?? "").replace(/\s+/g, " ").trim();
      const img = li.querySelector("img");
      const imageUrl = resolveImageSrc(img?.getAttribute("src") ?? img?.getAttribute("data-src") ?? null);
      if (!text) return [];
      // Also split li text on ` / ` for alternatives joined inline
      return splitOnSlash(text).map((part) => parseEquipmentEntry(part, imageUrl ?? undefined));
    });
    return entries.filter(isValidEquipmentEntry);
  }

  // Otherwise split on <br> boundaries
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll("br").forEach((br) => {
    br.replaceWith(document.createTextNode("\n"));
  });
  const rawText = (clone.textContent ?? "").trim();
  const parts = rawText
    .split("\n")
    .flatMap((p) => splitOnSlash(p.replace(/\s+/g, " ").trim()))
    .filter(Boolean);

  if (parts.length > 1) {
    const images = Array.from(cell.querySelectorAll("img"));
    const entries = parts.map((text, i) => {
      const img = images[i] ?? images[0] ?? null;
      const imageUrl = resolveImageSrc(img?.getAttribute("src") ?? img?.getAttribute("data-src") ?? null);
      return parseEquipmentEntry(text, imageUrl ?? undefined);
    });
    return entries.filter(isValidEquipmentEntry);
  }

  // Single text block — split on ` / ` for alternatives, filter invalids
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text) return [];
  const img = cell.querySelector("img");
  const imageUrl = resolveImageSrc(img?.getAttribute("src") ?? img?.getAttribute("data-src") ?? null);
  const singleParts = splitOnSlash(text);
  const entries = singleParts.map((p) => parseEquipmentEntry(p, imageUrl ?? undefined));
  return entries.filter(isValidEquipmentEntry);
}

function resolveImageSrc(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return `https://oldschool.runescape.wiki${src}`;
  return src;
}

// -----------------------------------------------------------------------
// Skill parsing helpers (used by StructuredSection)
// -----------------------------------------------------------------------

const SKILL_NAMES = new Set([
  "attack", "strength", "defence", "ranged", "prayer", "magic",
  "runecrafting", "hitpoints", "crafting", "mining", "smithing",
  "fishing", "cooking", "firemaking", "woodcutting", "agility",
  "herblore", "thieving", "fletching", "slayer", "farming",
  "construction", "hunter",
]);

/**
 * Parse a skill requirement string like
 *   "82+ Herblore (for Ornate rejuvenation pool (with boost) - (optional for faster resupply))"
 * into a structured SuggestedSkill object.
 */
export function parseSuggestedSkill(raw: string): SuggestedSkill | null {
  const text = raw.replace(/\s+/g, " ").trim();

  // Match: optional leading/trailing parens, level (number), optional +, optional skill name
  // e.g. "82+ Herblore", "43 Prayer", "75+ (recommended)"
  // Also: "85+ Ranged method" → skill=Ranged, qualifier=method
  const levelMatch = text.match(/^(\d+)\+?\s*([A-Za-z']+)?/);
  if (!levelMatch) return null;

  const level = parseInt(levelMatch[1], 10);
  const rawSkill = (levelMatch[2] ?? "").trim().toLowerCase();
  // Reject common non-skill words that follow a level (e.g. "For 70+").
  const NON_SKILLS = new Set(["for", "with", "and", "or", "the", "a", "an", "to", "at"]);
  const skill =
    rawSkill && !NON_SKILLS.has(rawSkill)
      ? SKILL_NAMES.has(rawSkill)
        ? rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1)
        : rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1)
      : "";

  // Rest of the string after "NN+ SkillName"
  const prefix = skill
    ? levelMatch[0]
    : `${levelMatch[1]}${text.includes("+") ? "+" : ""}`;
  const remainder = text.slice(prefix.length).trim();

  // Detect boost
  const boostAllowed = /\bwith boost\b/i.test(remainder);

  // Detect optional
  const optional = /\boptional\b/i.test(remainder);

  // Extract qualifier: text inside parens before "with boost" or "optional"
  // e.g. "(for Ornate rejuvenation pool (with boost) - (optional ...))"
  let qualifier: string | undefined;
  const qualMatch = remainder.match(/^\(?\s*for\s+([^()]+?)(?:\s*\(with boost\))?\s*(?:-\s*)?\(?optional[^)]*\)?\s*\)?$/i)
    ?? remainder.match(/^\(?\s*for\s+([^()]+?)(?:\s*\(with boost\))?\s*\)?$/i);
  if (qualMatch) {
    qualifier = qualMatch[1].trim();
  } else if (remainder) {
    // Strip outer parens and noise flags; keep notes like "Piety (74+ for Rigour)"
    // or method labels ("Ranged method" → "method" after skill already consumed).
    let cleaned = remainder
      .replace(/^\(+/, "")
      .replace(/\)+$/, "")
      .replace(/\bwith boost\b/gi, "")
      .replace(/\boptional\b/gi, "")
      .replace(/\s*-\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Drop pure noise
    if (cleaned && !/^(method|methods)$/i.test(cleaned)) {
      qualifier = cleaned;
    }
  }

  return {
    skill: skill || "Unknown",
    level,
    qualifier: qualifier || undefined,
    boostAllowed: boostAllowed || undefined,
    optional: optional || undefined,
    description: text,
  };
}
