const WIKI_IMG = "https://oldschool.runescape.wiki/images";

export function skillIcon(skill: string): string {
  const name = skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
  return `${WIKI_IMG}/${name}_icon.png`;
}

export function itemIcon(itemName: string): string {
  const name = itemName.replace(/ /g, "_");
  return `${WIKI_IMG}/${name}.png`;
}

export function bossIcon(bossName: string): string {
  const name = bossName.replace(/ /g, "_").replace(/'/g, "%27");
  return `${WIKI_IMG}/${name}.png`;
}

export const NAV_ICONS: Record<string, string> = {
  overview: `${WIKI_IMG}/Stats_icon.png`,
  "skill-calc": `${WIKI_IMG}/Antique_lamp_%28Normal%29.png`,
  "combat-calc": `${WIKI_IMG}/Combat_icon.png`,
  "dry-calc": `${WIKI_IMG}/Ring_of_wealth.png`,
  ge: `${WIKI_IMG}/Coins_10000.png`,
  "item-db": `${WIKI_IMG}/Bank_icon_%28empty%29.png`,
  "xp-table": `${WIKI_IMG}/Book_of_knowledge.png`,
  drops: `${WIKI_IMG}/Looting_bag.png`,
  tracker: `${WIKI_IMG}/Adventure_Log_icon.png`,
  bosses: `${WIKI_IMG}/Slayer_helmet_%28i%29.png`,
  quests: `${WIKI_IMG}/Quest_point_icon.png`,
  diaries: `${WIKI_IMG}/Achievement_Diaries_icon.png`,
  slayer: `${WIKI_IMG}/Slayer_icon.png`,
  news: `${WIKI_IMG}/Newspaper.png`,
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
