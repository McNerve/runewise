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
  leadHtml: string;
  sections: WikiLookupSection[];
  relatedPages: WikiRelatedPage[];
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

  const relatedPages = collectRelatedPages(content, title).slice(0, 12);
  stripUnsafeNodes(content);

  return {
    summary: extractSummary(content, 80),
    leadHtml: sanitizeHtml(content),
    infoboxTitle,
    infoboxImage,
    infoboxFields: infoboxFields.slice(0, 10),
    relatedPages,
  };
}

function parseSection(rawHtml: string, title: string): WikiLookupSection | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  content.querySelectorAll(".navbox, .hatnote").forEach((element) => element.remove());
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

async function fetchWikiHtml(page: string, section?: string): Promise<string> {
  const url = section == null
    ? `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=text&${WIKI_PARSE_FLAGS}`
    : `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=text&section=${section}&${WIKI_PARSE_FLAGS}`;

  return fetchJson<string>({
    url,
    dedupeKey: `wiki-lookup:${page}:${section ?? "full"}`,
    transform: (json) => ((json as WikiTextResponse).parse?.text?.["*"] ?? "").trim(),
  });
}

export async function fetchWikiLookupDocument(
  page: string
): Promise<WikiLookupDocument> {
  const cacheKey = `wiki-lookup:v3:${page}`;
  const cached = getCached<WikiLookupDocument>(cacheKey, LOOKUP_TTL);
  if (cached) return cached;

  const [fullHtml, sections] = await Promise.all([
    fetchWikiHtml(page),
    fetchWikiSections(page),
  ]);

  const lead = parseLead(fullHtml, page);
  const [classification, relatedPages] = await Promise.all([
    classifyWikiPageInternal(page),
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
        parseSection(await fetchWikiHtml(page, section.number), section.line)
      )
    )
  ).filter((section: WikiLookupSection | null): section is WikiLookupSection => section !== null);

  const document: WikiLookupDocument = {
    title: page,
    pageType: classification.entityKind,
    template: classification.template,
    summary: lead.summary,
    infoboxTitle: lead.infoboxTitle,
    infoboxImage: lead.infoboxImage,
    infoboxFields: lead.infoboxFields,
    leadHtml: lead.leadHtml,
    sections: normalizedSections,
    relatedPages,
    fetchedAt: Date.now(),
  };

  setCache(cacheKey, document);
  return document;
}
