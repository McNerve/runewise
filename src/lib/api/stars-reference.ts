import { fetchJson } from "./client";
import { isTauri } from "../env";
import type { StarSite } from "../data/stars";

const WIKI_API = isTauri
  ? "https://oldschool.runescape.wiki/api.php"
  : "/api/wiki-content";

const STARS_REFERENCE_TTL = 24 * 60 * 60 * 1000;

interface WikiTextResponse {
  parse?: {
    text?: {
      "*": string;
    };
  };
}

function parseInlineMapStyle(style: string | null) {
  if (!style) return null;

  const widthMatch = style.match(/width:\s*(\d+)px/i);
  const heightMatch = style.match(/height:\s*(\d+)px/i);
  const backgroundImageMatch = style.match(/background-image:\s*([^;]+);?/i);
  const backgroundPositionMatch = style.match(/background-position:\s*([^;]+);?/i);
  const backgroundRepeatMatch = style.match(/background-repeat:\s*([^;]+);?/i);

  const width = Number(widthMatch?.[1] ?? 0);
  const height = Number(heightMatch?.[1] ?? 0);
  const backgroundImage = backgroundImageMatch?.[1]?.trim() ?? "";
  const backgroundPosition = backgroundPositionMatch?.[1]?.trim() ?? "";
  const backgroundRepeat = backgroundRepeatMatch?.[1]?.trim() ?? "no-repeat";

  if (!width || !height || !backgroundImage) return null;

  return {
    width,
    height,
    backgroundImage,
    backgroundPosition,
    backgroundRepeat,
  };
}

function cleanCellText(cell: Element): string {
  const clone = cell.cloneNode(true) as Element;
  clone.querySelectorAll("sup, .mw-editsection").forEach((node) => node.remove());
  clone.querySelectorAll("br").forEach((node) => node.replaceWith(document.createTextNode("\n")));
  return (clone.textContent ?? "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function parseTeleportList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/\[[^\]]+\]/g, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function parseStarLandingSites(html: string): StarSite[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const root = doc.querySelector(".mw-parser-output") || doc.body;
  const landingHeading = root.querySelector("#Landing_sites")?.closest("h2");
  if (!landingHeading) return [];

  const sites: StarSite[] = [];
  let currentRegion = "";
  let node = landingHeading.nextElementSibling;

  while (node) {
    if (node.tagName === "H2") break;

    if (node.tagName === "DIV") {
      const title = node.textContent?.replace(/\[.*?\]/g, "").trim() ?? "";
      if (title) currentRegion = title;
    }

    if (node.tagName === "TABLE" && currentRegion) {
      const rows = Array.from(node.querySelectorAll("tr")).slice(1);
      for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length < 2) continue;

        const location = cleanCellText(cells[0]).split("\n")[0] ?? "";
        const teleports = parseTeleportList(cleanCellText(cells[1]));
        const mapPreview = parseInlineMapStyle(
          cells[2]?.querySelector(".mw-kartographer-map")?.getAttribute("style") ?? null
        );
        if (!location) continue;

        sites.push({
          name: location,
          region: currentRegion,
          teleports,
          mapPreview: mapPreview ?? undefined,
        });
      }
    }

    node = node.nextElementSibling;
  }

  return sites;
}

export async function fetchStarLandingSites(): Promise<StarSite[]> {
  return fetchJson<StarSite[]>({
    url: `${WIKI_API}?action=parse&page=Shooting_Stars&prop=text&format=json`,
    cacheKey: "stars-reference:landing-sites:v3",
    ttlMs: STARS_REFERENCE_TTL,
    transform: (json) => parseStarLandingSites(((json as WikiTextResponse).parse?.text?.["*"] ?? "").trim()),
  });
}
