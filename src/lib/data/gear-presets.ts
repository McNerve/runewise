// Endgame gear presets — item names per slot, resolved from wiki equipment data at runtime
// Source: https://oldschool.runescape.wiki/w/Guide:Melee_Gear_Progression

export interface GearPreset {
  name: string;
  style: "melee" | "ranged" | "magic";
  slots: Partial<Record<string, string>>; // slot → item name
  prayer?: string;
  description?: string;
}

export const GEAR_PRESETS: GearPreset[] = [
  // ── Melee ──
  {
    name: "Max Melee",
    style: "melee",
    description: "Best-in-slot melee (Torva + Rapier)",
    slots: {
      head: "Torva full helm",
      body: "Torva platebody",
      legs: "Torva platelegs",
      cape: "Infernal cape",
      neck: "Amulet of torture",
      weapon: "Ghrazi rapier",
      shield: "Avernic defender",
      hands: "Ferocious gloves",
      feet: "Primordial boots",
      ring: "Ultor ring",
      ammo: "Rada's blessing 4",
    },
    prayer: "Piety",
  },
  {
    name: "Budget Melee",
    style: "melee",
    description: "Mid-game melee (Fighter torso + Whip)",
    slots: {
      head: "Helm of neitiznot",
      body: "Fighter torso",
      legs: "Obsidian platelegs",
      cape: "Fire cape",
      neck: "Amulet of fury",
      weapon: "Abyssal whip",
      shield: "Dragon defender",
      hands: "Barrows gloves",
      feet: "Dragon boots",
      ring: "Berserker ring (i)",
    },
    prayer: "Piety",
  },
  {
    name: "Scythe (Multi)",
    style: "melee",
    description: "Scythe of vitur for multi-hit bosses",
    slots: {
      head: "Torva full helm",
      body: "Torva platebody",
      legs: "Torva platelegs",
      cape: "Infernal cape",
      neck: "Amulet of torture",
      weapon: "Scythe of vitur",
      hands: "Ferocious gloves",
      feet: "Primordial boots",
      ring: "Ultor ring",
    },
    prayer: "Piety",
  },

  // ── Ranged ──
  {
    name: "Max Ranged",
    style: "ranged",
    description: "Best-in-slot ranged (Masori + Tbow)",
    slots: {
      head: "Masori mask (f)",
      body: "Masori body (f)",
      legs: "Masori chaps (f)",
      cape: "Ava's assembler",
      neck: "Necklace of anguish",
      weapon: "Twisted bow",
      hands: "Zaryte vambraces",
      feet: "Pegasian boots",
      ring: "Venator ring",
    },
    prayer: "Rigour",
  },
  {
    name: "Blowpipe",
    style: "ranged",
    description: "Toxic blowpipe for fast DPS",
    slots: {
      head: "Masori mask (f)",
      body: "Masori body (f)",
      legs: "Masori chaps (f)",
      cape: "Ava's assembler",
      neck: "Necklace of anguish",
      weapon: "Toxic blowpipe",
      hands: "Zaryte vambraces",
      feet: "Pegasian boots",
      ring: "Venator ring",
    },
    prayer: "Rigour",
  },
  {
    name: "Budget Ranged",
    style: "ranged",
    description: "Mid-game ranged (Black d'hide + RCB)",
    slots: {
      head: "Blessed coif",
      body: "Black d'hide body",
      legs: "Black d'hide chaps",
      cape: "Ava's assembler",
      neck: "Necklace of anguish",
      weapon: "Dragon crossbow",
      shield: "Twisted buckler",
      hands: "Barrows gloves",
      feet: "Blessed boots",
      ring: "Archers ring (i)",
    },
    prayer: "Eagle Eye",
  },

  // ── Magic ──
  {
    name: "Max Mage",
    style: "magic",
    description: "Best-in-slot magic (Ancestral + Shadow)",
    slots: {
      head: "Ancestral hat",
      body: "Ancestral robe top",
      legs: "Ancestral robe bottom",
      cape: "Imbued god cape",
      neck: "Occult necklace",
      weapon: "Tumeken's shadow",
      hands: "Tormented bracelet",
      feet: "Eternal boots",
      ring: "Magus ring",
    },
    prayer: "Augury",
  },
  {
    name: "Trident",
    style: "magic",
    description: "Trident of the swamp for slayer/bossing",
    slots: {
      head: "Ancestral hat",
      body: "Ancestral robe top",
      legs: "Ancestral robe bottom",
      cape: "Imbued god cape",
      neck: "Occult necklace",
      weapon: "Trident of the swamp",
      shield: "Arcane spirit shield",
      hands: "Tormented bracelet",
      feet: "Eternal boots",
      ring: "Magus ring",
    },
    prayer: "Augury",
  },
  {
    name: "Budget Mage",
    style: "magic",
    description: "Mid-game magic (Mystic + Trident)",
    slots: {
      head: "Mystic hat",
      body: "Mystic robe top",
      legs: "Mystic robe bottom",
      cape: "Imbued god cape",
      neck: "Occult necklace",
      weapon: "Trident of the seas",
      shield: "Book of darkness",
      hands: "Barrows gloves",
      feet: "Mystic boots",
      ring: "Seers ring (i)",
    },
    prayer: "Mystic Might",
  },
];
