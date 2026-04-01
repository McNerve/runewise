export interface BossInfo {
  name: string;
  wikiPage: string;
  category: string;
  combatLevel?: number;
  hitpoints?: number;
  maxHit?: number;
  weakness?: string;
}

export const BOSSES: BossInfo[] = [
  // Raids
  { name: "Chambers of Xeric", wikiPage: "Chambers_of_Xeric/Strategies", category: "Raids" },
  { name: "Theatre of Blood", wikiPage: "Theatre_of_Blood/Strategies", category: "Raids" },
  { name: "Tombs of Amascut", wikiPage: "Tombs_of_Amascut/Strategies", category: "Raids" },

  // GWD
  { name: "General Graardor", wikiPage: "General_Graardor/Strategies", category: "GWD", combatLevel: 624, hitpoints: 255 },
  { name: "Kree'arra", wikiPage: "Kree%27arra/Strategies", category: "GWD", combatLevel: 580, hitpoints: 255 },
  { name: "Commander Zilyana", wikiPage: "Commander_Zilyana/Strategies", category: "GWD", combatLevel: 596, hitpoints: 255 },
  { name: "K'ril Tsutsaroth", wikiPage: "K%27ril_Tsutsaroth/Strategies", category: "GWD", combatLevel: 650, hitpoints: 255 },
  { name: "Nex", wikiPage: "Nex/Strategies", category: "GWD", combatLevel: 1001, hitpoints: 3400 },

  // Slayer Bosses
  { name: "Alchemical Hydra", wikiPage: "Alchemical_Hydra/Strategies", category: "Slayer", combatLevel: 426, hitpoints: 1100 },
  { name: "Cerberus", wikiPage: "Cerberus/Strategies", category: "Slayer", combatLevel: 318, hitpoints: 600 },
  { name: "Grotesque Guardians", wikiPage: "Grotesque_Guardians/Strategies", category: "Slayer" },
  { name: "Kraken", wikiPage: "Kraken/Strategies", category: "Slayer", combatLevel: 291, hitpoints: 255 },
  { name: "Thermonuclear Smoke Devil", wikiPage: "Thermonuclear_smoke_devil/Strategies", category: "Slayer", combatLevel: 301, hitpoints: 240 },

  // Wilderness
  { name: "Vet'ion", wikiPage: "Vet%27ion/Strategies", category: "Wilderness", combatLevel: 454, hitpoints: 255 },
  { name: "Venenatis", wikiPage: "Venenatis/Strategies", category: "Wilderness", combatLevel: 464, hitpoints: 255 },
  { name: "Callisto", wikiPage: "Callisto/Strategies", category: "Wilderness", combatLevel: 470, hitpoints: 255 },
  { name: "Chaos Elemental", wikiPage: "Chaos_Elemental/Strategies", category: "Wilderness", combatLevel: 305, hitpoints: 250 },

  // Other
  { name: "Vorkath", wikiPage: "Vorkath/Strategies", category: "Other", combatLevel: 732, hitpoints: 750 },
  { name: "Zulrah", wikiPage: "Zulrah/Strategies", category: "Other", combatLevel: 725, hitpoints: 500 },
  { name: "Corporeal Beast", wikiPage: "Corporeal_Beast/Strategies", category: "Other", combatLevel: 785, hitpoints: 2000 },
  { name: "The Nightmare", wikiPage: "The_Nightmare/Strategies", category: "Other" },
  { name: "Phantom Muspah", wikiPage: "Phantom_Muspah/Strategies", category: "Other" },
  { name: "Duke Sucellus", wikiPage: "Duke_Sucellus/Strategies", category: "Other" },
  { name: "The Leviathan", wikiPage: "The_Leviathan/Strategies", category: "Other" },
  { name: "Vardorvis", wikiPage: "Vardorvis/Strategies", category: "Other" },
  { name: "The Whisperer", wikiPage: "The_Whisperer/Strategies", category: "Other" },
  { name: "Araxxor", wikiPage: "Araxxor/Strategies", category: "Other" },

  // Varlamore
  { name: "Amoxliatl", wikiPage: "Amoxliatl/Strategies", category: "Varlamore" },
  { name: "Hueycoatl", wikiPage: "Hueycoatl/Strategies", category: "Varlamore" },
  { name: "The Fortis Colosseum", wikiPage: "The_Fortis_Colosseum/Strategies", category: "Varlamore" },
];

export const BOSS_CATEGORIES = [...new Set(BOSSES.map((b) => b.category))];
