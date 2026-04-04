import { fetchJson } from "../api/client";
import { getCached, setCache } from "../api/cache";
import type { WikiGuideTemplate } from "./blocks";
import {
  classifyWikiEntityKind,
  classifyWikiPage as classifyWikiPageInternal,
  type WikiEntityKind,
} from "./classify";
import {
  WIKI_API,
  WIKI_PARSE_FLAGS,
  slugify,
  cleanValue,
  normalizeImages,
  stripUnsafeNodes,
  sanitizeHtml,
  extractSummary,
  resolveWikiPageFromHref,
  type WikiTextResponse,
} from "./helpers";

export { resolveWikiPageFromHref } from "./helpers";
export type { WikiEntityKind } from "./classify";

const LOOKUP_TTL = 60 * 60 * 1000;
const MAX_SECTIONS = 6;
const IGNORED_SECTION_PATTERNS = [
  "changes",
  "history",
  "gallery",
  "references",
  "external links",
  "navigation",
  "update history",
];

interface WikiLookupApiSection {
  number: string;
  line: string;
  level: string;
}

export interface WikiLookupSection {
  id: string;
  title: string;
  html: string;
}

export interface WikiRelatedPage {
  title: string;
  kind: WikiEntityKind;
}

export interface WikiLookupDocument {
  title: string;
  pageType: WikiEntityKind;
  template: WikiGuideTemplate;
  summary: string | null;
  infoboxTitle: string | null;
  infoboxImage: string | null;
  infoboxFields: Array<{ label: string; value: string }>;
  totalInfoboxFields: number;
  leadHtml: string;
  sections: WikiLookupSection[];
  relatedPages: WikiRelatedPage[];
  totalRelatedPages: number;
  fetchedAt: number;
}

export async function classifyWikiPage(page: string): Promise<WikiEntityKind> {
  return classifyWikiEntityKind(page);
}

function collectRelatedPages(root: Element, currentTitle: string): string[] {
  const seen = new Set<string>();
  const related: string[] = [];

  root.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") ?? "";
    const page = resolveWikiPageFromHref(href);
    if (!page) return;
    if (page === currentTitle) return;
    if (seen.has(page)) return;
    seen.add(page);
    related.push(page);
  });

  return related;
}

function parseLead(rawHtml: string, title: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  const infobox =
    content.querySelector(".infobox") ||
    content.querySelector(".wikitable.infobox") ||
    content.querySelector("table[style*='float:right']");

  let infoboxTitle: string | null = null;
  let infoboxImage: string | null = null;
  const infoboxFields: Array<{ label: string; value: string }> = [];

  if (infobox) {
    normalizeImages(infobox);

    const heading =
      infobox.querySelector("th.infobox-header, th.infobox-title, caption, th[colspan]")?.textContent ??
      title;
    infoboxTitle = cleanValue(heading);

    infoboxImage =
      infobox.querySelector("img")?.getAttribute("src") ??
      null;

    infobox.querySelectorAll("tr").forEach((row) => {
      const header = row.querySelector("th");
      const value = row.querySelector("td");
      const label = cleanValue(header?.textContent ?? "");
      const text = cleanValue(value?.textContent ?? "");
      if (label && text && text !== label) {
        infoboxFields.push({ label, value: text });
      }
    });

    infobox.remove();
  }

  content
    .querySelectorAll("table, .thumb, .infobox-buttons, .hatnote, .infobox-switch-resources, .navigation-not-searchable")
    .forEach((element) => element.remove());

  // Truncate at first section heading — only keep lead content
  // .mw-heading2 wrappers are direct children; bare h2s may also be direct children
  const children = Array.from(content.children);
  let truncateFrom = -1;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (
      child.classList.contains("mw-heading2") ||
      child.classList.contains("mw-heading3") ||
      child.tagName === "H2" ||
      child.tagName === "H3"
    ) {
      truncateFrom = i;
      break;
    }
  }
  if (truncateFrom >= 0) {
    for (let i = children.length - 1; i >= truncateFrom; i--) {
      children[i].remove();
    }
  }

  // Remove standalone images not inside text (duplicate of sidebar infobox image)
  content.querySelectorAll("a > img, div > img").forEach((img) => {
    const parent = img.parentElement;
    if (!parent) return;
    const tag = parent.tagName;
    if (tag === "P" || tag === "LI" || tag === "TD" || tag === "TH") return;
    if (parent.children.length === 1) parent.remove();
    else img.remove();
  });

  const relatedPages = collectRelatedPages(content, title).slice(0, 12);
  stripUnsafeNodes(content);

  return {
    summary: extractSummary(content, 80),
    leadHtml: sanitizeHtml(content),
    infoboxTitle,
    infoboxImage,
    infoboxFields: infoboxFields.slice(0, 15),
    totalInfoboxFields: infoboxFields.length,
    relatedPages,
  };
}

function parseSection(rawHtml: string, title: string): WikiLookupSection | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  content.querySelectorAll(".navbox, .hatnote, .mw-editsection").forEach((element) => element.remove());

  // Strip duplicate heading that matches section title (including wrapper div)
  const titleNorm = title.trim().toLowerCase();
  const headingWrapper = content.querySelector(".mw-heading2, .mw-heading3");
  if (headingWrapper) {
    const headingText = (headingWrapper.textContent ?? "").trim().toLowerCase();
    if (headingText === titleNorm) headingWrapper.remove();
  }
  // Fallback: bare heading without wrapper
  const firstHeading = content.querySelector("h2, h3");
  if (firstHeading) {
    const headingText = (firstHeading.textContent ?? "").trim().toLowerCase();
    if (headingText === titleNorm) firstHeading.remove();
  }

  // Strip character model images from equipment bonuses tables
  content.querySelectorAll(".infobox-bonuses-image").forEach((el) => el.remove());

  stripUnsafeNodes(content);

  const html = sanitizeHtml(content);
  if (html.length < 30) return null;

  return {
    id: slugify(title),
    title,
    html,
  };
}

export async function searchWikiPages(query: string): Promise<string[]> {
  if (query.trim().length < 2) return [];

  return fetchJson<string[]>({
    url: `${WIKI_API}?action=opensearch&search=${encodeURIComponent(query)}&namespace=0&limit=10&format=json`,
    cacheKey: `wiki-lookup-search:${query.toLowerCase()}`,
    ttlMs: LOOKUP_TTL,
    transform: (json) => {
      const titles = Array.isArray(json) ? json[1] : [];
      if (!Array.isArray(titles)) return [];
      return titles
        .filter((title): title is string => typeof title === "string")
        .filter((title) => !title.includes("/") && !title.startsWith("File:"));
    },
  });
}

async function fetchWikiSections(page: string) {
  return fetchJson<WikiLookupApiSection[]>({
    url: `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=sections&${WIKI_PARSE_FLAGS}`,
    cacheKey: `wiki-lookup-sections:${page}`,
    ttlMs: LOOKUP_TTL,
    transform: (json) =>
      typeof json === "object" &&
      json !== null &&
      "parse" in json &&
      typeof json.parse === "object" &&
      json.parse !== null &&
      "sections" in json.parse &&
      Array.isArray(json.parse.sections)
        ? (json.parse.sections as WikiLookupApiSection[])
        : [],
  });
}

interface WikiFullParseResult {
  html: string;
  canonicalTitle: string;
}

async function fetchWikiHtmlFull(page: string): Promise<WikiFullParseResult> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=text&${WIKI_PARSE_FLAGS}`;
  return fetchJson<WikiFullParseResult>({
    url,
    dedupeKey: `wiki-lookup:${page}:full`,
    transform: (json) => {
      const parsed = json as WikiTextResponse & { parse?: { title?: string } };
      return {
        html: (parsed.parse?.text?.["*"] ?? "").trim(),
        canonicalTitle: parsed.parse?.title ?? page,
      };
    },
  });
}

async function fetchWikiHtmlSection(page: string, section: string): Promise<string> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=text&section=${section}&${WIKI_PARSE_FLAGS}`;
  return fetchJson<string>({
    url,
    dedupeKey: `wiki-lookup:${page}:${section}`,
    transform: (json) => ((json as WikiTextResponse).parse?.text?.["*"] ?? "").trim(),
  });
}

export async function fetchWikiLookupDocument(
  page: string
): Promise<WikiLookupDocument> {
  const cacheKey = `wiki-lookup:v5:${page}`;
  const cached = getCached<WikiLookupDocument>(cacheKey, LOOKUP_TTL);
  if (cached) return cached;

  const [fullParse, sections] = await Promise.all([
    fetchWikiHtmlFull(page),
    fetchWikiSections(page),
  ]);

  const canonicalTitle = fullParse.canonicalTitle;
  const lead = parseLead(fullParse.html, canonicalTitle);
  const totalRelatedPages = lead.relatedPages.length;
  const [classification, relatedPages] = await Promise.all([
    classifyWikiPageInternal(canonicalTitle),
    Promise.all(
      lead.relatedPages.slice(0, 12).map(async (relatedPage) => ({
        title: relatedPage,
        kind: await classifyWikiEntityKind(relatedPage),
      }))
    ),
  ]);

  const selectedSections = sections
    .filter((section: WikiLookupApiSection) => section.level === "2")
    .filter((section: WikiLookupApiSection) => {
      const lower = section.line.toLowerCase();
      return !IGNORED_SECTION_PATTERNS.some((pattern) => lower.includes(pattern));
    })
    .slice(0, MAX_SECTIONS);

  const normalizedSections = (
    await Promise.all(
      selectedSections.map(async (section) =>
        parseSection(await fetchWikiHtmlSection(page, section.number), section.line)
      )
    )
  ).filter((section: WikiLookupSection | null): section is WikiLookupSection => section !== null);

  const document: WikiLookupDocument = {
    title: canonicalTitle,
    pageType: classification.entityKind,
    template: classification.template,
    summary: lead.summary,
    infoboxTitle: lead.infoboxTitle,
    infoboxImage: lead.infoboxImage,
    infoboxFields: lead.infoboxFields,
    totalInfoboxFields: lead.totalInfoboxFields,
    leadHtml: lead.leadHtml,
    sections: normalizedSections,
    relatedPages,
    totalRelatedPages,
    fetchedAt: Date.now(),
  };

  setCache(cacheKey, document);
  return document;
}
