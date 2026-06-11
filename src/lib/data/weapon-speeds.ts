// Curated weapon attack speeds in ticks. The wiki infobox_bonuses bucket
// carries no speed data, so this table only lists weapons whose speeds are
// unambiguous — meta weapons by exact name plus suffix families whose every
// member shares one speed. Unknown weapons return null and keep the manual
// speed input; a wrong number in a calculator is worse than a missing one.
// Source: https://oldschool.runescape.wiki/w/Attack_speed

const EXACT_SPEEDS: Record<string, number> = {
  // Melee
  "abyssal tentacle": 4,
  "abyssal bludgeon": 4,
  "ghrazi rapier": 4,
  "osmumten's fang": 5,
  "zamorakian hasta": 4,
  "zamorakian spear": 4,
  "dragon hunter lance": 4,
  "arclight": 4,
  "voidwaker": 4,
  "blade of saeldor": 4,
  "saradomin sword": 4,
  "saradomin's blessed sword": 4,
  "granite maul": 5,
  "elder maul": 6,
  "inquisitor's mace": 4, // exception to the mace family (5)
  "scythe of vitur": 5,
  "soulreaper axe": 5,
  "leaf-bladed battleaxe": 5, // exception to the battleaxe family (6)
  "dharok's greataxe": 7,
  "dragon claws": 4,
  "dual macuahuitl": 4,
  "keris partisan": 4,
  "swift blade": 3,
  "ham joint": 3,
  // Ranged
  "toxic blowpipe": 3,
  "twisted bow": 5,
  "bow of faerdhinen": 4,
  "crystal bow": 5,
  "venator bow": 5,
  // Magic (powered staves — cast rate)
  "trident of the seas": 4,
  "trident of the swamp": 4,
  "sanguinesti staff": 4,
  "holy sanguinesti staff": 4,
  "tumeken's shadow": 5,
};

// Checked in order after the exact table — longer/rarer suffixes first so
// e.g. "chainmace" wins over "mace".
const SUFFIX_SPEEDS: Array<[string, number]> = [
  ["chainmace", 4],
  ["scimitar", 4],
  ["dagger", 4],
  ["godsword", 6],
  ["shortbow", 4],
  ["longbow", 6],
  ["halberd", 7],
  ["battleaxe", 6],
  ["warhammer", 6],
  ["longsword", 5],
  ["2h sword", 7],
  ["whip", 4],
  ["mace", 5],
];

/** Attack speed in ticks for a weapon with a verified speed, else null. */
export function knownWeaponSpeed(name: string): number | null {
  const lower = name.toLowerCase();
  const exact = EXACT_SPEEDS[lower];
  if (exact !== undefined) return exact;
  for (const [suffix, speed] of SUFFIX_SPEEDS) {
    if (lower.endsWith(suffix)) return speed;
  }
  return null;
}
