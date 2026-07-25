/**
 * Curated NPC combat attributes for DPS formulas when the wiki bucket API
 * does not expose size / undead / demon / dragon / Xerician flags.
 *
 * Matching is case-insensitive substring on monster name (and version when set).
 * Prefer the longest matching key so "Great Olm" wins over "Olm".
 *
 * When no curated entry matches, {@link inferAttributesFromName} fills in
 * common attribute tags from name heuristics (e.g. "… demon", "… dragon").
 *
 * Sources: OSRS Wiki monster attributes; size in tiles for scythe multi-hit.
 * Live wiki size fields can be merged via {@link mergeMonsterMeta}.
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
  { match: "brutal red dragon", size: 4, attributes: ["dragon"] },
  { match: "brutal blue dragon", size: 4, attributes: ["dragon"] },
  { match: "brutal green dragon", size: 4, attributes: ["dragon"] },
  { match: "green dragon", size: 2, attributes: ["dragon"] },
  { match: "blue dragon", size: 2, attributes: ["dragon"] },
  { match: "red dragon", size: 2, attributes: ["dragon"] },
  { match: "black dragon", size: 2, attributes: ["dragon"] },
  { match: "iron dragon", size: 3, attributes: ["dragon"] },
  { match: "steel dragon", size: 3, attributes: ["dragon"] },
  { match: "lava dragon", size: 3, attributes: ["dragon"] },
  { match: "elven", size: 1, attributes: [] }, // avoid false "dragon" on "elven" paths
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
  { match: "dagannoth prime", size: 1, attributes: [] },
  { match: "dagannoth rex", size: 1, attributes: [] },
  { match: "dagannoth supreme", size: 1, attributes: [] },
  { match: "dagannoth", size: 1, attributes: [] },
  { match: "thermonuclear smoke devil", size: 1, attributes: [] },
  { match: "callisto", size: 3, attributes: [] },
  { match: "venenatis", size: 3, attributes: [] },
  { match: "vet'ion", size: 3, attributes: ["undead"] },
  { match: "vetion", size: 3, attributes: ["undead"] },
  { match: "calvar'ion", size: 3, attributes: ["undead"] },
  { match: "artio", size: 2, attributes: [] },
  { match: "spindel", size: 2, attributes: [] },
  { match: "chaos elemental", size: 3, attributes: [] },
  { match: "chaos fanatic", size: 1, attributes: [] },
  { match: "crazy archaeologist", size: 1, attributes: [] },
  { match: "scorpia", size: 3, attributes: [] },
  { match: "king of wyverns", size: 3, attributes: ["dragon"] },
  { match: "skeletal wyvern", size: 3, attributes: ["dragon", "undead"] },
  { match: "wyvern", size: 3, attributes: ["dragon"] },
  { match: "draconic", size: 2, attributes: ["dragon"] },
  { match: "royal titans", size: 3, attributes: [] },
  { match: "moons of peril", size: 3, attributes: [] },
  { match: "eclipse moon", size: 3, attributes: [] },
  { match: "blue moon", size: 3, attributes: [] },
  { match: "blood moon", size: 3, attributes: [] },
  { match: "tormented demon", size: 2, attributes: ["demon"] },
  { match: "demonic gorilla", size: 2, attributes: ["demon"] },
  { match: "revenant", size: 1, attributes: ["undead"] },
  { match: "greater abyssal demon", size: 1, attributes: ["demon"] },

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
  { match: "hellhound", size: 1, attributes: ["demon"] },
  { match: "gargoyle", size: 2, attributes: ["golem"] },
  { match: "vyre", size: 1, attributes: ["vampyre"] },
  { match: "vampyre", size: 1, attributes: ["vampyre"] },
  { match: "fossil island wyvern", size: 3, attributes: ["dragon"] },
];

const DEFAULT_META: MonsterCombatMeta = { size: 1, attributes: [] };

function entryMatches(entry: MetaEntry, haystack: string): boolean {
  const needles = Array.isArray(entry.match) ? entry.match : [entry.match];
  return needles.every((n) => haystack.includes(n));
}

/**
 * Name-based attribute inference for NPCs without curated entries.
 * Conservative: only clear type tokens in the name (not free-form wiki scrape).
 */
export function inferAttributesFromName(
  name?: string | null,
  version?: string | null
): MonsterAttribute[] {
  const haystack = `${name ?? ""} ${version ?? ""}`.toLowerCase().trim();
  if (!haystack) return [];
  const attrs: MonsterAttribute[] = [];
  const add = (a: MonsterAttribute) => {
    if (!attrs.includes(a)) attrs.push(a);
  };

  if (/\bdemon\b/.test(haystack) || haystack.includes("hellhound") || haystack.includes("nechry"))
    add("demon");
  if (
    /\bdragon\b/.test(haystack) ||
    haystack.includes("wyvern") ||
    haystack.includes("drake") ||
    haystack.includes("hydra")
  )
    add("dragon");
  if (
    /\bundead\b/.test(haystack) ||
    haystack.includes("zombie") ||
    haystack.includes("skeleton") ||
    haystack.includes("ghost") ||
    haystack.includes("shade") ||
    haystack.includes("revenant") ||
    haystack.includes("ankou")
  )
    add("undead");
  if (haystack.includes("kalphite") || haystack.includes("scarab")) add("kalphite");
  if (haystack.includes("turoth") || haystack.includes("kurask") || haystack.includes("leaf-bladed"))
    add("leafy");
  if (haystack.includes("vampyr") || haystack.includes("vyre")) add("vampyre");
  if (haystack.includes("gargoyle") || haystack.includes("golem")) add("golem");
  if (/\brat\b/.test(haystack) || haystack.includes("scurrius")) add("rat");

  return attrs;
}

/**
 * Merge live/wiki fields over curated meta.
 * Size from API wins when positive; attributes are unioned.
 */
export function mergeMonsterMeta(
  base: MonsterCombatMeta,
  live?: Partial<MonsterCombatMeta> | null
): MonsterCombatMeta {
  if (!live) return base;
  const attrs = new Set<MonsterAttribute>(base.attributes);
  for (const a of live.attributes ?? []) attrs.add(a);
  return {
    size: live.size != null && live.size > 0 ? Math.min(10, Math.floor(live.size)) : base.size,
    attributes: [...attrs],
    demonbaneVulnerability: live.demonbaneVulnerability ?? base.demonbaneVulnerability,
  };
}

/** Longest-match lookup for curated combat meta (+ name heuristics). */
export function lookupMonsterMeta(
  name?: string | null,
  version?: string | null,
  live?: Partial<MonsterCombatMeta> | null
): MonsterCombatMeta {
  const haystack = `${name ?? ""} ${version ?? ""}`.toLowerCase().trim();
  if (!haystack) return mergeMonsterMeta(DEFAULT_META, live);

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

  let meta: MonsterCombatMeta;
  if (best) {
    meta = {
      size: best.size,
      attributes: [...best.attributes],
      demonbaneVulnerability: best.demonbaneVulnerability,
    };
  } else {
    // No curated row — use name heuristics for attributes, size 1 default
    meta = {
      size: 1,
      attributes: inferAttributesFromName(name, version),
    };
  }

  // Still union heuristic tags (e.g. curated size but name also says undead)
  const inferred = inferAttributesFromName(name, version);
  if (inferred.length) {
    const set = new Set([...meta.attributes, ...inferred]);
    meta = { ...meta, attributes: [...set] };
  }

  return mergeMonsterMeta(meta, live);
}

export function monsterHasAttribute(
  name: string | null | undefined,
  attr: MonsterAttribute,
  version?: string | null
): boolean {
  return lookupMonsterMeta(name, version).attributes.includes(attr);
}
