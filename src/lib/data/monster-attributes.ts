/**
 * Curated NPC combat attributes for DPS formulas when the wiki bucket API
 * does not expose size / undead / demon / dragon / Xerician flags.
 *
 * Matching is case-insensitive substring on monster name (and version when set).
 * Prefer the longest matching key so "Great Olm" wins over "Olm".
 *
 * Sources: OSRS Wiki monster attributes; size in tiles for scythe multi-hit.
 */

export type MonsterAttribute =
  | "undead"
  | "demon"
  | "dragon"
  | "kalphite"
  | "leafy"
  | "xerician"
  | "vampyre"
  | "golem"
  | "rat";

export interface MonsterCombatMeta {
  /** NPC size in tiles (scythe hitsplats = min(3, size)). */
  size: number;
  attributes: MonsterAttribute[];
  /**
   * Demonbane vulnerability percent (default 100 when demon).
   * Duke Sucellus 70, Yama 120, etc.
   */
  demonbaneVulnerability?: number;
}

interface MetaEntry extends MonsterCombatMeta {
  /** Lowercase name/version needles; all must match when length > 1. */
  match: string | string[];
}

const ENTRIES: MetaEntry[] = [
  // Raids / large
  { match: "great olm", size: 5, attributes: ["xerician", "dragon"] },
  { match: "tekton", size: 3, attributes: ["xerician"] },
  { match: "vespula", size: 3, attributes: ["xerician"] },
  { match: "vasa nistirio", size: 3, attributes: ["xerician"] },
  { match: "muttadile", size: 3, attributes: ["xerician"] },
  { match: "vanguard", size: 2, attributes: ["xerician"] },
  { match: "skeletal mystic", size: 1, attributes: ["xerician", "undead"] },
  { match: "lizardman shaman", size: 2, attributes: ["xerician"] },
  { match: "ice demon", size: 2, attributes: ["xerician", "demon"], demonbaneVulnerability: 115 },
  { match: "guardian", size: 2, attributes: ["xerician"] },
  { match: "deathly mage", size: 1, attributes: ["xerician"] },
  { match: "deathly ranger", size: 1, attributes: ["xerician"] },

  { match: ["warden", "p2"], size: 3, attributes: [] },
  { match: ["warden", "core"], size: 1, attributes: [] },
  { match: "tumeken's warden", size: 3, attributes: [] },
  { match: "elidinis' warden", size: 3, attributes: [] },
  { match: "zebak", size: 3, attributes: [] },
  { match: "ba-ba", size: 3, attributes: [] },
  { match: "kephri", size: 3, attributes: [] },
  { match: "akkha", size: 3, attributes: [] },
  { match: "verzik", size: 3, attributes: [] },
  { match: "nylocas", size: 1, attributes: [] },
  { match: "sotetseg", size: 5, attributes: [] },
  { match: "xarpus", size: 3, attributes: ["undead"] },
  { match: "maiden of sugadinti", size: 6, attributes: [] },
  { match: "pestilent bloat", size: 5, attributes: [] },

  // Bosses
  { match: "corporeal beast", size: 5, attributes: [] },
  { match: "nex", size: 3, attributes: [] },
  { match: "general graardor", size: 3, attributes: [] },
  { match: "commander zilyana", size: 2, attributes: [] },
  { match: "kree'arra", size: 3, attributes: [] },
  { match: "k'ril tsutsaroth", size: 3, attributes: ["demon"], demonbaneVulnerability: 100 },
  { match: "kril tsutsaroth", size: 3, attributes: ["demon"] },
  { match: "vorkath", size: 5, attributes: ["dragon", "undead"] },
  { match: "king black dragon", size: 5, attributes: ["dragon"] },
  { match: "rune dragon", size: 4, attributes: ["dragon"] },
  { match: "adamant dragon", size: 4, attributes: ["dragon"] },
  { match: "mithril dragon", size: 4, attributes: ["dragon"] },
  { match: "brutal black dragon", size: 4, attributes: ["dragon"] },
  { match: "zulrah", size: 3, attributes: [] },
  { match: "cerberus", size: 3, attributes: ["demon"] },
  { match: "alchemical hydra", size: 3, attributes: ["dragon"] },
  { match: "abyssal sire", size: 3, attributes: ["demon"] },
  { match: "kalphite queen", size: 5, attributes: ["kalphite"] },
  { match: "kalphite", size: 2, attributes: ["kalphite"] },
  { match: "nightmare", size: 5, attributes: [] },
  { match: "phosani", size: 5, attributes: [] },
  { match: "duke sucellus", size: 3, attributes: ["demon"], demonbaneVulnerability: 70 },
  { match: "vardorvis", size: 3, attributes: [] },
  { match: "the leviathan", size: 5, attributes: [] },
  { match: "whisperer", size: 3, attributes: [] },
  { match: "yama", size: 3, attributes: ["demon"], demonbaneVulnerability: 120 },
  { match: "araxxor", size: 3, attributes: [] },
  { match: "amoxliatl", size: 3, attributes: [] },
  { match: "hueycoatl", size: 5, attributes: ["dragon"] },
  { match: "skotizo", size: 3, attributes: ["demon"] },
  { match: "sarachnis", size: 3, attributes: [] },
  { match: "scurrius", size: 3, attributes: ["rat"] },
  { match: "giant mole", size: 3, attributes: [] },
  { match: "dagannoth", size: 1, attributes: [] },
  { match: "thermonuclear smoke devil", size: 1, attributes: [] },

  // Undead / leafy / misc
  { match: "barrows", size: 1, attributes: ["undead"] },
  { match: "ankou", size: 1, attributes: ["undead"] },
  { match: "shade", size: 1, attributes: ["undead"] },
  { match: "ghast", size: 1, attributes: ["undead"] },
  { match: "zombie", size: 1, attributes: ["undead"] },
  { match: "skeleton", size: 1, attributes: ["undead"] },
  { match: "ghost", size: 1, attributes: ["undead"] },
  { match: "turoth", size: 1, attributes: ["leafy"] },
  { match: "kurask", size: 2, attributes: ["leafy"] },
  { match: "abyssal demon", size: 1, attributes: ["demon"] },
  { match: "black demon", size: 2, attributes: ["demon"] },
  { match: "greater demon", size: 2, attributes: ["demon"] },
  { match: "lesser demon", size: 2, attributes: ["demon"] },
  { match: "nechryael", size: 1, attributes: ["demon"] },
  { match: "bloodveld", size: 1, attributes: ["demon"] },
  { match: "gargoyle", size: 2, attributes: ["golem"] },
  { match: "vyre", size: 1, attributes: ["vampyre"] },
  { match: "vampyre", size: 1, attributes: ["vampyre"] },
];

const DEFAULT_META: MonsterCombatMeta = { size: 1, attributes: [] };

function entryMatches(entry: MetaEntry, haystack: string): boolean {
  const needles = Array.isArray(entry.match) ? entry.match : [entry.match];
  return needles.every((n) => haystack.includes(n));
}

/** Longest-match lookup for curated combat meta. */
export function lookupMonsterMeta(
  name?: string | null,
  version?: string | null
): MonsterCombatMeta {
  const haystack = `${name ?? ""} ${version ?? ""}`.toLowerCase().trim();
  if (!haystack) return DEFAULT_META;

  let best: MetaEntry | null = null;
  let bestLen = -1;
  for (const entry of ENTRIES) {
    if (!entryMatches(entry, haystack)) continue;
    const needles = Array.isArray(entry.match) ? entry.match : [entry.match];
    const len = needles.join(" ").length;
    if (len > bestLen) {
      best = entry;
      bestLen = len;
    }
  }
  if (!best) return DEFAULT_META;
  return {
    size: best.size,
    attributes: [...best.attributes],
    demonbaneVulnerability: best.demonbaneVulnerability,
  };
}

export function monsterHasAttribute(
  name: string | null | undefined,
  attr: MonsterAttribute,
  version?: string | null
): boolean {
  return lookupMonsterMeta(name, version).attributes.includes(attr);
}
