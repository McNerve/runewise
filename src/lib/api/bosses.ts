import { fetchAllMonsters, type WikiMonster } from "./monsters";
import { getCached, setCache } from "./cache";
import {
  BOSSES as STATIC_BOSSES,
  normalizeBossLookup,
  type BossInfo,
} from "../data/bosses";

const CACHE_KEY = "wiki-bosses:v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export type BossCategory =
  | "Raids"
  | "God Wars"
  | "DT2"
  | "Slayer"
  | "Wilderness"
  | "Solo"
  | "Dagannoth Kings"
  | "Minigame"
  | "Skilling"
  | "Varlamore"
  | "Other";

export interface WikiBoss {
  name: string;
  wikiPage: string;
  category: BossCategory;
  combatLevel: number;
  hitpoints: number;
  maxHit: number;
  defenceLevel: number;
  defStab: number;
  defSlash: number;
  defCrush: number;
  defMagic: number;
  defRanged: number;
  attackSpeed: number;
  attackStyles: string[];
  weakness: string | null;
  image: string | null;
}

interface BossEntry {
  name: string;
  wikiPage: string;
  category: BossCategory;
  monsterName?: string;
}

const BOSS_ENTRIES: BossEntry[] = [
  // Raids
  { name: "Chambers of Xeric", wikiPage: "Chambers_of_Xeric/Strategies", category: "Raids" },
  { name: "Theatre of Blood", wikiPage: "Theatre_of_Blood/Strategies", category: "Raids" },
  { name: "Tombs of Amascut", wikiPage: "Tombs_of_Amascut/Strategies", category: "Raids" },

  // God Wars Dungeon
  { name: "General Graardor", wikiPage: "General_Graardor/Strategies", category: "God Wars" },
  { name: "Kree'arra", wikiPage: "Kree%27arra/Strategies", category: "God Wars" },
  { name: "Commander Zilyana", wikiPage: "Commander_Zilyana/Strategies", category: "God Wars" },
  { name: "K'ril Tsutsaroth", wikiPage: "K%27ril_Tsutsaroth/Strategies", category: "God Wars" },
  { name: "Nex", wikiPage: "Nex/Strategies", category: "God Wars" },

  // Desert Treasure 2
  { name: "Duke Sucellus", wikiPage: "Duke_Sucellus/Strategies", category: "DT2" },
  { name: "The Leviathan", wikiPage: "The_Leviathan/Strategies", category: "DT2", monsterName: "The Leviathan" },
  { name: "Vardorvis", wikiPage: "Vardorvis/Strategies", category: "DT2" },
  { name: "The Whisperer", wikiPage: "The_Whisperer/Strategies", category: "DT2", monsterName: "The Whisperer" },

  // Slayer
  { name: "Alchemical Hydra", wikiPage: "Alchemical_Hydra/Strategies", category: "Slayer" },
  { name: "Cerberus", wikiPage: "Cerberus/Strategies", category: "Slayer" },
  { name: "Grotesque Guardians", wikiPage: "Grotesque_Guardians/Strategies", category: "Slayer" },
  { name: "Kraken", wikiPage: "Kraken/Strategies", category: "Slayer" },
  { name: "Thermonuclear Smoke Devil", wikiPage: "Thermonuclear_smoke_devil/Strategies", category: "Slayer", monsterName: "Thermonuclear smoke devil" },
  { name: "Abyssal Sire", wikiPage: "Abyssal_Sire/Strategies", category: "Slayer" },
  { name: "Skotizo", wikiPage: "Skotizo/Strategies", category: "Slayer" },

  // Wilderness
  { name: "Vet'ion", wikiPage: "Vet%27ion/Strategies", category: "Wilderness" },
  { name: "Venenatis", wikiPage: "Venenatis/Strategies", category: "Wilderness" },
  { name: "Callisto", wikiPage: "Callisto/Strategies", category: "Wilderness" },
  { name: "Chaos Elemental", wikiPage: "Chaos_Elemental/Strategies", category: "Wilderness" },
  { name: "Scorpia", wikiPage: "Scorpia/Strategies", category: "Wilderness" },
  { name: "Chaos Fanatic", wikiPage: "Chaos_Fanatic/Strategies", category: "Wilderness" },
  { name: "Crazy Archaeologist", wikiPage: "Crazy_Archaeologist/Strategies", category: "Wilderness" },
  { name: "Deranged Archaeologist", wikiPage: "Deranged_Archaeologist/Strategies", category: "Wilderness" },
  { name: "Artio", wikiPage: "Artio/Strategies", category: "Wilderness" },
  { name: "Calvar'ion", wikiPage: "Calvar%27ion/Strategies", category: "Wilderness" },
  { name: "Spindel", wikiPage: "Spindel/Strategies", category: "Wilderness" },

  // Solo
  { name: "Vorkath", wikiPage: "Vorkath/Strategies", category: "Solo" },
  { name: "Zulrah", wikiPage: "Zulrah/Strategies", category: "Solo" },
  { name: "Corporeal Beast", wikiPage: "Corporeal_Beast/Strategies", category: "Solo" },
  { name: "Sarachnis", wikiPage: "Sarachnis/Strategies", category: "Solo" },
  { name: "King Black Dragon", wikiPage: "King_Black_Dragon/Strategies", category: "Solo" },
  { name: "Kalphite Queen", wikiPage: "Kalphite_Queen/Strategies", category: "Solo" },
  { name: "Giant Mole", wikiPage: "Giant_Mole/Strategies", category: "Solo" },
  { name: "Barrows", wikiPage: "Barrows/Strategies", category: "Solo" },
  { name: "The Gauntlet", wikiPage: "The_Gauntlet/Strategies", category: "Solo", monsterName: "Crystalline Hunllef" },
  { name: "Corrupted Gauntlet", wikiPage: "The_Gauntlet/Strategies", category: "Solo", monsterName: "Corrupted Hunllef" },

  // Dagannoth Kings
  { name: "Dagannoth Rex", wikiPage: "Dagannoth_Rex/Strategies", category: "Dagannoth Kings" },
  { name: "Dagannoth Prime", wikiPage: "Dagannoth_Prime/Strategies", category: "Dagannoth Kings" },
  { name: "Dagannoth Supreme", wikiPage: "Dagannoth_Supreme/Strategies", category: "Dagannoth Kings" },

  // Minigame Bosses
  { name: "TzTok-Jad", wikiPage: "TzTok-Jad/Strategies", category: "Minigame" },
  { name: "TzKal-Zuk", wikiPage: "TzKal-Zuk/Strategies", category: "Minigame" },
  { name: "Sol Heredit", wikiPage: "Sol_Heredit/Strategies", category: "Minigame" },
  { name: "The Fortis Colosseum", wikiPage: "The_Fortis_Colosseum/Strategies", category: "Minigame" },

  // Skilling
  { name: "Wintertodt", wikiPage: "Wintertodt/Strategies", category: "Skilling" },
  { name: "Tempoross", wikiPage: "Tempoross/Strategies", category: "Skilling" },
  { name: "Zalcano", wikiPage: "Zalcano/Strategies", category: "Skilling" },

  // Varlamore
  { name: "Araxxor", wikiPage: "Araxxor/Strategies", category: "Varlamore" },
  { name: "Amoxliatl", wikiPage: "Amoxliatl/Strategies", category: "Varlamore" },
  { name: "Hueycoatl", wikiPage: "Hueycoatl/Strategies", category: "Varlamore" },

  // Other
  { name: "The Nightmare", wikiPage: "The_Nightmare/Strategies", category: "Other", monsterName: "The Nightmare" },
  { name: "Phosani's Nightmare", wikiPage: "Phosani%27s_Nightmare/Strategies", category: "Other", monsterName: "Phosani's Nightmare" },
  { name: "Phantom Muspah", wikiPage: "Phantom_Muspah/Strategies", category: "Other" },
  { name: "Scurrius", wikiPage: "Scurrius/Strategies", category: "Other" },
  { name: "Moons of Peril", wikiPage: "Moons_of_Peril/Strategies", category: "Other" },
];

function inferWeakness(monster: WikiMonster): string | null {
  const defences = [
    { style: "Stab", value: monster.defStab },
    { style: "Slash", value: monster.defSlash },
    { style: "Crush", value: monster.defCrush },
    { style: "Ranged", value: monster.defRanged },
    { style: "Magic", value: monster.defMagic },
  ];
  const lowest = defences.reduce((min, d) => (d.value < min.value ? d : min));
  if (lowest.value < 0 || (lowest.value === 0 && defences.some((d) => d.value > 50))) {
    return lowest.style;
  }
  return null;
}

function matchMonster(entry: BossEntry, monsters: WikiMonster[]): WikiMonster | null {
  const searchName = (entry.monsterName ?? entry.name).toLowerCase();
  return (
    monsters.find((m) => m.name.toLowerCase() === searchName) ??
    monsters.find((m) => m.name.toLowerCase().includes(searchName)) ??
    null
  );
}

function toBoss(entry: BossEntry, monster: WikiMonster | null): WikiBoss {
  return {
    name: entry.name,
    wikiPage: entry.wikiPage,
    category: entry.category,
    combatLevel: monster?.combatLevel ?? 0,
    hitpoints: monster?.hitpoints ?? 0,
    maxHit: monster?.maxHit ?? 0,
    defenceLevel: monster?.defenceLevel ?? 0,
    defStab: monster?.defStab ?? 0,
    defSlash: monster?.defSlash ?? 0,
    defCrush: monster?.defCrush ?? 0,
    defMagic: monster?.defMagic ?? 0,
    defRanged: monster?.defRanged ?? 0,
    attackSpeed: monster?.attackSpeed ?? 0,
    attackStyles: monster?.attackStyles ?? [],
    weakness: monster ? inferWeakness(monster) : null,
    image: monster?.image ?? null,
  };
}

let bossesPromise: Promise<WikiBoss[]> | null = null;

export async function fetchAllBosses(): Promise<WikiBoss[]> {
  const cached = getCached<WikiBoss[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!bossesPromise) {
    bossesPromise = fetchAllMonsters()
      .then((monsters) => {
        const bosses = BOSS_ENTRIES.map((entry) => {
          const monster = matchMonster(entry, monsters);
          return toBoss(entry, monster);
        });
        setCache(CACHE_KEY, bosses, { persist: true });
        bossesPromise = null;
        return bosses;
      })
      .catch(() => {
        bossesPromise = null;
        return getFallbackBosses();
      });
  }

  return bossesPromise;
}

export function getBossCategories(bosses: WikiBoss[]): BossCategory[] {
  return [...new Set(bosses.map((b) => b.category))];
}

export function findBoss(bosses: WikiBoss[], name: string): WikiBoss | undefined {
  const normalized = normalizeBossLookup(name);
  return bosses.find((b) => normalizeBossLookup(b.name) === normalized);
}

function getFallbackBosses(): WikiBoss[] {
  return STATIC_BOSSES.map((b) => staticToWikiBoss(b));
}

function staticToWikiBoss(b: BossInfo): WikiBoss {
  return {
    name: b.name,
    wikiPage: b.wikiPage,
    category: mapStaticCategory(b.category),
    combatLevel: b.combatLevel ?? 0,
    hitpoints: b.hitpoints ?? 0,
    maxHit: b.maxHit ?? 0,
    defenceLevel: 0,
    defStab: 0,
    defSlash: 0,
    defCrush: 0,
    defMagic: 0,
    defRanged: 0,
    attackSpeed: 0,
    attackStyles: [],
    weakness: b.weakness ?? null,
    image: null,
  };
}

function mapStaticCategory(cat: string): BossCategory {
  const map: Record<string, BossCategory> = {
    Raids: "Raids",
    GWD: "God Wars",
    Slayer: "Slayer",
    Wilderness: "Wilderness",
    Other: "Other",
    Varlamore: "Varlamore",
  };
  return map[cat] ?? "Other";
}

export const BOSS_CATEGORY_ORDER: BossCategory[] = [
  "Raids",
  "God Wars",
  "DT2",
  "Slayer",
  "Wilderness",
  "Solo",
  "Dagannoth Kings",
  "Minigame",
  "Skilling",
  "Varlamore",
  "Other",
];
