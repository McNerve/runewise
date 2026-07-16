import type { MouseEvent as ReactMouseEvent } from "react";
import { handleLightboxClick } from "../../lib/wiki/interactive";

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

/** Click handler for boss-guide HTML: tile-marker copy + lightbox images. */
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

  handleLightboxClick(e);
}
