import { apiFetch } from "./fetch";
import { getCached, setCache } from "./cache";
import { WIKI_API } from "../wiki/helpers";

const SEARCH_TTL = 60 * 60 * 1000; // 1 hour
const DROPS_TTL = 30 * 60 * 1000; // 30 minutes
const DROP_SECTION_NAMES = [
  "drops",
  "rewards",
  "reward chest",
  "rewards chest",
  "loot",
  "unique rewards",
  "uniques",
] as const;

export interface DropItem {
  name: string;
  quantity: string;
  rarity: string;
  price: string;
  category: string;
}

export async function searchMonsters(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  const cacheKey = `monster-search:v2:${query.toLowerCase()}`;
  const cached = getCached<string[]>(cacheKey, SEARCH_TTL);
  if (cached) return cached;

  // Search wiki pages within the Monsters category
  const url = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}+incategory:Monsters&srnamespace=0&srlimit=15&format=json`;
  const res = await apiFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const searchResults = data?.query?.search ?? [];
  const results: string[] = (searchResults as { title: string }[])
    .map((r) => r.title)
    .filter(
      (name) =>
        !name.includes("/") &&
        !name.includes("(mounted)") &&
        !name.includes("(unobtainable")
    );
  setCache(cacheKey, results);
  return results;
}

export async function fetchDropTable(
  monsterName: string
): Promise<{ categories: { name: string; drops: DropItem[] }[] }> {
  const cacheKey = `drops:${monsterName.toLowerCase()}`;
  const cached = getCached<{ categories: { name: string; drops: DropItem[] }[] }>(
    cacheKey,
    DROPS_TTL
  );
  if (cached) return cached;

  // Find the drops section
  const sectionsUrl = `${WIKI_API}?action=parse&page=${encodeURIComponent(monsterName)}&prop=sections&format=json`;
  const sectionsRes = await apiFetch(sectionsUrl);
  if (!sectionsRes.ok) return { categories: [] };
  const sectionsData = await sectionsRes.json();

  if (!sectionsData.parse) {
    return { categories: [] };
  }

  const sections = sectionsData.parse.sections as {
    number: string;
    line: string;
    level: string;
  }[];
  const dropsSection = sections.find((s) => {
    const lower = s.line.toLowerCase().trim();
    return DROP_SECTION_NAMES.some((name) => lower === name || lower.includes(name));
  });

  if (!dropsSection) {
    return { categories: [] };
  }

  // Fetch the drops section HTML
  const dropsUrl = `${WIKI_API}?action=parse&page=${encodeURIComponent(monsterName)}&prop=text&section=${dropsSection.number}&format=json`;
  const dropsRes = await apiFetch(dropsUrl);
  if (!dropsRes.ok) return { categories: [] };
  const dropsData = await dropsRes.json();
  const html = dropsData.parse.text["*"];

  // Parse HTML into structured drop data
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const categories: { name: string; drops: DropItem[] }[] = [];
  let currentCategory = "Drops";

  // Walk through all child elements of the content
  const container = doc.querySelector(".mw-parser-output") || doc.body;
  for (const el of Array.from(container.children)) {
    // Headings use <h2>-<h5> with <span class="mw-headline">
    if (/^H[2-5]$/.test(el.tagName)) {
      const headline = el.querySelector(".mw-headline");
      const text = (headline?.textContent ?? el.textContent ?? "").trim();
      if (text) currentCategory = text;
    }

    // Drop tables have class "item-drops"
    if (el.tagName === "TABLE" && el.classList.contains("item-drops")) {
      const rows = el.querySelectorAll("tr");
      const drops: DropItem[] = [];

      rows.forEach((row, i) => {
        if (i === 0) return; // skip header
        row.querySelectorAll("sup").forEach((sup) => sup.remove());
        const cells = row.querySelectorAll("td");
        if (cells.length >= 5) {
          // Columns: [icon, name, quantity, rarity, price, high alch]
          const name = cells[1]?.textContent?.trim() ?? "";
          const quantity = cells[2]?.textContent?.trim() ?? "";
          const rarity = cells[3]?.textContent?.trim() ?? "";
          const price = cells[4]?.textContent?.trim() ?? "";

          if (name && name !== "Nothing") {
            drops.push({
              name,
              quantity,
              rarity,
              price,
              category: currentCategory,
            });
          }
        }
      });

      if (drops.length > 0) {
        categories.push({ name: currentCategory, drops });
      }
    }
  }

  const result = { categories };
  setCache(cacheKey, result);
  return result;
}
