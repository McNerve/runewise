export interface BossMetadata {
  difficulty: 1 | 2 | 3 | 4 | 5;
  teamSize: "solo" | "duo" | "small" | "mass";
  mechanicsSummary: string;
  recommendedCombatLevel?: number;
  slayerReq?: number;
  questReqs?: string[];
}

export const BOSS_METADATA: Record<string, BossMetadata> = {
  // God Wars
  "General Graardor": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Melee-based boss with high max hit. Prayer flick between Protect from Melee and Ranged for minions. Stack corner to avoid melee hits." },
  "Kree'arra": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Ranged-based boss. Protect from Ranged. Use chinchompas or crossbow. Minions attack with all three styles." },
  "Commander Zilyana": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Fast-moving melee boss. Protect from Magic for Starlight minion. Kite using pillars and precise movement." },
  "K'ril Tsutsaroth": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Magic-based boss with poison special. Protect from Magic. Can hit through prayer. Use high melee DPS." },
  "Nex": { difficulty: 5, teamSize: "mass", mechanicsSummary: "Five-phase boss with unique mechanics each phase. Requires team coordination, blood barrage healing, and precise positioning. Ancient crossbow spec useful.", recommendedCombatLevel: 110 },

  // DT2
  "Duke Sucellus": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Awakens after first attack. Dodge falling mushrooms, avoid gas clouds. Vulnerable to crush and ranged. Prayer switching required.", questReqs: ["Desert Treasure II"] },
  "The Leviathan": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Three attack styles with a boulder phase. Dodge boulders while DPSing. Use ranged or melee. Shadow damage increases over time.", questReqs: ["Desert Treasure II"] },
  "Vardorvis": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Fast melee boss with healing axes. Kill axes quickly to prevent healing. Uses melee and ranged attacks. Good for learners.", questReqs: ["Desert Treasure II"] },
  "The Whisperer": { difficulty: 5, teamSize: "solo", mechanicsSummary: "Magic boss in the Shadow Realm. Phase between light and dark worlds. Avoid tentacles and orbs. Highest DPS check of DT2 bosses.", questReqs: ["Desert Treasure II"] },

  // Slayer
  "Alchemical Hydra": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Four-phase boss cycling through poison, lightning, flame, and enraged. Switch prayers each phase. Step on vents to weaken.", slayerReq: 95 },
  "Cerberus": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Three-headed hellhound. Prayer switch between three styles for ghost phase. Use melee. Relatively straightforward with prayer switching.", slayerReq: 91 },
  "Grotesque Guardians": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Two-phase fight on rooftop. Dusk and Dawn alternate. Dodge lightning, avoid energy spheres. Use melee.", slayerReq: 75 },
  "Kraken": { difficulty: 1, teamSize: "solo", mechanicsSummary: "AFK magic boss in Kraken Cove. Attack tentacles then boss. Protect from Magic. Very low effort.", slayerReq: 87 },
  "Thermonuclear Smoke Devil": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Smoke devil boss. Protect from Magic. Simple DPS check with no special mechanics.", slayerReq: 93 },
  "Abyssal Sire": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Multi-phase demon boss. Stun respiratory systems, then DPS. Spawns scions that must be managed. Drops Abyssal dagger and bludgeon pieces.", slayerReq: 85 },
  "Skotizo": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Demonic boss under the Catacombs. Destroy dark altars to remove his shield. Use Arclight for massive damage bonus." },

  // Wilderness
  "Vet'ion": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Undead boss in two forms. Dodge lightning attacks. Spawns hellhound minions. Salve amulet effective. Watch for PKers." },
  "Venenatis": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Spider boss with web attack. Protect from Magic. Can safespot. Spawns spiderlings. Watch for PKers." },
  "Callisto": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Bear boss with knockback attack. Protect from Melee. Can safespot with precise positioning. Watch for PKers." },
  "Chaos Elemental": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Random attack styles. Can unequip your gear or teleport you. Bring minimal risk. Watch for PKers." },
  "Scorpia": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Scorpion boss in wilderness. Spawns guardians that heal. Freeze with magic and range. Watch for PKers." },
  "Chaos Fanatic": { difficulty: 1, teamSize: "solo", mechanicsSummary: "Low-level wilderness boss. Protect from Magic. Simple DPS with ranged. Watch for PKers." },
  "Crazy Archaeologist": { difficulty: 1, teamSize: "solo", mechanicsSummary: "Low-level wilderness boss. Dodge book explosions. Use ranged. Watch for PKers." },
  "Deranged Archaeologist": { difficulty: 1, teamSize: "solo", mechanicsSummary: "Fossil Island boss. Similar to Crazy Archaeologist but in a safe area. Use ranged." },
  "Artio": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Weaker Callisto variant in singles combat zone. Same mechanics, less dangerous area." },
  "Calvar'ion": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Weaker Vet'ion variant in singles combat zone. Same mechanics, less dangerous area." },
  "Spindel": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Weaker Venenatis variant in singles combat zone. Same mechanics, less dangerous area." },

  // Solo
  "Vorkath": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Dragon boss with acid and zombie spawn phases. Prayer switch between ranged and magic. Use DHCB/DHL for bonus damage. Consistent GP/hr.", questReqs: ["Dragon Slayer II"], recommendedCombatLevel: 90 },
  "Zulrah": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Three-form serpent with four rotation patterns. Memorize rotations for prayer and gear switches. Uses ranged, magic, and melee.", questReqs: ["Regicide"], recommendedCombatLevel: 85 },
  "Corporeal Beast": { difficulty: 3, teamSize: "small", mechanicsSummary: "High-HP boss weak to spears. BGS/DWH spec to lower defence. Core mechanic reduces damage from non-spear weapons by 50%." },
  "Sarachnis": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Spider boss under Forthos Dungeon. Prayer switch between melee and ranged. Spawns minions. Good mid-level boss." },
  "King Black Dragon": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Three-headed dragon in wilderness. Anti-dragon shield required. Uses dragonfire, poison, and ice attacks.", recommendedCombatLevel: 80 },
  "Kalphite Queen": { difficulty: 3, teamSize: "duo", mechanicsSummary: "Two-phase boss. First form: melee only, protect from ranged. Second form: ranged/magic only, protect from magic." },
  "Giant Mole": { difficulty: 1, teamSize: "solo", mechanicsSummary: "Burrows underground when low HP. Bring Falador shield for locating. Simple boss, good for beginners.", recommendedCombatLevel: 70 },
  "Barrows": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Six brothers with unique mechanics. Prayer switch per brother. Tunnel puzzle. Runs take 3-5 minutes each.", recommendedCombatLevel: 70 },
  "The Gauntlet": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Gather resources, craft gear, fight Hunllef. Prayer switch between ranged and magic. Dodge floor tiles. No external gear." },
  "Corrupted Gauntlet": { difficulty: 5, teamSize: "solo", mechanicsSummary: "Harder Gauntlet with faster Hunllef, more damage, less prep time. T3 armour and weapons required for consistency. Top-tier PVM challenge." },

  // DKs
  "Dagannoth Rex": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Melee dagannoth king, weak to magic. Safespottable. Part of trio with Prime and Supreme." },
  "Dagannoth Prime": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Magic dagannoth king, weak to ranged. Part of trio with Rex and Supreme." },
  "Dagannoth Supreme": { difficulty: 2, teamSize: "solo", mechanicsSummary: "Ranged dagannoth king, weak to melee. Part of trio with Rex and Prime." },

  // Minigame
  "TzTok-Jad": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Final boss of Fight Caves (wave 63). Prayer flick between ranged and magic based on animation. One-shot potential.", recommendedCombatLevel: 80 },
  "TzKal-Zuk": { difficulty: 5, teamSize: "solo", mechanicsSummary: "Final boss of The Inferno (wave 69). Shield management, prayer flicking, and dealing with Jad + healers simultaneously. Hardest PVM challenge.", recommendedCombatLevel: 110 },
  "Sol Heredit": { difficulty: 5, teamSize: "solo", mechanicsSummary: "Final boss of Fortis Colosseum. 12 waves of escalating difficulty. Uses all combat styles with unique mechanics per wave." },
  "The Fortis Colosseum": { difficulty: 5, teamSize: "solo", mechanicsSummary: "12-wave gauntlet in Varlamore. Escalating difficulty with modifiers. Choose glory multipliers for better loot but harder fights." },

  // Skilling
  "Wintertodt": { difficulty: 1, teamSize: "mass", mechanicsSummary: "Skilling boss using Firemaking. Fletch kindling, feed braziers, heal pyromancers. Damage scales with HP level. Low HP alts take less damage." },
  "Tempoross": { difficulty: 1, teamSize: "mass", mechanicsSummary: "Fishing skilling boss. Fish harpoonfish, cook them, fire cannons. Dodge waves and energy attacks. Similar to Wintertodt for fishing." },
  "Zalcano": { difficulty: 2, teamSize: "small", mechanicsSummary: "Mining/Smithing/Runecraft skilling boss. Mine tephra, refine at furnace, imbue at altar, throw at Zalcano. Group boss in Prifddinas.", questReqs: ["Song of the Elves"] },

  // Varlamore
  "Araxxor": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Spider boss with acid mechanics. Multiple paths with different mechanics. Enrage system increases difficulty. Drops Noxious halberd.", recommendedCombatLevel: 100 },
  "Amoxliatl": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Varlamore boss with poison mechanics. Dodge poison pools and projectiles. Use melee or ranged." },
  "Hueycoatl": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Serpent boss in Varlamore. Multiple attack phases with elemental mechanics. Requires prayer switching and positioning." },

  // Other
  "The Nightmare": { difficulty: 4, teamSize: "small", mechanicsSummary: "Multi-phase boss with sleepwalker mechanics. Kill sleepwalkers, avoid grasping claws, prayer switch during totems. Group boss.", recommendedCombatLevel: 100 },
  "Phosani's Nightmare": { difficulty: 5, teamSize: "solo", mechanicsSummary: "Solo version of The Nightmare with faster attacks and harder mechanics. No team to share damage. High DPS requirement." },
  "Phantom Muspah": { difficulty: 3, teamSize: "solo", mechanicsSummary: "Three-phase boss from DT2 quest. Switches between melee, ranged, and magic phases. Dodge spike attacks. Prayer switching.", questReqs: ["Desert Treasure II"] },
  "Scurrius": { difficulty: 1, teamSize: "solo", mechanicsSummary: "Rat boss under Varrock. Beginner-friendly boss with simple mechanics. Dodge falling debris. Good introduction to bossing.", recommendedCombatLevel: 50 },
  "Moons of Peril": { difficulty: 4, teamSize: "solo", mechanicsSummary: "Dual-boss encounter. Fight two moon guardians with different attack styles. Prayer switching and positioning between both." },

  // Raids
  "Chambers of Xeric": { difficulty: 5, teamSize: "small", mechanicsSummary: "Randomized raid with combat rooms, puzzle rooms, and Great Olm final boss. Points-based reward system. Scales with team size." },
  "Theatre of Blood": { difficulty: 5, teamSize: "small", mechanicsSummary: "Five-boss linear raid. Maiden, Bloat, Nylocas, Sotetseg, Xarpus, Verzik. MVP-based reward system. Hardest group content.", recommendedCombatLevel: 100 },
  "Tombs of Amascut": { difficulty: 4, teamSize: "small", mechanicsSummary: "Invocation-based raid. Choose difficulty modifiers. Four path bosses plus Wardens. Scales from beginner to expert.", recommendedCombatLevel: 90 },
};
