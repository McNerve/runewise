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

interface WikiSection {
  number: string;
  line: string;
}

export interface BossGuideSection {
  id: string;
  title: string;
  html: string;
}

export interface BossGuideDocument {
  template: WikiGuideTemplate;
  summary: string | null;
  sections: BossGuideSection[];
  blocks: WikiGuideBlock[];
  fetchedAt: number;
}

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
] as const;

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

  // Add tooltips: copy alt text to title so hovering shows item names
  content.querySelectorAll("img[alt]").forEach((img) => {
    const alt = img.getAttribute("alt");
    if (alt && !img.getAttribute("title")) {
      img.setAttribute("title", alt);
    }
  });

  // Equipment layout is handled by CSS using the wiki's class names

  // Convert hidden tile marker data into a visible copy button
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
  if (
    firstParagraph &&
    (firstParagraph.textContent ?? "").trim().toLowerCase() ===
      sectionTitle.trim().toLowerCase()
  ) {
    firstParagraph.remove();
  }

  normalizeImages(content);

  const summary = extractSummary(content);
  const sanitized = sanitizeHtmlStrict(content);

  return { html: sanitized, summary };
}

async function fetchWikiSections(wikiPage: string): Promise<WikiSection[]> {
  return fetchJson<WikiSection[]>({
    url: `${WIKI_API}?action=parse&page=${wikiPage}&prop=sections&format=json`,
    cacheKey: `boss-guide-sections:v2:${wikiPage}`,
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

function normalizeHeadingMatch(input: string) {
  return input
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractSectionHtmlFromFullPage(fullHtml: string, sectionTitle: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, "text/html");
  const content = doc.querySelector(".mw-parser-output") || doc.body;

  const headingContainer = Array.from(
    content.querySelectorAll(".mw-heading2, .mw-heading3, h2, h3")
  ).find((node) => {
    const heading =
      node.matches("h2, h3")
        ? node
        : node.querySelector("h2, h3");
    const text = heading?.textContent ?? node.textContent ?? "";
    return normalizeHeadingMatch(text) === normalizeHeadingMatch(sectionTitle);
  });

  if (!headingContainer) return "";

  const fragment = document.createElement("div");
  let cursor = headingContainer.nextElementSibling;

  while (cursor) {
    const isTopLevelBreak =
      cursor.matches(".mw-heading2, h2") ||
      (cursor.matches(".mw-heading3, h3") &&
        !headingContainer.matches(".mw-heading3, h3"));

    if (isTopLevelBreak) break;

    fragment.appendChild(cursor.cloneNode(true));
    cursor = cursor.nextElementSibling;
  }

  return fragment.innerHTML.trim();
}

async function fetchSectionsWithFallback(wikiPage: string) {
  const hasStrategies = wikiPage.endsWith("/Strategies");
  const altPage = hasStrategies
    ? wikiPage.replace(/\/Strategies$/, "")
    : `${wikiPage}/Strategies`;

  // Try both pages in parallel — use whichever has more matching sections
  const [sections, altSections] = await Promise.all([
    fetchWikiSections(wikiPage).catch(() => [] as WikiSection[]),
    fetchWikiSections(altPage).catch(() => [] as WikiSection[]),
  ]);

  const matched = sections.filter((s) =>
    SECTION_LABELS.some((l) => s.line.toLowerCase().includes(l))
  );
  const altMatched = altSections.filter((s) =>
    SECTION_LABELS.some((l) => s.line.toLowerCase().includes(l))
  );

  return altMatched.length > matched.length
    ? { page: altPage, sections: altMatched }
    : matched.length > 0
      ? { page: wikiPage, sections: matched }
      : { page: altPage, sections: altMatched };
}

export async function fetchBossGuideDocument(
  wikiPage: string
): Promise<BossGuideDocument> {
  const cacheKey = `boss-guide:v4:${wikiPage}`;
  const cached = getCached<BossGuideDocument>(cacheKey, GUIDE_TTL);
  if (cached) return cached;

  const { page: resolvedPage, sections: targetSections } =
    await fetchSectionsWithFallback(wikiPage);

  const [classification, fullHtml] = await Promise.all([
    classifyWikiPage(resolvedPage),
    fetchFullHtml(resolvedPage),
  ]);

  const normalizedSections = (
    await Promise.all(
      targetSections.map(async (section) => {
        const rawHtml =
          extractSectionHtmlFromFullPage(fullHtml, section.line) ||
          (await fetchSectionHtml(resolvedPage, section.number));
        const { html, summary } = cleanSectionHtml(rawHtml, section.line);
        if (html.length < 20) return null;
        return {
          id: slugify(section.line),
          title: section.line,
          html,
          summary,
        };
      })
    )
  ).filter(
    (
      section
    ): section is BossGuideSection & { summary: string | null } => section !== null
  );

  const document = {
    template: classification.template,
    summary:
      normalizedSections.find((section) => section.summary)?.summary ?? null,
    sections: normalizedSections.map((section) => ({
      id: section.id,
      title: section.title,
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

  setCache(cacheKey, document);
  return document;
}
