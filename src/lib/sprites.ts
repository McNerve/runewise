export const WIKI_IMG = "https://oldschool.runescape.wiki/images";

export function skillIcon(skill: string): string {
  const name = skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
  return `${WIKI_IMG}/${name}_icon.png`;
}

/** Encode a raw GE mapping icon filename for use in a wiki image URL. */
export function encodeIconFilename(filename: string): string {
  return filename.replace(/ /g, "_").replace(/'/g, "%27");
}

// Global icon cache from GE mapping — populated by initItemIconCache() in itemIcons.ts
let _iconCache: Map<string, string> | null = null;
export function setIconCache(cache: Map<string, string>) { _iconCache = cache; }

export function itemIcon(itemName: string): string {
  // Try GE mapping icon first (handles quantity variants like "5" suffix)
  if (_iconCache) {
    const geIcon = _iconCache.get(itemName.toLowerCase());
    if (geIcon) return `${WIKI_IMG}/${encodeIconFilename(geIcon)}`;
  }
  // Fallback: generate URL from item name
  const name = itemName
    .replace(/ \((\d)\)/g, "($1)")
    .replace(/ /g, "_")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
  return `${WIKI_IMG}/${name}.png`;
}

const PET_ICON_FIXUPS: Record<string, string> = {
  "Phoenix_pet.png": "Phoenix.png",
  "Baby_chinchompa.png": "Baby_chinchompa_%28grey%29.png",
  "Rift_guardian.png": "Rift_guardian_chathead.png",
  "Ikkle_Hydra.png": "Ikkle_Hydra_%28serpentine%29.png",
  "Corporeal_critter.png": "Corporeal_Critter.png",
  "Muphin.png": "Muphin_%28follower%2C_ranged%29.png",
  "Lil%27_Amoxliatl.png": "Amoxliatl.png",
};

export function petIcon(iconFile: string): string {
  return `${WIKI_IMG}/${PET_ICON_FIXUPS[iconFile] ?? iconFile}`;
}

// Small pixel icons (used in hiscores-style grids)
const BOSS_SMALL_ICON: Record<string, string> = {
  // Raids
  "Chambers of Xeric": "Olmlet_chathead.png",
  "Chambers of Xeric: Challenge Mode": "Olmlet_chathead.png",
  "Theatre of Blood": "Verzik_Vitur_icon.png",
  "Theatre of Blood: Hard Mode": "Verzik_Vitur_icon.png",
  "Tombs of Amascut": "Tumeken%27s_Guardian_chathead.png",
  "Tombs of Amascut: Expert Mode": "Tumeken%27s_Guardian_chathead.png",

  // GWD
  "General Graardor": "General_Graardor_icon.png",
  "Kree'arra": "Kree%27arra_icon.png",
  "Kree'Arra": "Kree%27arra_icon.png",
  "Commander Zilyana": "Commander_Zilyana_icon.png",
  "K'ril Tsutsaroth": "K%27ril_Tsutsaroth_icon.png",
  "Nex": "Nex_icon.png",

  // Slayer
  "Alchemical Hydra": "Alchemical_Hydra_%28serpentine%29.png",
  "Cerberus": "Cerberus_icon.png",
  "Grotesque Guardians": "Grotesque_Guardians_icon.png",
  "Kraken": "Kraken_icon.png",
  "Thermonuclear Smoke Devil": "Smoke_devil_icon.png",
  "Abyssal Sire": "Abyssal_Sire_icon.png",

  // Wilderness
  "Vet'ion": "Vet%27ion.png",
  "Venenatis": "Venenatis.png",
  "Callisto": "Callisto.png",
  "Calvar'ion": "Calvar%27ion.png",
  "Spindel": "Spindel.png",
  "Artio": "Artio.png",
  "Chaos Elemental": "Chaos_Elemental.png",
  "Chaos Fanatic": "Chaos_Fanatic.png",
  "Crazy Archaeologist": "Crazy_archaeologist.png",
  "Scorpia": "Scorpia.png",

  // Other
  "Vorkath": "Vorkath_icon.png",
  "Zulrah": "Zulrah_icon.png",
  "Corporeal Beast": "Corporeal_Beast_icon.png",
  "Nightmare": "The_Nightmare_icon.png",
  "Phosani's Nightmare": "The_Nightmare_icon.png",
  "Phantom Muspah": "Phantom_Muspah_%28ranged%29.png",
  "Duke Sucellus": "Duke_Sucellus.png",
  "The Leviathan": "The_Leviathan.png",
  "Vardorvis": "Vardorvis.png",
  "The Whisperer": "The_Whisperer.png",
  "Araxxor": "Araxxor.png",
  "Scurrius": "Scurrius.png",
  "Dagannoth Rex": "Dagannoth_Rex.png",
  "Dagannoth Prime": "Dagannoth_Prime.png",
  "Dagannoth Supreme": "Dagannoth_Supreme.png",
  "Blood Moon": "Blood_Moon.png",
  "Blue Moon": "Blue_Moon.png",
  "Eclipse Moon": "Eclipse_Moon.png",
  "Giant Mole": "Giant_Mole.png",
  "King Black Dragon": "King_Black_Dragon_icon.png",
  "Obor": "Obor.png",
  "Bryophyta": "Bryophyta.png",
  "Barrows Chests": "Barrows_Brothers_icon.png",
  "Kalphite Queen": "Kalphite_Queen_icon.png",
  "Skotizo": "Skotizo.png",
  "Hespori": "Hespori.png",
  "Deranged Archaeologist": "Deranged_archaeologist.png",
  "Sarachnis": "Sarachnis_icon.png",
  "Wintertodt": "Wintertodt_icon.png",
  "Tempoross": "Tempoross.png",
  "Zalcano": "Zalcano.png",
  "The Gauntlet": "Crystalline_Hunllef_icon.png",
  "The Corrupted Gauntlet": "Corrupted_Hunllef.png",
  "The Mimic": "Mimic.png",
  "TzTok-Jad": "TzTok-Jad.png",
  "TzKal-Zuk": "TzKal-Zuk_icon.png",

  // Varlamore
  "Amoxliatl": "Amoxliatl.png",
  "Hueycoatl": "Hueycoatl_body.png",
  "Sol Heredit": "Sol_Heredit.png",

  // Hiscores-tracked
  "Lunar Chests": "Blood_moon_helm.png",
  "Yama": "Yama.png",
  "The Royal Titans": "Bran.png",

  // Aliases (hiscores names that differ)
  "Mimic": "Mimic.png",
  "The Fortis Colosseum": "Sol_Heredit.png",
  "Moons of Peril": "Blood_Moon.png",
};

// Larger images (used in boss guide header)
const BOSS_LARGE_ICON: Record<string, string> = {
  // Raids
  "Chambers of Xeric": "Chambers_of_Xeric_logo.png",
  "Chambers of Xeric: Challenge Mode": "Chambers_of_Xeric_logo.png",
  "Theatre of Blood": "Theatre_of_Blood_logo.png",
  "Theatre of Blood: Hard Mode": "Theatre_of_Blood_logo.png",
  "Tombs of Amascut": "Tumeken%27s_Guardian_chathead.png",
  "Tombs of Amascut: Expert Mode": "Tumeken%27s_Guardian_chathead.png",

  // GWD
  "General Graardor": "General_Graardor.png",
  "Kree'arra": "Kree%27arra.png",
  "Commander Zilyana": "Commander_Zilyana.png",
  "K'ril Tsutsaroth": "K%27ril_Tsutsaroth.png",
  "Nex": "Nex.png",

  // Slayer
  "Alchemical Hydra": "Alchemical_Hydra_%28serpentine%29.png",
  "Cerberus": "Cerberus.png",
  "Grotesque Guardians": "Dusk.png",
  "Kraken": "Kraken.png",
  "Thermonuclear Smoke Devil": "Thermonuclear_smoke_devil.png",
  "Abyssal Sire": "Abyssal_Sire.png",

  // Wilderness
  "Vet'ion": "Vet%27ion.png",
  "Venenatis": "Venenatis.png",
  "Callisto": "Callisto.png",
  "Calvar'ion": "Calvar%27ion.png",
  "Spindel": "Spindel.png",
  "Artio": "Artio.png",
  "Chaos Elemental": "Chaos_Elemental.png",
  "Chaos Fanatic": "Chaos_Fanatic.png",
  "Crazy Archaeologist": "Crazy_archaeologist.png",
  "Scorpia": "Scorpia.png",

  // Other
  "Vorkath": "Vorkath.png",
  "Zulrah": "Zulrah_%28serpentine%29.png",
  "Corporeal Beast": "Corporeal_Beast.png",
  "Nightmare": "The_Nightmare.png",
  "Phosani's Nightmare": "The_Nightmare.png",
  "Phantom Muspah": "Phantom_Muspah_%28ranged%29.png",
  "Duke Sucellus": "Duke_Sucellus.png",
  "The Leviathan": "The_Leviathan.png",
  "Vardorvis": "Vardorvis.png",
  "The Whisperer": "The_Whisperer.png",
  "Araxxor": "Araxxor.png",
  "Scurrius": "Scurrius.png",
  "Dagannoth Rex": "Dagannoth_Rex.png",
  "Dagannoth Prime": "Dagannoth_Prime.png",
  "Dagannoth Supreme": "Dagannoth_Supreme.png",
  "Blood Moon": "Blood_Moon.png",
  "Blue Moon": "Blue_Moon.png",
  "Eclipse Moon": "Eclipse_Moon.png",
  "Giant Mole": "Giant_Mole.png",
  "King Black Dragon": "King_Black_Dragon.png",
  "Obor": "Obor.png",
  "Bryophyta": "Bryophyta.png",
  "Barrows Chests": "Barrows_Brothers.png",
  "Kalphite Queen": "Kalphite_Queen.png",
  "Skotizo": "Skotizo.png",
  "Hespori": "Hespori.png",
  "Deranged Archaeologist": "Deranged_archaeologist.png",
  "Sarachnis": "Sarachnis.png",
  "Wintertodt": "Wintertodt.png",
  "Tempoross": "Tempoross.png",
  "Zalcano": "Zalcano.png",
  "The Gauntlet": "Crystalline_Hunllef.png",
  "The Corrupted Gauntlet": "Corrupted_Hunllef.png",
  "The Mimic": "Mimic.png",
  "TzTok-Jad": "TzTok-Jad.png",
  "TzKal-Zuk": "TzKal-Zuk.png",

  // Varlamore
  "Amoxliatl": "Amoxliatl.png",
  "Hueycoatl": "Hueycoatl_body.png",
  "Sol Heredit": "Sol_Heredit.png",

  // Hiscores-tracked
  "Lunar Chests": "Blood_Moon.png",
  "Yama": "Yama.png",
  "The Royal Titans": "Bran.png",

  // Aliases
  "The Fortis Colosseum": "Sol_Heredit.png",
  "Moons of Peril": "Blood_Moon.png",
};

export function bossIcon(bossName: string): string {
  if (BOSS_LARGE_ICON[bossName]) return `${WIKI_IMG}/${BOSS_LARGE_ICON[bossName]}`;
  const name = bossName.replace(/ /g, "_").replace(/'/g, "%27");
  return `${WIKI_IMG}/${name}.png`;
}

export function bossIconSmall(bossName: string): string {
  if (BOSS_SMALL_ICON[bossName]) return `${WIKI_IMG}/${BOSS_SMALL_ICON[bossName]}`;
  const name = bossName.replace(/ /g, "_").replace(/'/g, "%27");
  return `${WIKI_IMG}/${name}_icon.png`;
}

// Hand-curated overrides for NPC icons that don't match the default
// "{Name}.png" pattern on the wiki.
const NPC_ICON_OVERRIDES: Record<string, string> = {
  "Bob": "Bob_Barter.png",
};

/**
 * Best-effort wiki image URL for an NPC or shopkeeper. Consumers should
 * combine with a <WikiImage fallback="..."/> so a 404 still degrades cleanly.
 */
export function npcIcon(npcName: string): string {
  if (NPC_ICON_OVERRIDES[npcName]) return `${WIKI_IMG}/${NPC_ICON_OVERRIDES[npcName]}`;
  // Strip decorative characters (tildes, asterisks, quotes).
  const cleaned = npcName
    .replace(/[~"*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const name = cleaned.replace(/ /g, "_").replace(/'/g, "%27");
  return `${WIKI_IMG}/${name}.png`;
}

export const NAV_ICONS: Record<string, string> = {
  home: `${WIKI_IMG}/Teleport_to_House_icon_%28mobile%29.png`,
  overview: `${WIKI_IMG}/Character_Summary_tab_icon.png`,
  "collection-log": `${WIKI_IMG}/Collection_log.png`,
  lookup: `${WIKI_IMG}/Magnifying_glass.png`,
  "skill-calc": `${WIKI_IMG}/Stats_icon.png`,
  "dry-calc": `${WIKI_IMG}/Ring_of_wealth.png`,
  "xp-table": `${WIKI_IMG}/Book_of_knowledge.png`,
  tracker: `${WIKI_IMG}/Partyhat_%26_specs.png`,
  bosses: `${WIKI_IMG}/Combat_icon.png`,
  raids: `${WIKI_IMG}/Olmlet.png`,
  loot: `${WIKI_IMG}/Looting_bag.png`,
  progress: `${WIKI_IMG}/Character_Summary_tab_icon.png`,
  slayer: `${WIKI_IMG}/Slayer_helmet_%28i%29.png`,
  news: `${WIKI_IMG}/Newspaper.png`,
  "dps-calc": `${WIKI_IMG}/archive/20220902042551%21Damage_hitsplat_%28max_hit%29.png`,
  "training-plan": `${WIKI_IMG}/Quest_point_icon.png`,
  "gear-compare": `${WIKI_IMG}/Worn_Equipment.png`,
  watchlist: `${WIKI_IMG}/Platinum_token_detail.png`,
  timers: `${WIKI_IMG}/Farming_icon.png`,
  spells: `${WIKI_IMG}/Magic_icon.png`,
  "world-map": `${WIKI_IMG}/World_map_icon.png`,
  stars: `${WIKI_IMG}/Star_fragment_detail.png`,
  "clue-helper": `${WIKI_IMG}/Clue_scroll_%28hard%29.png`,
  "combat-tasks": `${WIKI_IMG}/Combat_Achievements_icon.png`,
  "money-making": `${WIKI_IMG}/Coins_detail.png`,
  "production-calc": `${WIKI_IMG}/Crafting_icon.png`,
  "shop-helper": `${WIKI_IMG}/General_store_icon.png`,
  kingdom: `${WIKI_IMG}/Royal_crown.png`,
  wiki: `${WIKI_IMG}/Enchanted_scroll.png`,
  "pet-calc": `${WIKI_IMG}/Heron.png`,
  settings: `${WIKI_IMG}/Options_icon.png`,
  market: `${WIKI_IMG}/Grand_Exchange_icon.png`,
};

export const SKILL_ICONS: Record<string, string> = {
  Attack: skillIcon("Attack"),
  Strength: skillIcon("Strength"),
  Defence: skillIcon("Defence"),
  Ranged: skillIcon("Ranged"),
  Prayer: skillIcon("Prayer"),
  Magic: skillIcon("Magic"),
  Runecraft: skillIcon("Runecraft"),
  Hitpoints: skillIcon("Hitpoints"),
  Crafting: skillIcon("Crafting"),
  Mining: skillIcon("Mining"),
  Smithing: skillIcon("Smithing"),
  Fishing: skillIcon("Fishing"),
  Cooking: skillIcon("Cooking"),
  Firemaking: skillIcon("Firemaking"),
  Woodcutting: skillIcon("Woodcutting"),
  Agility: skillIcon("Agility"),
  Herblore: skillIcon("Herblore"),
  Thieving: skillIcon("Thieving"),
  Fletching: skillIcon("Fletching"),
  Slayer: skillIcon("Slayer"),
  Farming: skillIcon("Farming"),
  Construction: skillIcon("Construction"),
  Hunter: skillIcon("Hunter"),
  Sailing: skillIcon("Sailing"),
};
