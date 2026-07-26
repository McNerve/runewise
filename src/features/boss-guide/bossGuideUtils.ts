import type { MouseEvent as ReactMouseEvent } from "react";
import { handleLightboxClick } from "../../lib/wiki/interactive";
import { resolveWikiPageFromHref } from "../../lib/wiki/helpers";

/** Weakness label from wiki/infobox → DPS Calc combat style. */
const WEAKNESS_STYLE_MAP: Record<string, string> = {
  stab: "melee",
  slash: "melee",
  crush: "melee",
  melee: "melee",
  ranged: "ranged",
  range: "ranged",
  magic: "magic",
  mage: "magic",
};

export function weaknessToStyle(weakness: string): string {
  return WEAKNESS_STYLE_MAP[weakness.toLowerCase()] ?? "melee";
}

/** Attempt to extract weakness from description prose as fallback. */
export function extractWeaknessFromSummary(summary: string | undefined): string | null {
  if (!summary) return null;
  const m = summary.match(/weak(?:\s+against|\s+to|ness:?)\s+([a-z]+)/i);
  return m?.[1] ?? null;
}

export function normalizeBossSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function scrollToGuideSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Open an in-app wiki page from a guide link. Item-like pages still land on
 * the wiki lookup (Market routing lives in WikiLookup's own click path).
 */
function openWikiPageInApp(page: string): void {
  const hash = `#wiki?page=${encodeURIComponent(page)}&query=${encodeURIComponent(page)}`;
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = hash;
  }
}

/** Click handler for boss-guide HTML: in-app links, tile-marker copy, lightbox. */
export function handleGuideClick(e: ReactMouseEvent): void {
  const target = e.target;

  if (target instanceof HTMLButtonElement && target.classList.contains("tile-marker-copy")) {
    const tiles = target.getAttribute("data-tiles");
    if (tiles) {
      void navigator.clipboard.writeText(tiles).then(() => {
        const original = target.textContent;
        target.textContent = "✓ Copied!";
        target.style.color = "#22c55e";
        target.style.borderColor = "rgba(34,197,94,0.3)";
        setTimeout(() => {
          target.textContent = original;
          target.style.color = "#3b82f6";
          target.style.borderColor = "#2e3345";
        }, 2000);
      });
    }
    return;
  }

  // In-app wiki navigation for rewritten anchors.
  const element =
    target instanceof HTMLElement
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (element) {
    const link = element.closest("a");
    if (link instanceof HTMLAnchorElement) {
      const page =
        link.dataset.wikiPage ||
        resolveWikiPageFromHref(link.getAttribute("href") ?? link.href);
      if (page) {
        e.preventDefault();
        e.stopPropagation();
        openWikiPageInApp(page);
        return;
      }
    }
  }

  handleLightboxClick(e);
}
