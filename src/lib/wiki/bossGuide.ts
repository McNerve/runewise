import { fetchJson } from "../api/client";
import { setCache, getCached } from "../api/cache";
import type { WikiGuideBlock, WikiGuideTemplate } from "./blocks";
import { classifyWikiPage } from "./classify";
import {
  WIKI_API,
  slugify,
  normalizeImages,
  normalizeGalleries,
  extractSummary,
  sanitizeHtmlStrict,
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
  number: string;
  line: string;
  /** toclevel from the API: 1 = H2, 2 = H3, etc. */
  toclevel: number;
}

export interface BossGuideSection {
  id: string;
  title: string;
  /** Heading level: 2 for H2, 3 for H3 */
  level: 2 | 3;
  /** id of the parent H2 section (set for H3s) */
  parentId?: string;
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
  "drops",
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
] as const;

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

  content.querySelectorAll("a").forEach((link) => {
    const fragment = document.createDocumentFragment();
    while (link.firstChild) fragment.appendChild(link.firstChild);
    link.replaceWith(fragment);
  });

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

  normalizeImages(content);

  const summaryParagraphs = Array.from(content.querySelectorAll("p"));
  const summaryPara = summaryParagraphs.find((p) => {
    const text = (p.textContent ?? "").trim();
    return text.length >= 60 && !isNavigationParagraph(text);
  });
  const summary = summaryPara?.textContent?.trim() ?? extractSummary(content);
  const sanitized = sanitizeHtmlStrict(content);

  return { html: sanitized, summary };
}

// -----------------------------------------------------------------------
// Wiki API fetchers
// -----------------------------------------------------------------------

async function fetchWikiSections(wikiPage: string): Promise<WikiSection[]> {
  return fetchJson<WikiSection[]>({
    url: `${WIKI_API}?action=parse&page=${wikiPage}&prop=sections&format=json`,
    cacheKey: `boss-guide-sections:v3:${wikiPage}`,
    ttlMs: GUIDE_TTL,
    transform: (json) =>
      typeof json === "object" &&
      json !== null &&
      "parse" in json &&
      typeof json.parse === "object" &&
      json.parse !== null &&
      "sections" in json.parse &&
      Array.isArray(json.parse.sections)
        ? (json.parse.sections as WikiSection[])
        : [],
  });
}

async function fetchSectionHtml(
  wikiPage: string,
  sectionNumber: string
): Promise<string> {
  return fetchJson<string>({
    url: `${WIKI_API}?action=parse&page=${wikiPage}&prop=text&section=${sectionNumber}&format=json`,
    dedupeKey: `boss-guide:${wikiPage}:${sectionNumber}`,
    transform: (json) =>
      ((json as WikiTextResponse).parse?.text?.["*"] ?? "").trim(),
  });
}

async function fetchFullHtml(wikiPage: string): Promise<string> {
  return fetchJson<string>({
    url: `${WIKI_API}?action=parse&page=${wikiPage}&prop=text&format=json`,
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
 * headingLevel: 2 for H2, 3 for H3
 */
function extractSectionHtmlFromFullPage(
  fullHtml: string,
  sectionTitle: string,
  headingLevel: 2 | 3 = 2
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  // Selectors for "this level" and "parent level" headings
  const thisSelector =
    headingLevel === 2
      ? ".mw-heading2, h2"
      : ".mw-heading3, h3";
  const breakSelector =
    headingLevel === 2
      ? ".mw-heading2, h2"
      : ".mw-heading2, .mw-heading3, h2, h3";

  const headingContainer = Array.from(
    content.querySelectorAll(thisSelector)
  ).find((node) => {
    const heading =
      node.matches("h2, h3") ? node : node.querySelector("h2, h3");
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

function sectionMatchesLabel(line: string): boolean {
  const lower = line.toLowerCase();
  return SECTION_LABELS.some((l) => lower.includes(l));
}

/**
 * Given raw wiki sections, return all H2s that match the label list PLUS
 * all H3s whose parent H2 also matches.
 */
function filterRelevantSections(sections: WikiSection[]): WikiSection[] {
  const result: WikiSection[] = [];
  let currentH2Included = false;

  for (const s of sections) {
    if (s.toclevel === 1) {
      // H2
      currentH2Included = sectionMatchesLabel(s.line);
      if (currentH2Included) result.push(s);
    } else if (s.toclevel === 2) {
      // H3 — include if parent H2 was included OR if the H3 itself matches
      if (currentH2Included || sectionMatchesLabel(s.line)) {
        result.push(s);
      }
    }
    // Deeper levels (H4+) are ignored
  }

  return result;
}

async function fetchSectionsWithFallback(wikiPage: string) {
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

  return altMatched.length > matched.length
    ? { page: altPage, sections: altMatched }
    : matched.length > 0
      ? { page: wikiPage, sections: matched }
      : { page: altPage, sections: altMatched };
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

// -----------------------------------------------------------------------
// Main export
// -----------------------------------------------------------------------

export async function fetchBossGuideDocument(
  wikiPage: string
): Promise<BossGuideDocument> {
  const cacheKey = `boss-guide:v6:${wikiPage}`;
  const cached = getCached<BossGuideDocument>(cacheKey, GUIDE_TTL);
  if (cached) return cached;

  const { page: resolvedPage, sections: targetSections } =
    await fetchSectionsWithFallback(wikiPage);

  const [classification, fullHtml] = await Promise.all([
    classifyWikiPage(resolvedPage),
    fetchFullHtml(resolvedPage),
  ]);

  // Build a map of section number -> title for parent lookup
  const sectionTitleByNumber = new Map<string, string>();

  // Collect H2 titles to detect duplicates
  const h2TitleCount = new Map<string, number>();
  for (const s of targetSections) {
    if (s.toclevel === 1) {
      h2TitleCount.set(s.line, (h2TitleCount.get(s.line) ?? 0) + 1);
      sectionTitleByNumber.set(s.number, s.line);
    }
  }

  // Track seen display-titles for H3-level deduplication
  const seenDisplayTitles = new Map<string, number>();

  type NormalizedSection = BossGuideSection & { summary: string | null };

  const rawSections = await Promise.all(
    targetSections.map(async (section): Promise<NormalizedSection | null> => {
      const level: 2 | 3 = section.toclevel <= 1 ? 2 : 3;

      // For H3s, derive parent H2 number (e.g. "3.2" -> "3")
      let parentId: string | undefined;
      let parentTitle: string | undefined;
      if (level === 3) {
        const parentNumber = section.number.split(".")[0];
        parentTitle = sectionTitleByNumber.get(parentNumber);
        if (parentTitle) {
          parentId = slugify(parentTitle);
        }
      }

      const rawHtml =
        extractSectionHtmlFromFullPage(fullHtml, section.line, level) ||
        (await fetchSectionHtml(resolvedPage, section.number));

      const { html, summary } = cleanSectionHtml(rawHtml, section.line);
      if (html.length < 20) return null;

      // Determine display title with disambiguation
      let displayTitle = section.line;
      if (level === 3 && parentTitle) {
        const key = section.line.toLowerCase();
        const count = seenDisplayTitles.get(key) ?? 0;
        seenDisplayTitles.set(key, count + 1);
        if (count > 0) {
          // Duplicate H3 title — prefix with parent
          displayTitle = disambiguateTitle(section.line, parentTitle);
        } else {
          seenDisplayTitles.set(key, 1);
        }
      }

      return {
        id: slugify(section.line + (parentId ? `-${parentId}` : "")),
        title: displayTitle,
        level,
        parentId,
        html,
        summary,
      };
    })
  );

  const normalizedSections: NormalizedSection[] = rawSections.filter(
    (s): s is NormalizedSection => s !== null
  );

  // Second dedup pass: if same title appears multiple times, disambiguate H3 using parent context
  const titleCounts = new Map<string, number>();
  for (const s of normalizedSections) {
    titleCounts.set(s.title, (titleCounts.get(s.title) ?? 0) + 1);
  }
  for (const s of normalizedSections) {
    const parentSectionId = s.parentId;
    if ((titleCounts.get(s.title) ?? 0) > 1 && s.level === 3 && parentSectionId) {
      const parentSection = normalizedSections.find((p) => p.id === parentSectionId);
      if (parentSection) {
        s.title = disambiguateTitle(s.title, parentSection.title);
      }
    }
  }

  const doc = {
    template: classification.template,
    summary:
      normalizedSections.find((section) => section.summary)?.summary ?? null,
    weakness: extractWeaknessFromInfobox(fullHtml),
    recommendedApproach: extractRecommendedApproach(fullHtml),
    teamSize: extractTeamSize(fullHtml),
    combatLevel: extractCombatLevel(fullHtml),
    sections: normalizedSections.map((section) => ({
      id: section.id,
      title: section.title,
      level: section.level,
      parentId: section.parentId,
      html: section.html,
    })),
    blocks: normalizedSections.map((section) => ({
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
  const levelMatch = text.match(/^(\d+)\+?\s*([A-Za-z]+)?/);
  if (!levelMatch) return null;

  const level = parseInt(levelMatch[1], 10);
  const rawSkill = (levelMatch[2] ?? "").trim().toLowerCase();
  const skill = SKILL_NAMES.has(rawSkill)
    ? rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1)
    : rawSkill
      ? rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1)
      : "";

  // Rest of the string after "NN+ SkillName"
  const prefix = levelMatch[0];
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
  } else if (remainder && !boostAllowed && !optional) {
    // Some notes are just plain text
    qualifier = remainder.replace(/^\(|\)$/g, "").trim() || undefined;
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
