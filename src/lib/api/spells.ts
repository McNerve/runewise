import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";

const CACHE_KEY = "wiki-spells:v4";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const SPELL_FIELDS = [
  "page_name",
  "image",
  "is_members_only",
  "spellbook",
  "uses_material",
  "json",
] as const;

interface RawBucketSpell {
  [key: string]: unknown;
  page_name: string;
  image?: string;
  is_members_only?: string;
  spellbook?: string;
  uses_material?: string;
  json?: string;
}

interface SpellJson {
  level?: number;
  exp?: number;
  damage?: number;
  cost?: string;
  type?: string;
  spellbook?: string;
  slayer_level?: number;
}

export type Spellbook = "normal" | "ancient" | "lunar" | "arceuus";

export interface WikiSpell {
  name: string;
  spellbook: Spellbook;
  level: number;
  xp: number;
  damage: number | null;
  members: boolean;
  image: string | null;
  runes: unknown;
  cost: string | null;
  type: string | null;
}

function normalizeSpellbook(raw: string | undefined): Spellbook {
  if (!raw) return "normal";
  const lower = raw.toLowerCase();
  if (lower.includes("ancient")) return "ancient";
  if (lower.includes("lunar")) return "lunar";
  if (lower.includes("arceuus") || lower.includes("necromancy")) return "arceuus";
  return "normal";
}

function toWikiSpell(raw: RawBucketSpell): WikiSpell | null {
  let json: SpellJson | null = null;
  if (raw.json) {
    try {
      json = JSON.parse(raw.json) as SpellJson;
    } catch {
      // Malformed
    }
  }

  const level = json?.level ?? 0;
  if (level === 0) return null;
  if (raw.page_name.includes(":")) return null;
  if (raw.page_name.toLowerCase().includes("(beta)")) return null;

  return {
    name: raw.page_name,
    spellbook: normalizeSpellbook(raw.spellbook || json?.spellbook),
    level,
    xp: json?.exp ?? 0,
    damage: json?.damage ?? null,
    members: raw.is_members_only === "Yes",
    image: raw.image || null,
    runes: raw.uses_material || null,
    cost: json?.cost || null,
    type: json?.type || null,
  };
}

let spellsPromise: Promise<WikiSpell[]> | null = null;

export async function fetchAllSpells(): Promise<WikiSpell[]> {
  const cached = getCached<WikiSpell[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!spellsPromise) {
    spellsPromise = bucketQueryAll<RawBucketSpell>("infobox_spell", [...SPELL_FIELDS])
      .then((raw) => {
        const spells = raw
          .map(toWikiSpell)
          .filter((s): s is WikiSpell => s !== null)
          .sort((a, b) => a.level - b.level);
        if (spells.length > 0) setCache(CACHE_KEY, spells, { persist: true });
        spellsPromise = null;
        return spells;
      })
      .catch((err: unknown) => {
        spellsPromise = null;
        console.error("[RuneWise] Failed to fetch spells:", err);
        throw err;
      });
  }

  return spellsPromise;
}

export function getSpellsByBook(
  spells: WikiSpell[],
  book: Spellbook
): WikiSpell[] {
  return spells.filter((s) => s.spellbook === book);
}
