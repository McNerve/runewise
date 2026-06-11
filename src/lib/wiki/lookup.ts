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
// Generous safety cap — sections are parsed from the already-fetched page, so
// the only cost of a high limit is render time on pathological pages.
const MAX_SECTIONS = 40;
const IGNORED_SECTION_PATTERNS = [
  "changes",
  "history",
  "gallery",
  "references",
  "external links",
  "navigation",
  "update history",
];

export interface WikiLookupSubsection {
  id: string;
  title: string;
}

export interface WikiLookupSection {
  id: string;
  title: string;
  html: string;
  subsections?: WikiLookupSubsection[];
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

// Subsection headings (h3) are demoted to h4 — the only heading tag the
// sanitizer allows — and given stable ids so the table of contents can jump
// to them.
function demoteSubheadings(
  container: Element,
  sectionId: string,
  doc: Document
): WikiLookupSubsection[] {
  const subsections: WikiLookupSubsection[] = [];
  container.querySelectorAll(".mw-heading3, h3").forEach((heading) => {
    if (heading.tagName === "H3" && heading.closest(".mw-heading3")) return;
    const title = cleanValue(heading.textContent ?? "");
    if (!title) {
      heading.remove();
      return;
    }
    const id = `${sectionId}-${slugify(title)}`;
    const replacement = doc.createElement("h4");
    replacement.id = id;
    replacement.textContent = title;
    heading.replaceWith(replacement);
    subsections.push({ id, title });
  });
  return subsections;
}

/**
 * Splits the full page HTML into level-2 sections client-side. The page HTML
 * is already fetched for the lead, so this costs zero extra requests and —
 * unlike the old per-section API calls — never truncates long pages.
 */
export function parseSections(rawHtml: string): WikiLookupSection[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  content
    .querySelectorAll(".navbox, .hatnote, .mw-editsection, .infobox-bonuses-image")
    .forEach((element) => element.remove());

  const isSectionHeading = (el: Element) =>
    el.classList.contains("mw-heading2") || el.tagName === "H2";

  const sections: WikiLookupSection[] = [];
  let currentTitle: string | null = null;
  let bucket: Element[] = [];

  const flush = () => {
    const title = currentTitle;
    currentTitle = null;
    const nodes = bucket;
    bucket = [];
    if (!title || nodes.length === 0) return;

    const lower = title.toLowerCase();
    if (IGNORED_SECTION_PATTERNS.some((pattern) => lower.includes(pattern))) return;

    const id = slugify(title);
    const container = doc.createElement("div");
    nodes.forEach((node) => container.appendChild(node));
    const subsections = demoteSubheadings(container, id, doc);
    stripUnsafeNodes(container);

    const html = sanitizeHtml(container);
    if (html.length < 30) return;

    sections.push({ id, title, html, subsections });
  };

  for (const child of Array.from(content.children)) {
    if (isSectionHeading(child)) {
      flush();
      currentTitle = cleanValue(child.textContent ?? "");
      continue;
    }
    if (currentTitle !== null) bucket.push(child);
  }
  flush();

  return sections.slice(0, MAX_SECTIONS);
}

export interface WikiSearchResult {
  title: string;
  snippet: string | null;
}

// MediaWiki search snippets arrive as HTML with <span class="searchmatch">
// highlights; reduce them to plain text for safe rendering.
function snippetToText(html: string): string {
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Title + snippet search via list=search. Falls back to plain opensearch
 * titles if the response shape ever surprises us — search must never break.
 */
export async function searchWikiPagesRich(query: string): Promise<WikiSearchResult[]> {
  if (query.trim().length < 2) return [];
  try {
    return await fetchJson<WikiSearchResult[]>({
      url: `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=10&format=json`,
      cacheKey: `wiki-lookup-rich-search:${query.toLowerCase()}`,
      ttlMs: LOOKUP_TTL,
      transform: (json) => {
        const search = (json as { query?: { search?: unknown } })?.query?.search;
        if (!Array.isArray(search)) throw new Error("Unexpected wiki search response");
        return search
          .filter(
            (entry): entry is { title: string; snippet?: unknown } =>
              typeof entry === "object" &&
              entry !== null &&
              typeof (entry as { title?: unknown }).title === "string"
          )
          .filter((entry) => !entry.title.includes("/") && !entry.title.startsWith("File:"))
          .map((entry) => ({
            title: entry.title,
            snippet:
              typeof entry.snippet === "string" && entry.snippet.trim()
                ? snippetToText(entry.snippet)
                : null,
          }));
      },
    });
  } catch {
    const titles = await searchWikiPages(query);
    return titles.map((title) => ({ title, snippet: null }));
  }
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

export async function fetchWikiLookupDocument(
  page: string
): Promise<WikiLookupDocument> {
  const cacheKey = `wiki-lookup:v6:${page}`;
  const cached = getCached<WikiLookupDocument>(cacheKey, LOOKUP_TTL);
  if (cached) return cached;

  const fullParse = await fetchWikiHtmlFull(page);

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

  const normalizedSections = parseSections(fullParse.html);

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
