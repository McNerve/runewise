import DOMPurify from "dompurify";
import { isTauri } from "../env";

export const WIKI_API = isTauri
  ? "https://oldschool.runescape.wiki/api.php"
  : "/api/wiki-content";

export const WIKI_PARSE_FLAGS = "format=json&redirects=1";

const SANITIZE_TAGS = [
  "p",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "strong",
  "em",
  "b",
  "i",
  "br",
  "img",
  "span",
  "div",
  "button",
  "blockquote",
  "details",
  "summary",
  "h4",
  "h5",
  "code",
  "a",
] as const;

const SANITIZE_ATTRS = [
  "src",
  "alt",
  "loading",
  "colspan",
  "rowspan",
  "href",
  "target",
  "rel",
  "class",
  "title",
  "data-wiki-page",
  "data-title",
  "data-slot",
  "data-tiles",
] as const;

const UNSAFE_SELECTORS =
  "script, style, sup.reference, .mw-editsection, .navbox, .catlinks, .printfooter, .noprint, iframe, object, embed, form, .toc, #toc, [role='navigation'], .mw-headline-anchor, .infobox-switch-resources, .navigation-not-searchable, .advanced-data, .smwfact, .redirectMsg";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function cleanValue(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function resolveWikiPageFromHref(href: string): string | null {
  if (!href || href.startsWith("#")) return null;

  try {
    const base = href.startsWith("http")
      ? new URL(href)
      : new URL(href, "https://oldschool.runescape.wiki");

    if (base.hostname !== "oldschool.runescape.wiki") return null;
    if (!base.pathname.startsWith("/w/")) return null;

    const page = decodeURIComponent(base.pathname.replace(/^\/w\//, ""))
      .replace(/_/g, " ")
      .trim();

    if (!page || page.startsWith("File:") || page.startsWith("Special:")) {
      return null;
    }

    return page;
  } catch {
    return null;
  }
}

export function buildWikiAppHref(page: string): string {
  const params = new URLSearchParams({ page, query: page });
  return `#wiki?${params.toString()}`;
}

export function normalizeImages(root: Element): void {
  root.querySelectorAll("img").forEach((img) => {
    const dataSrc = img.getAttribute("data-src");
    if (dataSrc) {
      img.setAttribute("src", dataSrc);
      img.removeAttribute("data-src");
    }

    const src = img.getAttribute("src") || "";
    if (src.startsWith("//")) {
      img.setAttribute("src", `https:${src}`);
    } else if (src.startsWith("/")) {
      img.setAttribute("src", `https://oldschool.runescape.wiki${src}`);
    }

    img.removeAttribute("srcset");
    img.removeAttribute("data-file-width");
    img.removeAttribute("data-file-height");
    img.setAttribute("loading", "lazy");
  });
}

export function normalizeLinks(root: Element): void {
  root.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") ?? "";
    const internalPage = resolveWikiPageFromHref(href);

    if (internalPage) {
      link.setAttribute("href", buildWikiAppHref(internalPage));
      link.setAttribute("data-wiki-page", internalPage);
      link.removeAttribute("target");
      link.removeAttribute("rel");
      return;
    }

    if (href.startsWith("//")) {
      link.setAttribute("href", `https:${href}`);
    } else if (href.startsWith("/")) {
      link.setAttribute("href", `https://oldschool.runescape.wiki${href}`);
    }

    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

export function normalizeGalleries(root: Element): void {
  root.querySelectorAll("ul.gallery").forEach((gallery) => {
    const normalizedList = document.createElement("ul");

    gallery.querySelectorAll("li.gallerybox").forEach((entry) => {
      const item = document.createElement("li");
      const image = entry.querySelector("img");
      const captionText =
        entry.querySelector(".gallerytext")?.textContent?.trim() ?? "";

      if (image) {
        item.appendChild(image.cloneNode(true));
      }

      if (captionText) {
        const caption = document.createElement("p");
        caption.textContent = captionText.replace(/\s+/g, " ").trim();
        item.appendChild(caption);
      }

      if (item.childNodes.length > 0) {
        normalizedList.appendChild(item);
      }
    });

    gallery.replaceWith(normalizedList);
  });
}

export function stripUnsafeNodes(root: Element): void {
  root.querySelectorAll(UNSAFE_SELECTORS).forEach((el) => el.remove());

  root.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    }
  });

  normalizeLinks(root);
  normalizeImages(root);
}

export function sanitizeHtml(root: Element): string {
  return DOMPurify.sanitize(root.innerHTML.trim(), {
    ALLOWED_TAGS: [...SANITIZE_TAGS],
    ALLOWED_ATTR: [...SANITIZE_ATTRS],
  });
}

export function sanitizeHtmlStrict(root: Element): string {
  return DOMPurify.sanitize(root.innerHTML.trim(), {
    ALLOWED_TAGS: SANITIZE_TAGS.filter((t) => t !== "a"),
    ALLOWED_ATTR: SANITIZE_ATTRS.filter(
      (a) => !["href", "target", "rel", "data-wiki-page"].includes(a)
    ),
  });
}

export function extractSummary(
  root: Element,
  minLength = 60
): string | null {
  const paragraph = Array.from(root.querySelectorAll("p")).find(
    (node) => (node.textContent ?? "").trim().length > minLength
  );
  return paragraph?.textContent?.trim() ?? null;
}

export interface WikiTextResponse {
  parse?: {
    text?: {
      "*": string;
    };
  };
}
