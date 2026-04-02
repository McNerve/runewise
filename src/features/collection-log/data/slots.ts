export interface CollectionCategory {
  name: string;
  slots: string[];
}

export const COLLECTION_CATEGORIES: CollectionCategory[] = [
  {
    name: "God Wars Dungeon",
    slots: [
      "Bandos hilt", "Bandos chestplate", "Bandos tassets", "Bandos boots",
      "Armadyl hilt", "Armadyl helmet", "Armadyl chestplate", "Armadyl chainskirt",
      "Saradomin hilt", "Saradomin sword", "Armadyl crossbow",
      "Zamorak hilt", "Staff of the dead", "Zamorakian spear",
      "Godsword shard 1", "Godsword shard 2", "Godsword shard 3",
      "Pet general graardor", "Pet kree'arra", "Pet zilyana", "Pet k'ril tsutsaroth",
    ],
  },
  {
    name: "Chambers of Xeric",
    slots: [
      "Twisted bow", "Elder maul", "Kodai insignia", "Dragon claws",
      "Ancestral hat", "Ancestral robe top", "Ancestral robe bottom",
      "Dragon hunter crossbow", "Dexterous prayer scroll", "Arcane prayer scroll",
      "Dinh's bulwark", "Buckler", "Olmlet",
    ],
  },
  {
    name: "Theatre of Blood",
    slots: [
      "Scythe of vitur", "Ghrazi rapier", "Sanguinesti staff",
      "Justiciar faceguard", "Justiciar chestguard", "Justiciar legguards",
      "Avernic defender hilt", "Lil' zik",
    ],
  },
  {
    name: "Tombs of Amascut",
    slots: [
      "Osmumten's fang", "Tumeken's shadow", "Lightbearer",
      "Masori mask", "Masori body", "Masori chaps",
      "Elidinis' ward", "Tumeken's guardian",
    ],
  },
  {
    name: "Desert Treasure 2",
    slots: [
      "Chromium ingot", "Virtus mask", "Virtus robe top", "Virtus robe bottom",
      "Bellator ring", "Magus ring", "Ultor ring", "Venator ring",
      "Eye of the duke", "Baron", "Wisp", "Butch",
    ],
  },
  {
    name: "Slayer Bosses",
    slots: [
      "Abyssal whip", "Abyssal dagger", "Kraken tentacle",
      "Trident of the seas", "Hydra's claw", "Hydra leather",
      "Hydra tail", "Brimstone ring", "Jar of chemicals",
      "Cerberus primordial crystal", "Cerberus pegasian crystal", "Cerberus eternal crystal",
      "Hellpuppy", "Pet kraken", "Ikkle hydra", "Noon", "Skotos",
    ],
  },
  {
    name: "Solo Bosses",
    slots: [
      "Vorki", "Skeletal visage", "Draconic visage",
      "Pet snakeling", "Tanzanite fang", "Magic fang", "Serpentine visage",
      "Sraracha", "Prince black dragon", "Kalphite princess",
      "Baby mole", "Dagannoth prime pet", "Dagannoth rex pet", "Dagannoth supreme pet",
      "Corporeal Beast pet",
    ],
  },
  {
    name: "Clue Scrolls",
    slots: [
      "3rd age range top", "3rd age range legs", "3rd age range coif",
      "3rd age mage hat", "3rd age robe top", "3rd age robe",
      "3rd age melee helm", "3rd age platebody", "3rd age platelegs",
      "Rangers' tunic", "Ranger boots", "Robin hood hat",
      "Gilded platebody", "Gilded platelegs", "Gilded full helm",
      "Bloodhound",
    ],
  },
  {
    name: "Skilling Pets",
    slots: [
      "Heron", "Rock golem", "Beaver", "Baby chinchompa",
      "Giant squirrel", "Tangleroot", "Rocky", "Rift guardian",
      "Herbi", "Phoenix", "Tiny tempor",
    ],
  },
  {
    name: "Minigames",
    slots: [
      "Jad pet", "Zuk pet", "Youngllef",
      "Dragon defender", "Fighter torso",
      "Fire cape", "Infernal cape",
      "Void knight top", "Void knight robe", "Void knight gloves",
    ],
  },
];

export function getTotalSlots(): number {
  return COLLECTION_CATEGORIES.reduce((sum, cat) => sum + cat.slots.length, 0);
}
