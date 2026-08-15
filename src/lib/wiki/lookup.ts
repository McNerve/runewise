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
  transformTabbers,
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
  /** Sanitized original infobox HTML — preferred over flattened fields. */
  infoboxHtml: string | null;
  /** Wiki hatnotes (disambiguation / "for the strategy guide…") kept as HTML. */
  hatnotes: string[];
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
  let infoboxHtml: string | null = null;
  const infoboxFields: Array<{ label: string; value: string }> = [];
  const hatnotes: string[] = [];

  content.querySelectorAll(".hatnote").forEach((el) => {
    const clone = el.cloneNode(true) as Element;
    stripUnsafeNodes(clone);
    const html = sanitizeHtml(clone);
    if (html.trim().length > 0) hatnotes.push(html);
    el.remove();
  });

  if (infobox) {
    // Switch infoboxes carry every version's value with inactive ones hidden
    // via inline display:none — drop them before extracting fields, or
    // values concatenate ("725725725").
    infobox
      .querySelectorAll('[style*="display:none"], [style*="display: none"]')
      .forEach((el) => el.remove());
    infobox
      .querySelectorAll(".infobox-buttons, .infobox-switch-resources, .infobox-switch")
      .forEach((el) => el.remove());
    normalizeImages(infobox);
    infobox.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src) return;
      const upgraded = src.replace(/\/(\d+)px-/, "/240px-");
      if (upgraded !== src) img.setAttribute("src", upgraded);
    });

    const heading =
      infobox.querySelector("th.infobox-header, th.infobox-title, caption, th[colspan]")?.textContent ??
      title;
    infoboxTitle = cleanValue(heading);

    infoboxImage =
      infobox.querySelector("img")?.getAttribute("src") ??
      null;

    infobox.querySelectorAll("tr").forEach((row) => {
      // Wiki-internal rows (item IDs etc.) are hidden on the wiki; skip them.
      if (row.classList.contains("advanced-data")) return;
      const header = row.querySelector("th");
      const value = row.querySelector("td");
      // <br>-separated values ("Kourend<br>Tirannwn") need a separator or
      // textContent fuses them into one word.
      value?.querySelectorAll("br").forEach((br) => br.replaceWith(", "));
      const label = cleanValue(header?.textContent ?? "");
      const text = cleanValue(value?.textContent ?? "");
      if (label && text && text !== label) {
        infoboxFields.push({ label, value: text });
      }
    });

    const infoboxClone = infobox.cloneNode(true) as Element;
    stripUnsafeNodes(infoboxClone);
    // sanitizeHtml uses innerHTML — wrap so the <table> itself survives.
    const wrap = infobox.ownerDocument.createElement("div");
    wrap.appendChild(infoboxClone);
    const serialized = sanitizeHtml(wrap);
    if (serialized.trim().length > 40) infoboxHtml = serialized;

    infobox.remove();
  }

  // Remove float/infobox furniture from the lead — but keep content tables.
  // Quest pages put their entire requirements table (.questdetails) in the
  // lead; deleting every <table> threw that content away.
  content
    .querySelectorAll(
      "table.infobox:not(.infobox-bonuses), table[style*='float'], .thumb, .infobox-buttons, .infobox-switch-resources, .navigation-not-searchable"
    )
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
  transformTabbers(content, doc);
  stripUnsafeNodes(content);

  return {
    summary: extractSummary(content, 80),
    leadHtml: sanitizeHtml(content),
    infoboxTitle,
    infoboxImage,
    infoboxFields: infoboxFields.slice(0, 24),
    totalInfoboxFields: infoboxFields.length,
    infoboxHtml,
    hatnotes,
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
    .querySelectorAll(".navbox, .hatnote, .mw-editsection")
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
    transformTabbers(container, doc);
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
  thumbnail: string | null;
}

// MediaWiki search snippets arrive as HTML with <span class="searchmatch">
// highlights; reduce them to plain text for safe rendering.
function snippetToText(html: string): string {
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").trim();
}

// Batched page thumbnails for search results. Purely decorative — any
// failure returns an empty map and the results render without images.
async function fetchSearchThumbnails(titles: string[]): Promise<Record<string, string>> {
  if (titles.length === 0) return {};
  try {
    return await fetchJson<Record<string, string>>({
      url: `${WIKI_API}?action=query&titles=${encodeURIComponent(titles.join("|"))}&prop=pageimages&piprop=thumbnail&pithumbsize=64&redirects=1&format=json`,
      cacheKey: `wiki-lookup-thumbs:${titles.join("|").toLowerCase()}`,
      ttlMs: LOOKUP_TTL,
      transform: (json) => {
        const pages = (json as { query?: { pages?: Record<string, unknown> } })?.query?.pages;
        const out: Record<string, string> = {};
        if (pages && typeof pages === "object") {
          for (const page of Object.values(pages)) {
            const p = page as { title?: unknown; thumbnail?: { source?: unknown } };
            if (typeof p.title === "string" && typeof p.thumbnail?.source === "string") {
              out[p.title] = p.thumbnail.source;
            }
          }
        }
        return out;
      },
    });
  } catch {
    return {};
  }
}

/**
 * Title + snippet + thumbnail search via list=search. Falls back to plain
 * opensearch titles if the response shape ever surprises us — search must
 * never break.
 */
export async function searchWikiPagesRich(query: string): Promise<WikiSearchResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const results = await fetchJson<Omit<WikiSearchResult, "thumbnail">[]>({
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
          .filter(
            (entry) =>
              !entry.title.startsWith("File:") &&
              !entry.title.startsWith("Category:") &&
              !entry.title.startsWith("Template:") &&
              !entry.title.startsWith("Update:")
          )
          .map((entry) => ({
            title: entry.title,
            snippet:
              typeof entry.snippet === "string" && entry.snippet.trim()
                ? snippetToText(entry.snippet)
                : null,
          }));
      },
    });
    const thumbnails = await fetchSearchThumbnails(results.map((r) => r.title));
    return results.map((r) => ({ ...r, thumbnail: thumbnails[r.title] ?? null }));
  } catch {
    const titles = await searchWikiPages(query);
    return titles.map((title) => ({ title, snippet: null, thumbnail: null }));
  }
}

export interface WikiPageSummary {
  title: string;
  summary: string | null;
  image: string | null;
  fields: Array<{ label: string; value: string }>;
}

/**
 * Lightweight page preview (lead section only) for wiki-style hover popups:
 * thumbnail, first paragraph, and the top infobox facts.
 */
export async function fetchWikiSummary(page: string): Promise<WikiPageSummary | null> {
  const cacheKey = `wiki-summary:v1:${page.toLowerCase()}`;
  const cached = getCached<WikiPageSummary>(cacheKey, 24 * 60 * 60 * 1000);
  if (cached) return cached;

  try {
    const result = await fetchJson<{ html: string; title: string }>({
      url: `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=text&section=0&${WIKI_PARSE_FLAGS}`,
      dedupeKey: `wiki-summary:${page}`,
      transform: (json) => {
        const parsed = json as WikiTextResponse & { parse?: { title?: string } };
        return {
          html: (parsed.parse?.text?.["*"] ?? "").trim(),
          title: parsed.parse?.title ?? page,
        };
      },
    });
    if (!result.html) return null;

    const lead = parseLead(result.html, result.title);
    const summary: WikiPageSummary = {
      title: result.title,
      summary: lead.summary,
      image: lead.infoboxImage,
      fields: lead.infoboxFields.slice(0, 4),
    };
    setCache(cacheKey, summary);
    return summary;
  } catch {
    return null;
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
        .filter(
          (title) =>
            !title.startsWith("File:") &&
            !title.startsWith("Category:") &&
            !title.startsWith("Template:")
        );
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

/**
 * Build a wiki article from already-fetched parse HTML (shared by Wiki
 * Lookup and Boss Guides so raid/strategy pages don't pay a second fetch).
 */
/** Copy infobox chrome from another parse (main boss page → /Strategies). */
export function applyInfoboxFromHtml(
  article: WikiLookupDocument,
  rawHtml: string,
  title: string
): WikiLookupDocument {
  const extra = buildWikiLookupDocumentFromHtml(rawHtml, title, article.pageType);
  if (!extra.infoboxHtml && extra.infoboxFields.length === 0) return article;
  return {
    ...article,
    infoboxHtml: extra.infoboxHtml ?? article.infoboxHtml,
    infoboxTitle: extra.infoboxTitle ?? article.infoboxTitle,
    infoboxImage: extra.infoboxImage ?? article.infoboxImage,
    infoboxFields:
      extra.infoboxFields.length > 0 ? extra.infoboxFields : article.infoboxFields,
    totalInfoboxFields: extra.totalInfoboxFields || article.totalInfoboxFields,
  };
}

export function buildWikiLookupDocumentFromHtml(
  rawHtml: string,
  title: string,
  pageType: WikiEntityKind = "reference"
): WikiLookupDocument {
  const lead = parseLead(rawHtml, title);
  return {
    title,
    pageType,
    template: "reference",
    summary: lead.summary,
    infoboxTitle: lead.infoboxTitle,
    infoboxImage: lead.infoboxImage,
    infoboxFields: lead.infoboxFields,
    totalInfoboxFields: lead.totalInfoboxFields,
    infoboxHtml: lead.infoboxHtml,
    hatnotes: lead.hatnotes,
    leadHtml: lead.leadHtml,
    sections: parseSections(rawHtml),
    relatedPages: [],
    totalRelatedPages: lead.relatedPages.length,
    fetchedAt: Date.now(),
  };
}

export async function fetchWikiLookupDocument(
  page: string
): Promise<WikiLookupDocument> {
  const cacheKey = `wiki-lookup:v12:${page}`;
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
    infoboxHtml: lead.infoboxHtml,
    hatnotes: lead.hatnotes,
    leadHtml: lead.leadHtml,
    sections: normalizedSections,
    relatedPages,
    totalRelatedPages,
    fetchedAt: Date.now(),
  };

  setCache(cacheKey, document);
  return document;
}
