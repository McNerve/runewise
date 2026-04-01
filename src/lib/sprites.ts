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
