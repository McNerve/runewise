export type MoneyIntensity = "afk" | "low" | "medium" | "high";

export interface MoneyMethod {
  name: string;
  category: "Combat" | "Skilling" | "Processing" | "Collecting";
  skills: { name: string; level: number }[];
  baseGpPerHr: number;
  description: string;
  members: boolean;
  intensity?: MoneyIntensity;
}

export const MONEY_METHODS: MoneyMethod[] = [
  // === Combat ===
  { name: "Corrupted Gauntlet", category: "Combat", skills: [{ name: "Attack", level: 80 }, { name: "Strength", level: 80 }, { name: "Defence", level: 70 }, { name: "Ranged", level: 80 }, { name: "Magic", level: 80 }], baseGpPerHr: 5_000_000, description: "Complete Corrupted Gauntlet runs for crystal armour seeds and enhanced weapon seeds", members: true },
  { name: "Theatre of Blood", category: "Combat", skills: [{ name: "Attack", level: 90 }, { name: "Strength", level: 90 }, { name: "Ranged", level: 90 }, { name: "Magic", level: 90 }, { name: "Prayer", level: 77 }], baseGpPerHr: 6_000_000, description: "Complete Theatre of Blood raids in a team of 4-5", members: true },
  { name: "Chambers of Xeric", category: "Combat", skills: [{ name: "Attack", level: 85 }, { name: "Strength", level: 85 }, { name: "Ranged", level: 85 }, { name: "Mining", level: 70 }, { name: "Herblore", level: 78 }], baseGpPerHr: 4_000_000, description: "Complete Chambers of Xeric raids for mega-rare drops", members: true },
  { name: "Vorkath", category: "Combat", skills: [{ name: "Ranged", level: 90 }, { name: "Prayer", level: 77 }, { name: "Defence", level: 75 }], baseGpPerHr: 3_500_000, description: "Kill Vorkath with DHCB or Dragon hunter lance for consistent GP", members: true },
  { name: "Alchemical Hydra", category: "Combat", skills: [{ name: "Slayer", level: 95 }, { name: "Ranged", level: 85 }], baseGpPerHr: 3_000_000, description: "Kill Alchemical Hydra on Slayer task for claw and leather drops", members: true },
  { name: "Zulrah", category: "Combat", skills: [{ name: "Magic", level: 85 }, { name: "Ranged", level: 85 }], baseGpPerHr: 2_500_000, description: "Kill Zulrah with magic/ranged switches for scales and unique drops", members: true },
  { name: "Nex", category: "Combat", skills: [{ name: "Attack", level: 90 }, { name: "Strength", level: 90 }, { name: "Hitpoints", level: 90 }, { name: "Ranged", level: 90 }], baseGpPerHr: 4_500_000, description: "Kill Nex in a mass or small team for Torva armour pieces", members: true },
  { name: "Phantom Muspah", category: "Combat", skills: [{ name: "Magic", level: 85 }, { name: "Ranged", level: 85 }], baseGpPerHr: 2_500_000, description: "Kill Phantom Muspah for ancient essence and sapphire drops", members: true },
  { name: "Revenant caves", category: "Combat", skills: [{ name: "Ranged", level: 80 }], baseGpPerHr: 2_500_000, description: "Kill revenants in the Wilderness for ancient statuettes and weapons", members: true },
  { name: "Cerberus", category: "Combat", skills: [{ name: "Slayer", level: 91 }, { name: "Attack", level: 80 }], baseGpPerHr: 2_000_000, description: "Kill Cerberus for primordial, pegasian, and eternal crystals", members: true },
  { name: "Demonic gorillas", category: "Combat", skills: [{ name: "Attack", level: 80 }, { name: "Ranged", level: 80 }, { name: "Prayer", level: 43 }], baseGpPerHr: 2_000_000, description: "Kill demonic gorillas for zenyte shards", members: true },
  { name: "Nightmare", category: "Combat", skills: [{ name: "Attack", level: 85 }, { name: "Strength", level: 85 }, { name: "Hitpoints", level: 85 }], baseGpPerHr: 3_000_000, description: "Kill The Nightmare in a small team for orbs and mace", members: true },
  { name: "Barrows", category: "Combat", skills: [{ name: "Magic", level: 75 }, { name: "Prayer", level: 43 }], baseGpPerHr: 1_000_000, description: "Complete Barrows runs for armour set pieces and runes", members: true },
  { name: "Brutal black dragons", category: "Combat", skills: [{ name: "Ranged", level: 77 }, { name: "Slayer", level: 77 }], baseGpPerHr: 800_000, description: "Kill brutal black dragons in Catacombs for bones and hides", members: true },
  { name: "Gargoyles", category: "Combat", skills: [{ name: "Slayer", level: 75 }], baseGpPerHr: 500_000, description: "Kill gargoyles in the Slayer Tower with auto-smash", members: true },
  { name: "Rune dragons", category: "Combat", skills: [{ name: "Slayer", level: 1 }, { name: "Ranged", level: 80 }], baseGpPerHr: 1_200_000, description: "Kill rune dragons for consistent rune bar drops and dragon limbs", members: true },
  { name: "Araxxor", category: "Combat", skills: [{ name: "Attack", level: 85 }, { name: "Strength", level: 85 }], baseGpPerHr: 3_500_000, description: "Kill Araxxor for the Noxious halberd pieces", members: true },
  { name: "Duke Sucellus", category: "Combat", skills: [{ name: "Attack", level: 80 }, { name: "Strength", level: 80 }], baseGpPerHr: 2_800_000, description: "Kill Duke Sucellus for Virtus robes and chromium ingots", members: true },
  { name: "Whisperer", category: "Combat", skills: [{ name: "Magic", level: 85 }, { name: "Prayer", level: 77 }], baseGpPerHr: 3_200_000, description: "Kill the Whisperer for Bellator ring and shadow drops", members: true },
  { name: "Vardorvis", category: "Combat", skills: [{ name: "Attack", level: 85 }, { name: "Strength", level: 85 }], baseGpPerHr: 3_000_000, description: "Kill Vardorvis for Ultor ring and executioner's axe head", members: true, intensity: "medium" },
  { name: "Green dragons", category: "Combat", skills: [], baseGpPerHr: 500_000, description: "Kill green dragons in Wilderness for bones and hides", members: false },
  { name: "Sarachnis", category: "Combat", skills: [{ name: "Attack", level: 70 }], baseGpPerHr: 700_000, description: "Kill Sarachnis for the Sarachnis cudgel", members: true },

  // === Skilling ===
  { name: "Blast Furnace (Rune bars)", category: "Skilling", skills: [{ name: "Smithing", level: 85 }], baseGpPerHr: 1_200_000, description: "Smelt runite bars at the Blast Furnace", members: true },
  { name: "Blast Furnace (Adamant bars)", category: "Skilling", skills: [{ name: "Smithing", level: 70 }], baseGpPerHr: 800_000, description: "Smelt adamantite bars at the Blast Furnace", members: true },
  { name: "Hunting black chinchompas", category: "Skilling", skills: [{ name: "Hunter", level: 73 }], baseGpPerHr: 1_500_000, description: "Hunt black chinchompas in the Wilderness", members: true },
  { name: "Hunting red chinchompas", category: "Skilling", skills: [{ name: "Hunter", level: 63 }], baseGpPerHr: 700_000, description: "Hunt red chinchompas in Feldip Hills", members: true },
  { name: "Crafting blood runes", category: "Skilling", skills: [{ name: "Runecraft", level: 77 }], baseGpPerHr: 800_000, description: "Craft blood runes at the true altar", members: true },
  { name: "Crafting wrath runes", category: "Skilling", skills: [{ name: "Runecraft", level: 95 }], baseGpPerHr: 1_600_000, description: "Craft wrath runes on Arceuus with abyss", members: true },
  { name: "Mining Amethyst", category: "Skilling", skills: [{ name: "Mining", level: 92 }], baseGpPerHr: 400_000, description: "Mine amethyst in the Mining Guild (AFK)", members: true },
  { name: "Fishing Anglerfish", category: "Skilling", skills: [{ name: "Fishing", level: 82 }], baseGpPerHr: 300_000, description: "Fish anglerfish in Port Piscarilius (AFK)", members: true },
  { name: "Fishing Dark crabs", category: "Skilling", skills: [{ name: "Fishing", level: 85 }], baseGpPerHr: 350_000, description: "Fish dark crabs in the Wilderness Resource Area", members: true },
  { name: "Woodcutting Magic trees", category: "Skilling", skills: [{ name: "Woodcutting", level: 75 }], baseGpPerHr: 150_000, description: "Chop magic trees for magic logs", members: true },
  { name: "Pickpocketing Master Farmers", category: "Skilling", skills: [{ name: "Thieving", level: 38 }], baseGpPerHr: 600_000, description: "Pickpocket Master Farmers for herb seeds", members: true },
  { name: "Pickpocketing Elves", category: "Skilling", skills: [{ name: "Thieving", level: 85 }], baseGpPerHr: 3_000_000, description: "Pickpocket elves in Prifddinas for enhanced crystal teleport seeds", members: true },
  { name: "Drift net fishing", category: "Skilling", skills: [{ name: "Fishing", level: 47 }, { name: "Hunter", level: 44 }], baseGpPerHr: 500_000, description: "Use drift nets in the underwater area for fishing and hunter XP", members: true },
  { name: "Farming herb runs", category: "Skilling", skills: [{ name: "Farming", level: 32 }], baseGpPerHr: 2_000_000, description: "Plant ranarr/snapdragon seeds across all patches (effective GP/hr)", members: true },
  { name: "Birdhouse runs", category: "Skilling", skills: [{ name: "Hunter", level: 5 }, { name: "Crafting", level: 5 }], baseGpPerHr: 1_000_000, description: "Passive hunter via birdhouse runs every 50 minutes (effective GP/hr)", members: true },

  // === Processing ===
  { name: "Tanning dragonhide", category: "Processing", skills: [], baseGpPerHr: 1_000_000, description: "Tan dragonhides at the tanner using Make Leather spell or NPC", members: true },
  { name: "Enchanting bolts", category: "Processing", skills: [{ name: "Magic", level: 4 }], baseGpPerHr: 600_000, description: "Enchant gem-tipped bolts for profit", members: true },
  { name: "Making unfinished potions", category: "Processing", skills: [{ name: "Herblore", level: 3 }], baseGpPerHr: 400_000, description: "Combine grimy herbs with vials of water", members: true },
  { name: "Cleaning herbs (Ranarr)", category: "Processing", skills: [{ name: "Herblore", level: 25 }], baseGpPerHr: 500_000, description: "Clean grimy ranarr weeds for profit", members: true },
  { name: "Cleaning herbs (Torstol)", category: "Processing", skills: [{ name: "Herblore", level: 75 }], baseGpPerHr: 700_000, description: "Clean grimy torstols — high profit margin herb", members: true },
  { name: "Cooking Karambwan", category: "Processing", skills: [{ name: "Cooking", level: 30 }], baseGpPerHr: 300_000, description: "Cook raw karambwans using the 1-tick method", members: true },
  { name: "Making cannonballs", category: "Processing", skills: [{ name: "Smithing", level: 35 }], baseGpPerHr: 200_000, description: "Smelt steel bars into cannonballs (AFK)", members: true },
  { name: "Blast Furnace (Steel bars)", category: "Processing", skills: [{ name: "Smithing", level: 30 }], baseGpPerHr: 600_000, description: "Smelt steel bars at the Blast Furnace for profit", members: true },
  { name: "Crushing bird nests", category: "Processing", skills: [], baseGpPerHr: 500_000, description: "Crush bird nests into crushed nests for herblore", members: true },
  { name: "Stringing magic longbows", category: "Processing", skills: [{ name: "Fletching", level: 85 }], baseGpPerHr: 250_000, description: "String magic longbows for alching or selling", members: true },
  { name: "Making stamina potions", category: "Processing", skills: [{ name: "Herblore", level: 77 }], baseGpPerHr: 400_000, description: "Combine super energy potions with amylase crystals", members: true },
  { name: "Making divine super combat potions", category: "Processing", skills: [{ name: "Herblore", level: 97 }], baseGpPerHr: 600_000, description: "Combine super combats with crystal dust", members: true },
  { name: "Spinning flax", category: "Processing", skills: [{ name: "Crafting", level: 10 }], baseGpPerHr: 150_000, description: "Spin flax into bow strings on a spinning wheel", members: true },
  { name: "Cutting gems (Dragonstone)", category: "Processing", skills: [{ name: "Crafting", level: 55 }], baseGpPerHr: 300_000, description: "Cut uncut dragonstones into dragonstones", members: true },

  // === Collecting ===
  { name: "Collecting mort myre fungus", category: "Collecting", skills: [{ name: "Prayer", level: 50 }], baseGpPerHr: 500_000, description: "Cast Bloom in Mort Myre Swamp with silver sickle", members: true },
  { name: "Collecting snape grass", category: "Collecting", skills: [], baseGpPerHr: 300_000, description: "Pick snape grass on Waterbirth Island", members: true },
  { name: "Collecting red spiders' eggs", category: "Collecting", skills: [], baseGpPerHr: 250_000, description: "Collect in Edgeville Dungeon with looting bag", members: false },
  { name: "Picking white berries", category: "Collecting", skills: [], baseGpPerHr: 200_000, description: "Pick white berries south of Lletya or in the Wilderness", members: true },
  { name: "Killing cows for hides", category: "Collecting", skills: [], baseGpPerHr: 100_000, description: "Kill cows and collect cowhides to tan and sell", members: false },
  { name: "Collecting blue dragon scales", category: "Collecting", skills: [{ name: "Agility", level: 70 }], baseGpPerHr: 400_000, description: "Collect blue dragon scales in Taverley Dungeon", members: true },
  { name: "Collecting limpwurt roots", category: "Collecting", skills: [], baseGpPerHr: 200_000, description: "Kill Hill Giants or Hobgoblins for limpwurt root drops", members: false },
  { name: "Looting Wilderness", category: "Collecting", skills: [], baseGpPerHr: 300_000, description: "Loot items at popular Wilderness PvP hotspots", members: true },
  { name: "Collecting steel platebodies", category: "Collecting", skills: [], baseGpPerHr: 150_000, description: "Collect steel platebody spawns in the Wilderness", members: false },
  { name: "Collecting zammy wines", category: "Collecting", skills: [{ name: "Magic", level: 33 }], baseGpPerHr: 400_000, description: "Telegrab wines of zamorak from the temple", members: false },

  // === New additions ===
  { name: "Tombs of Amascut (Expert)", category: "Combat", skills: [{ name: "Attack", level: 90 }, { name: "Strength", level: 90 }, { name: "Ranged", level: 90 }, { name: "Magic", level: 90 }], baseGpPerHr: 7_000_000, description: "Complete expert ToA (300+ invocations) for Tumeken's shadow and fang", members: true, intensity: "high" },
  { name: "Tombs of Amascut (Normal)", category: "Combat", skills: [{ name: "Attack", level: 80 }, { name: "Ranged", level: 80 }, { name: "Magic", level: 80 }], baseGpPerHr: 3_500_000, description: "Complete ToA at 150-250 invocations for consistent GP", members: true, intensity: "medium" },
  { name: "Leviathan", category: "Combat", skills: [{ name: "Ranged", level: 85 }, { name: "Prayer", level: 77 }], baseGpPerHr: 2_200_000, description: "Kill The Leviathan for Venator ring and chromium ingots", members: true, intensity: "medium" },
  { name: "Sarachnis", category: "Combat", skills: [{ name: "Attack", level: 70 }], baseGpPerHr: 700_000, description: "Kill Sarachnis for cudgel and Giant egg sac — good mid-level boss", members: true, intensity: "low" },
  { name: "Giant Mole", category: "Combat", skills: [{ name: "Attack", level: 60 }], baseGpPerHr: 500_000, description: "Kill Giant Mole with Dharok's for mole claws/skins (buy Falador shield)", members: true, intensity: "low" },
  { name: "Blast Furnace (Runite bars)", category: "Processing", skills: [{ name: "Smithing", level: 85 }], baseGpPerHr: 1_200_000, description: "Smelt runite bars at the Blast Furnace for high profit", members: true, intensity: "medium" },
  { name: "Making battlestaves", category: "Processing", skills: [{ name: "Crafting", level: 54 }], baseGpPerHr: 500_000, description: "Buy battlestaves from Zaff daily and craft air battlestaves", members: true, intensity: "low" },
  { name: "Hunting black chinchompas", category: "Skilling", skills: [{ name: "Hunter", level: 73 }], baseGpPerHr: 1_500_000, description: "Catch black chinchompas in the Wilderness (watch for PKers)", members: true, intensity: "high" },
  { name: "Blood runecrafting", category: "Skilling", skills: [{ name: "Runecraft", level: 77 }], baseGpPerHr: 800_000, description: "Craft blood runes at the true blood altar for consistent passive income", members: true, intensity: "afk" },
  { name: "Mining Shooting Stars", category: "Skilling", skills: [{ name: "Mining", level: 10 }], baseGpPerHr: 200_000, description: "Mine shooting stars for stardust and gem bags (AFK)", members: true, intensity: "afk" },
];
