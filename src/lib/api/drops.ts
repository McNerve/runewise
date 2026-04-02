import { bucketQueryAll, type BucketWhere } from "./bucket";
import { getCached, setCache } from "./cache";

const DROPS_TTL = 24 * 60 * 60 * 1000;

const DROPS_FIELDS = [
  "page_name",
  "page_name_sub",
  "item_name",
  "drop_json",
  "rare_drop_table",
] as const;

interface RawDropJson {
  Rarity?: string;
  "Drop Quantity"?: string;
  "Quantity Low"?: string;
  "Quantity High"?: string;
  "Drop Value"?: string;
  Rolls?: string;
  "Drop level"?: string;
  "Drop type"?: string;
  "Dropped item"?: string;
  "Dropped from"?: string;
}

interface RawBucketDrop {
  page_name: string;
  page_name_sub?: string;
  item_name: string;
  drop_json?: string;
  rare_drop_table?: string;
}

export interface WikiDrop {
  monsterName: string;
  monsterVersion: string | null;
  itemName: string;
  rarity: string;
  rarityFraction: number | null;
  quantityLow: number;
  quantityHigh: number;
  quantity: string;
  value: number;
  rolls: number;
  dropType: string;
  isRareDropTable: boolean;
}

export interface MonsterDropTable {
  monsterName: string;
  drops: WikiDrop[];
  categories: Map<string, WikiDrop[]>;
}

function parseRarityFraction(rarity: string): number | null {
  if (!rarity) return null;
  if (rarity.toLowerCase() === "always") return 1;

  const match = rarity.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (match) {
    const numerator = parseFloat(match[1]);
    const denominator = parseFloat(match[2]);
    if (denominator > 0) return numerator / denominator;
  }

  return null;
}

function parseQuantity(
  raw: RawDropJson
): { low: number; high: number; display: string } {
  const low = parseInt(raw["Quantity Low"] ?? "1", 10) || 1;
  const high = parseInt(raw["Quantity High"] ?? raw["Quantity Low"] ?? "1", 10) || low;
  const display =
    raw["Drop Quantity"] || (low === high ? String(low) : `${low}–${high}`);
  return { low, high, display };
}

function toWikiDrop(raw: RawBucketDrop): WikiDrop | null {
  if (!raw.item_name || raw.item_name === "Nothing") return null;

  let dropJson: RawDropJson = {};
  if (raw.drop_json) {
    try {
      dropJson = JSON.parse(raw.drop_json) as RawDropJson;
    } catch {
      // Malformed JSON — use defaults
    }
  }

  const rarity = dropJson.Rarity ?? "";
  const qty = parseQuantity(dropJson);

  return {
    monsterName: raw.page_name,
    monsterVersion: raw.page_name_sub || null,
    itemName: raw.item_name,
    rarity,
    rarityFraction: parseRarityFraction(rarity),
    quantityLow: qty.low,
    quantityHigh: qty.high,
    quantity: qty.display,
    value: parseInt(dropJson["Drop Value"] ?? "0", 10) || 0,
    rolls: parseInt(dropJson.Rolls ?? "1", 10) || 1,
    dropType: dropJson["Drop type"] ?? "combat",
    isRareDropTable: raw.rare_drop_table === "Yes",
  };
}

export async function fetchDropsForMonster(
  monsterName: string
): Promise<MonsterDropTable> {
  const cacheKey = `wiki-drops:${monsterName.toLowerCase()}`;
  const cached = getCached<MonsterDropTable>(cacheKey, DROPS_TTL, {
    persist: true,
  });
  if (cached) return cached;

  const raw = await bucketQueryAll<RawBucketDrop>(
    "dropsline",
    [...DROPS_FIELDS],
    { field: "page_name", value: monsterName } as BucketWhere
  );

  const drops = raw
    .map(toWikiDrop)
    .filter((d): d is WikiDrop => d !== null);

  const categories = new Map<string, WikiDrop[]>();
  for (const drop of drops) {
    const cat = drop.isRareDropTable ? "Rare drop table" : (drop.dropType || "Other");
    const existing = categories.get(cat) ?? [];
    existing.push(drop);
    categories.set(cat, existing);
  }

  const table: MonsterDropTable = { monsterName, drops, categories };
  setCache(cacheKey, table, { persist: true });
  return table;
}
