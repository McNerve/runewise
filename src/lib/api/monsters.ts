import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";
import { MONSTERS as FALLBACK_MONSTERS } from "../data/monsters";

const CACHE_KEY = "wiki-monsters:v2";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const MONSTER_FIELDS = [
  "page_name",
  "page_name_sub",
  "combat_level",
  "hitpoints",
  "max_hit",
  "attack_speed",
  "attack_style",
  "attack_level",
  "strength_level",
  "defence_level",
  "magic_level",
  "ranged_level",
  "slayer_level",
  "slayer_experience",
  "stab_defence_bonus",
  "slash_defence_bonus",
  "crush_defence_bonus",
  "magic_defence_bonus",
  "range_defence_bonus",
  "attack_bonus",
  "strength_bonus",
  "magic_attack_bonus",
  "range_attack_bonus",
  "magic_damage_bonus",
  "image",
  "examine",
] as const;

interface RawBucketMonster {
  [key: string]: unknown;
  page_name: string;
  page_name_sub?: string;
  combat_level?: string;
  hitpoints?: string;
  max_hit?: string;
  attack_speed?: string;
  attack_style?: string;
  attack_level?: string;
  strength_level?: string;
  defence_level?: string;
  magic_level?: string;
  ranged_level?: string;
  slayer_level?: string;
  slayer_experience?: string;
  stab_defence_bonus?: string;
  slash_defence_bonus?: string;
  crush_defence_bonus?: string;
  magic_defence_bonus?: string;
  range_defence_bonus?: string;
  attack_bonus?: string;
  strength_bonus?: string;
  magic_attack_bonus?: string;
  range_attack_bonus?: string;
  magic_damage_bonus?: string;
  image?: string;
  examine?: string;
}

export interface WikiMonster {
  name: string;
  version: string | null;
  combatLevel: number;
  hitpoints: number;
  maxHit: number;
  attackSpeed: number;
  attackStyles: string[];
  attackLevel: number;
  strengthLevel: number;
  defenceLevel: number;
  magicLevel: number;
  rangedLevel: number;
  slayerLevel: number;
  slayerXp: number;
  defStab: number;
  defSlash: number;
  defCrush: number;
  defMagic: number;
  defRanged: number;
  attackBonus: number;
  strengthBonus: number;
  magicAttackBonus: number;
  rangedAttackBonus: number;
  magicDamageBonus: number;
  image: string | null;
  examine: string | null;
}

function num(value: string | undefined): number {
  if (!value) return 0;
  const n = parseInt(value, 10);
  return isNaN(n) ? 0 : n;
}

function parseAttackStyles(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toWikiMonster(raw: RawBucketMonster): WikiMonster {
  return {
    name: raw.page_name,
    version: raw.page_name_sub || null,
    combatLevel: num(raw.combat_level),
    hitpoints: num(raw.hitpoints),
    maxHit: num(raw.max_hit),
    attackSpeed: num(raw.attack_speed),
    attackStyles: parseAttackStyles(raw.attack_style),
    attackLevel: num(raw.attack_level),
    strengthLevel: num(raw.strength_level),
    defenceLevel: num(raw.defence_level),
    magicLevel: num(raw.magic_level),
    rangedLevel: num(raw.ranged_level),
    slayerLevel: num(raw.slayer_level),
    slayerXp: num(raw.slayer_experience),
    defStab: num(raw.stab_defence_bonus),
    defSlash: num(raw.slash_defence_bonus),
    defCrush: num(raw.crush_defence_bonus),
    defMagic: num(raw.magic_defence_bonus),
    defRanged: num(raw.range_defence_bonus),
    attackBonus: num(raw.attack_bonus),
    strengthBonus: num(raw.strength_bonus),
    magicAttackBonus: num(raw.magic_attack_bonus),
    rangedAttackBonus: num(raw.range_attack_bonus),
    magicDamageBonus: num(raw.magic_damage_bonus),
    image: raw.image || null,
    examine: raw.examine || null,
  };
}

let monstersPromise: Promise<WikiMonster[]> | null = null;

export async function fetchAllMonsters(): Promise<WikiMonster[]> {
  const cached = getCached<WikiMonster[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!monstersPromise) {
    monstersPromise = bucketQueryAll<RawBucketMonster>(
      "infobox_monster",
      [...MONSTER_FIELDS]
    )
      .then((raw) => {
        const monsters = raw.map(toWikiMonster);
        setCache(CACHE_KEY, monsters, { persist: true });
        monstersPromise = null;
        return monsters;
      })
      .catch((err: unknown) => {
        monstersPromise = null;
        console.error("[RuneWise] Failed to fetch monsters:", err);
        return getFallbackMonsters();
      });
  }

  return monstersPromise;
}

export function searchMonsters(
  monsters: WikiMonster[],
  query: string,
  limit = 20
): WikiMonster[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return monsters
    .filter((m) => m.name.toLowerCase().includes(lower))
    .slice(0, limit);
}

export function getMonster(
  monsters: WikiMonster[],
  name: string,
  version?: string
): WikiMonster | undefined {
  const lower = name.toLowerCase();
  return monsters.find(
    (m) =>
      m.name.toLowerCase() === lower &&
      (!version || m.version === version)
  );
}

function getFallbackMonsters(): WikiMonster[] {
  return FALLBACK_MONSTERS.filter((m) => m.name !== "Custom target").map(
    (m) => ({
      name: m.name,
      version: null,
      combatLevel: 0,
      hitpoints: m.hp,
      maxHit: 0,
      attackSpeed: 0,
      attackStyles: [],
      attackLevel: 0,
      strengthLevel: 0,
      defenceLevel: m.defLevel,
      magicLevel: 0,
      rangedLevel: 0,
      slayerLevel: 0,
      slayerXp: 0,
      defStab: m.defStab,
      defSlash: m.defSlash,
      defCrush: m.defCrush,
      defMagic: m.defMagic,
      defRanged: m.defRanged,
      attackBonus: 0,
      strengthBonus: 0,
      magicAttackBonus: 0,
      rangedAttackBonus: 0,
      magicDamageBonus: 0,
      image: null,
      examine: null,
    })
  );
}
