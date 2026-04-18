/**
 * Hardcoded raid unique drop rates.
 * Sources:
 *   ToB:  https://oldschool.runescape.wiki/w/Theatre_of_Blood#Unique_drop_table
 *         Base unique rate 1/17.4 per chest; unique split across items.
 *         Displayed rates are per-kill individual item rates (party-size-normalised values
 *         from the wiki unique table for a 4-man team as a typical reference).
 *   ToA:  https://oldschool.runescape.wiki/w/Tombs_of_Amascut#Unique_drop_table
 *         Base rates at 0 invocation; scales with invocation level.
 *   CoX:  https://oldschool.runescape.wiki/w/Chambers_of_Xeric#Unique_drops
 *         1 unique per ~33 points; rates shown are approximate solo KC estimates.
 */

export interface RaidDropEntry {
  name: string;
  rate: string;
  category: "unique" | "common";
}

export interface RaidLootEntry {
  uniques: RaidDropEntry[];
  common: RaidDropEntry[];
}

export const RAID_LOOT: Record<string, RaidLootEntry> = {
  "theatre-of-blood": {
    uniques: [
      { name: "Scythe of vitur (uncharged)", rate: "1/172", category: "unique" },
      { name: "Ghrazi rapier", rate: "1/172", category: "unique" },
      { name: "Sanguinesti staff (uncharged)", rate: "1/172", category: "unique" },
      { name: "Justiciar faceguard", rate: "1/516", category: "unique" },
      { name: "Justiciar chestguard", rate: "1/516", category: "unique" },
      { name: "Justiciar legguards", rate: "1/516", category: "unique" },
      { name: "Avernic defender hilt", rate: "1/43", category: "unique" },
      { name: "Sanguine dust", rate: "1/2000", category: "unique" },
      { name: "Sanguine ornament kit", rate: "1/5000", category: "unique" },
    ],
    common: [
      { name: "Death rune", rate: "common", category: "common" },
      { name: "Blood rune", rate: "common", category: "common" },
      { name: "Grimy ranarr weed", rate: "common", category: "common" },
      { name: "Grimy snapdragon", rate: "common", category: "common" },
      { name: "Coins", rate: "common", category: "common" },
    ],
  },

  "theatre-of-blood-hard-mode": {
    uniques: [
      { name: "Scythe of vitur (uncharged)", rate: "1/86", category: "unique" },
      { name: "Ghrazi rapier", rate: "1/86", category: "unique" },
      { name: "Sanguinesti staff (uncharged)", rate: "1/86", category: "unique" },
      { name: "Justiciar faceguard", rate: "1/258", category: "unique" },
      { name: "Justiciar chestguard", rate: "1/258", category: "unique" },
      { name: "Justiciar legguards", rate: "1/258", category: "unique" },
      { name: "Avernic defender hilt", rate: "1/22", category: "unique" },
      { name: "Sanguine dust", rate: "1/1000", category: "unique" },
      { name: "Sanguine ornament kit", rate: "1/2500", category: "unique" },
    ],
    common: [],
  },

  "tombs-of-amascut": {
    uniques: [
      { name: "Tumeken's shadow (uncharged)", rate: "1/24", category: "unique" },
      { name: "Elidinis' ward", rate: "1/8", category: "unique" },
      { name: "Osmumten's fang", rate: "1/8", category: "unique" },
      { name: "Masori mask", rate: "1/24", category: "unique" },
      { name: "Masori body", rate: "1/24", category: "unique" },
      { name: "Masori chaps", rate: "1/24", category: "unique" },
      { name: "Lightbearer", rate: "1/8", category: "unique" },
      { name: "Menaphite ornament kit", rate: "1/20", category: "unique" },
      { name: "Thread of Elidinis", rate: "1/20", category: "unique" },
      { name: "Breach of the Scarab", rate: "1/20", category: "unique" },
      { name: "Eye of the Corruptor", rate: "1/20", category: "unique" },
      { name: "Cache of runes", rate: "1/20", category: "unique" },
    ],
    common: [
      { name: "Death rune", rate: "common", category: "common" },
      { name: "Blood rune", rate: "common", category: "common" },
      { name: "Grimy herbs", rate: "common", category: "common" },
      { name: "Coins", rate: "common", category: "common" },
    ],
  },

  "tombs-of-amascut-expert": {
    uniques: [
      { name: "Tumeken's shadow (uncharged)", rate: "1/24", category: "unique" },
      { name: "Elidinis' ward", rate: "1/8", category: "unique" },
      { name: "Osmumten's fang", rate: "1/8", category: "unique" },
      { name: "Masori mask", rate: "1/24", category: "unique" },
      { name: "Masori body", rate: "1/24", category: "unique" },
      { name: "Masori chaps", rate: "1/24", category: "unique" },
      { name: "Lightbearer", rate: "1/8", category: "unique" },
      { name: "Menaphite ornament kit", rate: "1/20", category: "unique" },
      { name: "Thread of Elidinis", rate: "1/20", category: "unique" },
      { name: "Breach of the Scarab", rate: "1/20", category: "unique" },
      { name: "Eye of the Corruptor", rate: "1/20", category: "unique" },
      { name: "Cache of runes", rate: "1/20", category: "unique" },
    ],
    common: [],
  },

  "chambers-of-xeric": {
    uniques: [
      { name: "Twisted bow", rate: "1/34.5", category: "unique" },
      { name: "Kodai insignia", rate: "1/34.5", category: "unique" },
      { name: "Ancestral hat", rate: "1/34.5", category: "unique" },
      { name: "Ancestral robe top", rate: "1/34.5", category: "unique" },
      { name: "Ancestral robe bottom", rate: "1/34.5", category: "unique" },
      { name: "Dragon claws", rate: "1/34.5", category: "unique" },
      { name: "Elder maul", rate: "1/34.5", category: "unique" },
      { name: "Twisted buckler", rate: "1/34.5", category: "unique" },
      { name: "Dragon hunter crossbow", rate: "1/34.5", category: "unique" },
      { name: "Dinh's bulwark", rate: "1/34.5", category: "unique" },
      { name: "Dexterous prayer scroll", rate: "1/34.5", category: "unique" },
      { name: "Arcane prayer scroll", rate: "1/34.5", category: "unique" },
      { name: "Twisted ancestral colour kit", rate: "1/75", category: "unique" },
    ],
    common: [
      { name: "Herbs", rate: "common", category: "common" },
      { name: "Seeds", rate: "common", category: "common" },
      { name: "Dragon bones", rate: "common", category: "common" },
    ],
  },

  "chambers-of-xeric-challenge-mode": {
    uniques: [
      { name: "Twisted bow", rate: "1/34.5", category: "unique" },
      { name: "Kodai insignia", rate: "1/34.5", category: "unique" },
      { name: "Ancestral hat", rate: "1/34.5", category: "unique" },
      { name: "Ancestral robe top", rate: "1/34.5", category: "unique" },
      { name: "Ancestral robe bottom", rate: "1/34.5", category: "unique" },
      { name: "Dragon claws", rate: "1/34.5", category: "unique" },
      { name: "Elder maul", rate: "1/34.5", category: "unique" },
      { name: "Twisted buckler", rate: "1/34.5", category: "unique" },
      { name: "Dragon hunter crossbow", rate: "1/34.5", category: "unique" },
      { name: "Dinh's bulwark", rate: "1/34.5", category: "unique" },
      { name: "Dexterous prayer scroll", rate: "1/34.5", category: "unique" },
      { name: "Arcane prayer scroll", rate: "1/34.5", category: "unique" },
      { name: "Twisted ancestral colour kit", rate: "1/75", category: "unique" },
    ],
    common: [],
  },
};

/** Map boss names (normalised) to raid loot keys */
const BOSS_NAME_TO_RAID: Record<string, string> = {
  "theatre of blood": "theatre-of-blood",
  "theatre of blood: hard mode": "theatre-of-blood-hard-mode",
  "tombs of amascut": "tombs-of-amascut",
  "tombs of amascut: expert mode": "tombs-of-amascut-expert",
  "chambers of xeric": "chambers-of-xeric",
  "chambers of xeric: challenge mode": "chambers-of-xeric-challenge-mode",
};

export function getRaidLoot(bossName: string): RaidLootEntry | null {
  const key = BOSS_NAME_TO_RAID[bossName.toLowerCase()];
  return key ? (RAID_LOOT[key] ?? null) : null;
}
