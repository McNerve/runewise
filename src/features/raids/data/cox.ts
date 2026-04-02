export interface RaidRoom {
  name: string;
  type: "combat" | "puzzle" | "boss";
  mechanics: string;
  tips: string;
}

export interface RaidUnique {
  name: string;
  pointsRequired: string;
  rateDescription: string;
}

export const COX_ROOMS: RaidRoom[] = [
  { name: "Tekton", type: "combat", mechanics: "Melee golem that retreats to anvil to heal. Must DPS faster than he heals. Weak to crush (especially Elder Maul/DWH).", tips: "Spec with DWH immediately. Group attacks during vulnerable phase. Don't let him reach the anvil at low HP." },
  { name: "Ice Demon", type: "combat", mechanics: "Frozen demon that must be thawed with fire spells or kindling braziers. Takes reduced damage while frozen.", tips: "Light all 4 braziers, then range/mage. Chop trees for kindling. AFK-friendly in teams." },
  { name: "Lizardman Shamans", type: "combat", mechanics: "Three shamans with purple spawn, acid spit, and jump attack. Must dodge all three mechanics.", tips: "Stay 4 tiles away to avoid jump. Kill purple spawns immediately. Don't stand in acid." },
  { name: "Vanguards", type: "combat", mechanics: "Three vanguards (melee/range/mage) that heal if HP difference exceeds threshold. Must be damaged evenly.", tips: "Coordinate DPS across all three. Switch targets when HP gaps appear. Most teamwork-intensive room." },
  { name: "Vasa Nistirio", type: "combat", mechanics: "Crystal boss that teleports to rocks for healing. Attacks with magic and a draining special. Rocks must be mined.", tips: "Mine the crystal he teleports to ASAP. Protect from Magic. Use ranged or melee." },
  { name: "Vespula", type: "combat", mechanics: "Wasp boss with portal that spawns soldiers. Lux grubs must be fed to prevent hatching. Portal takes damage from soldiers.", tips: "Feed grubs to keep them from hatching. Kill soldiers near portal for damage. Most complex combat room." },
  { name: "Muttadiles", type: "combat", mechanics: "Mother and baby muttadile. Baby is killed first. Both can eat from the meat tree to heal. Chop tree to prevent healing.", tips: "Chop the meat tree early. Kill baby first. Mother goes to tree at low HP — watch for it." },
  { name: "Guardians", type: "combat", mechanics: "Two guardians that must be killed simultaneously. If one dies too early, the other enrages. Use pickaxes to mine.", tips: "Balance DPS between both. They're weak to pickaxe attacks. Coordinate in teams." },
  { name: "Crabs", type: "puzzle", mechanics: "Color-matching puzzle. Smash colored crystals with crabs of the matching color. Wrong color heals the crystal.", tips: "Focus on one crystal at a time. Use map markers for colors. Communication is key in teams." },
  { name: "Thieving", type: "puzzle", mechanics: "Chests with poison traps. Grubs found in chests are used in Vespula room. Avoid poison by searching carefully.", tips: "Search chests along walls. Grubs go in trough for later. Bring antidote if available." },
  { name: "Tightrope", type: "puzzle", mechanics: "Balance across a tightrope while magers attack. One player crosses while others protect with range/mage.", tips: "Rangers kill the magers on both sides. Crosser just clicks and waits. Quick room if coordinated." },
  { name: "Great Olm", type: "boss", mechanics: "Three-phase final boss. Head attacks with magic/ranged, left hand does crystal/lightning/swap, right hand does fire/acid/healing. Final phase: no hands, head only.", tips: "Melee hand runner controls position. Protect from Magic default, switch on ranged. Skip specials by DPSing hands fast. Final phase: prayer switching required." },
];

export const COX_UNIQUES: RaidUnique[] = [
  { name: "Twisted bow", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid at 30K points (scales with team points)" },
  { name: "Kodai insignia", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Elder maul", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Dragon claws", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Ancestral hat", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Ancestral robe top", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Ancestral robe bottom", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Dragon hunter crossbow", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Dexterous prayer scroll", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Arcane prayer scroll", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Dinh's bulwark", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Buckler", pointsRequired: "~65,000", rateDescription: "1/34.5 per raid" },
  { name: "Olmlet", pointsRequired: "N/A", rateDescription: "1/53 upon receiving a unique (pet)" },
];
