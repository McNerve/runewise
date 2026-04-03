export const WIKI_IMG = "https://oldschool.runescape.wiki/images";

export function skillIcon(skill: string): string {
  const name = skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
  return `${WIKI_IMG}/${name}_icon.png`;
}

export function itemIcon(itemName: string): string {
  const name = itemName
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
  "Abyssal Sire": "Abyssal_Sire_icon.png",
  "Chambers of Xeric": "Olmlet_chathead.png",
  "Chaos Elemental": "Chaos_Elemental.png",
  "Chaos Fanatic": "Chaos_Fanatic.png",
  "Corporeal Beast": "Corporeal_Beast_icon.png",
  "Grotesque Guardians": "Grotesque_Guardians_icon.png",
  "Kalphite Queen": "Kalphite_Queen_icon.png",
  "King Black Dragon": "King_Black_Dragon_icon.png",
  "Kraken": "Kraken_icon.png",
  "Lunar Chests": "Blood_moon_helm.png",
  "Mimic": "Mimic.png",
  "Sarachnis": "Sarachnis_icon.png",
  "Theatre of Blood": "Verzik_Vitur_icon.png",
  "Thermonuclear Smoke Devil": "Smoke_devil_icon.png",
  "Tombs of Amascut": "Tumeken%27s_Guardian_chathead.png",
  "TzTok-Jad": "TzTok-Jad.png",
  "Vet'ion": "Vet%27ion.png",
  "Venenatis": "Venenatis.png",
  "Wintertodt": "Wintertodt_icon.png",
  "Yama": "Yama.png",
  "Zulrah": "Zulrah_icon.png",
  "Amoxliatl": "Amoxliatl.png",
  "Araxxor": "Nid_chathead.png",
  "Barrows Chests": "Barrows_Brothers_icon.png",
  "Crazy Archaeologist": "Crazy_archaeologist.png",
  "The Corrupted Gauntlet": "Crystalline_Hunllef_icon.png",
  "Deranged Archaeologist": "Deranged_archaeologist.png",
  "Duke Sucellus": "Duke_Sucellus.png",
  "The Gauntlet": "Crystalline_Hunllef_icon.png",
  "Moons of Peril": "Blood_Moon.png",
  "Phantom Muspah": "Phantom_Muspah_%28ranged%29.png",
  "Scurrius": "Scurrius.png",
  "The Fortis Colosseum": "Sol_Heredit.png",
  "Sol Heredit": "Sol_Heredit.png",
  "The Leviathan": "The_Leviathan.png",
  "Kree'Arra": "Kree%27arra_icon.png",
  "Callisto": "Callisto.png",
  "Hueycoatl": "Hueycoatl_body.png",
  "The Royal Titans": "Bran.png",
  "TzKal-Zuk": "TzKal-Zuk_icon.png",
  "Vardorvis": "Vardorvis.png",
  "The Whisperer": "The_Whisperer.png",
  "Blood Moon": "Blood_Moon.png",
  "Blue Moon": "Blue_Moon.png",
  "Eclipse Moon": "Eclipse_Moon.png",
  "Calvar'ion": "Calvar%27ion.png",
  "Spindel": "Spindel.png",
  "Artio": "Artio.png",
  "Scorpia": "Scorpia.png",
  "Obor": "Obor.png",
  "Bryophyta": "Bryophyta.png",
  "Hespori": "Hespori.png",
  "Phosani's Nightmare": "Phosani%27s_Nightmare.png",
  "Tempoross": "Tempoross.png",
  "Zalcano": "Zalcano.png",
  "The Mimic": "Mimic.png",
  "Dagannoth Rex": "Dagannoth_Rex.png",
  "Dagannoth Prime": "Dagannoth_Prime.png",
  "Dagannoth Supreme": "Dagannoth_Supreme.png",
  "Giant Mole": "Giant_Mole.png",
};

// Larger images (used in boss guide sidebar)
const BOSS_LARGE_ICON: Record<string, string> = {
  "Chambers of Xeric": "Chambers_of_Xeric_logo.png",
  "Theatre of Blood": "Theatre_of_Blood_logo.png",
  "Tombs of Amascut": "Tumeken%27s_Guardian_chathead.png",
  "Alchemical Hydra": "Alchemical_Hydra_%28serpentine%29.png",
  "Amoxliatl": "Amoxliatl.png",
  "Crazy Archaeologist": "Crazy_archaeologist.png",
  "Deranged Archaeologist": "Deranged_archaeologist.png",
  "Duke Sucellus": "Duke_Sucellus.png",
  "Grotesque Guardians": "Dusk.png",
  "Hueycoatl": "Hueycoatl_body.png",
  "The Nightmare": "The_Nightmare.png",
  "Phantom Muspah": "Phantom_Muspah_%28ranged%29.png",
  "The Royal Titans": "Bran.png",
  "Thermonuclear Smoke Devil": "Thermonuclear_smoke_devil.png",
  "The Whisperer": "The_Whisperer.png",
  "The Leviathan": "The_Leviathan.png",
  "Moons of Peril": "Blood_Moon.png",
  "The Fortis Colosseum": "Sol_Heredit.png",
  "Zulrah": "Zulrah.png",
  "Blood Moon": "Blood_Moon.png",
  "Blue Moon": "Blue_Moon.png",
  "Eclipse Moon": "Eclipse_Moon.png",
  "Calvar'ion": "Calvar%27ion.png",
  "Spindel": "Spindel.png",
  "Artio": "Artio.png",
  "Giant Mole": "Giant_Mole.png",
  "Dagannoth Rex": "Dagannoth_Rex.png",
  "Dagannoth Prime": "Dagannoth_Prime.png",
  "Dagannoth Supreme": "Dagannoth_Supreme.png",
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

export const NAV_ICONS: Record<string, string> = {
  overview: `${WIKI_IMG}/Character_Summary_tab_icon.png`,
  "collection-log": `${WIKI_IMG}/Collection_log.png`,
  lookup: `${WIKI_IMG}/Magnifying_glass.png`,
  "skill-calc": `${WIKI_IMG}/Stats_icon.png`,
  "dry-calc": `${WIKI_IMG}/Ring_of_wealth.png`,
  "xp-table": `${WIKI_IMG}/Book_of_knowledge.png`,
  tracker: `${WIKI_IMG}/Adventurer%27s_log.png`,
  bosses: `${WIKI_IMG}/Slayer_helmet_%28i%29.png`,
  raids: `${WIKI_IMG}/Olmlet.png`,
  loot: `${WIKI_IMG}/Looting_bag.png`,
  progress: `${WIKI_IMG}/Character_Summary_tab_icon.png`,
  slayer: `${WIKI_IMG}/Slayer_icon.png`,
  news: `${WIKI_IMG}/Newspaper.png`,
  "dps-calc": `${WIKI_IMG}/Dragon_claws_detail.png`,
  "training-plan": `${WIKI_IMG}/Quest_point_icon.png`,
  "gear-compare": `${WIKI_IMG}/Armour_case.png`,
  watchlist: `${WIKI_IMG}/Platinum_token_detail.png`,
  timers: `${WIKI_IMG}/Farming_icon.png`,
  spells: `${WIKI_IMG}/Magic_icon.png`,
  "world-map": `${WIKI_IMG}/Globe.png`,
  stars: `${WIKI_IMG}/Stardust.png`,
  "clue-helper": `${WIKI_IMG}/Clue_scroll_%28hard%29.png`,
  "combat-tasks": `${WIKI_IMG}/Combat_Achievements_icon.png`,
  "money-making": `${WIKI_IMG}/Coins_detail.png`,
  "production-calc": `${WIKI_IMG}/Crafting_icon.png`,
  kingdom: `${WIKI_IMG}/Crown.png`,
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
