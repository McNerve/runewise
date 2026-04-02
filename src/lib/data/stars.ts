export interface StarTier {
  tier: number;
  miningLevel: number;
  xpPerStardust: number;
  stardustPerLayer: number;
  layerDuration: string;
}

export const STAR_TIERS: StarTier[] = [
  { tier: 1, miningLevel: 10, xpPerStardust: 14, stardustPerLayer: 15, layerDuration: "7 min" },
  { tier: 2, miningLevel: 20, xpPerStardust: 16, stardustPerLayer: 40, layerDuration: "7 min" },
  { tier: 3, miningLevel: 30, xpPerStardust: 22, stardustPerLayer: 40, layerDuration: "7 min" },
  { tier: 4, miningLevel: 40, xpPerStardust: 26, stardustPerLayer: 80, layerDuration: "7 min" },
  { tier: 5, miningLevel: 50, xpPerStardust: 32, stardustPerLayer: 80, layerDuration: "7 min" },
  { tier: 6, miningLevel: 60, xpPerStardust: 47, stardustPerLayer: 150, layerDuration: "7 min" },
  { tier: 7, miningLevel: 70, xpPerStardust: 71, stardustPerLayer: 150, layerDuration: "7 min" },
  { tier: 8, miningLevel: 80, xpPerStardust: 114, stardustPerLayer: 250, layerDuration: "7 min" },
  { tier: 9, miningLevel: 90, xpPerStardust: 145, stardustPerLayer: 250, layerDuration: "7 min" },
];

export interface StarSite {
  name: string;
  region: string;
  teleports?: string[];
  mapPreview?: {
    width: number;
    height: number;
    backgroundImage: string;
    backgroundPosition: string;
    backgroundRepeat: string;
  };
}

const STAR_SITE_KEYS: Partial<Record<string, string>> = {
  MINING_GUILD_ENTRANCE: "West Falador mine",
  TAVERLEY__WHITE_WOLF_TUNNEL_ENTRANCE: "Taverley (White Wolf Tunnel entrance)",
  TREE_GNOME_STRONGHOLD_BANK: "Tree Gnome Stronghold bank",
  MOUNT_QUIDAMORTEM__BANK: "Mount Quidamortem (bank)",
  VER_SINHAZA__BANK: "Ver Sinhaza (bank)",
  SOUTH_EAST_ARDOUGNE_MINE__MONASTERY: "South-east Ardougne mine (monastery)",
  CATHERBY_BANK: "Catherby bank",
  CANIFIS__BANK: "Canifis (bank)",
  VARROCK__EAST_BANK: "Varrock (East bank)",
  BURGH_DE_ROTT__BANK: "Burgh de Rott (bank)",
  SOUTH_WILDERNESS_MINE__MAGE_OF_ZAMORAK: "South Wilderness mine (Mage of Zamorak)",
};

export interface RankedTeleport {
  label: string;
  priority: "best" | "good" | "backup";
}

const STAR_MAP_BASE = "https://07.gg/images/shooting-stars/locations";
const STAR_SITE_ALIASES: Array<{ aliases: string[]; canonical: string }> = [
  {
    aliases: ["mage of zamorak mine", "mage of zamorak mine lvl 7 wildy"],
    canonical: "South Wilderness mine (Mage of Zamorak)",
  },
  {
    aliases: ["skeleton mine", "skeleton mine lvl 10 wildy"],
    canonical: "South-west Wilderness mine (South of Dark Warriors' Fortress)",
  },
  {
    aliases: ["east falador bank", "falador bank east"],
    canonical: "West Falador mine",
  },
  {
    aliases: ["brimhaven northwest gold mine", "brimhaven northwest"],
    canonical: "North Brimhaven mine",
  },
  {
    aliases: ["southwest of brimhaven house portal", "southwest of brimhaven"],
    canonical: "South Brimhaven mine",
  },
  {
    aliases: ["varlamore south east mine"],
    canonical: "Stonecutter Outpost (Varlamore South East mine)",
  },
  {
    aliases: ["nature altar mine north of shilo"],
    canonical: "Karamja Jungle mine (Nature Altar)",
  },
  {
    aliases: ["north of al kharid pvp arena"],
    canonical: "Al Kharid mine",
  },
  {
    aliases: ["al kharid bank"],
    canonical: "Al Kharid (bank)",
  },
  {
    aliases: ["sandstorm mine", "sandstorm"],
    canonical: "Desert Quarry",
  },
];

function normalizeStarLocation(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['.,]/g, "")
    .replace(/\(lvl\s*\d+\s*wildy\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function simplifyStarLocation(input: string): string {
  return normalizeStarLocation(input)
    .replace(/\b(bank|mine|entrance|south|north|east|west|of|the|in)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeStarLocation(input: string): string[] {
  return normalizeStarLocation(input)
    .replace(/\bnorthwest\b/g, "north west")
    .replace(/\bnortheast\b/g, "north east")
    .replace(/\bsouthwest\b/g, "south west")
    .replace(/\bsoutheast\b/g, "south east")
    .replace(/[()/-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (token) =>
        ![
          "mine",
          "bank",
          "area",
          "of",
          "the",
          "in",
          "lvl",
          "wildy",
        ].includes(token)
    );
}

const STAR_LOCATION_MAPS: Array<{ aliases: string[]; slug: string }> = [
  { aliases: ["rimmington", "rimmington mine"], slug: "rimmington-mine" },
  { aliases: ["taverley house portal"], slug: "taverley--white-wolf-tunnel-entrance" },
  { aliases: ["corsair resource area"], slug: "corsair-resource-area" },
  { aliases: ["feldip hills", "aks fairy ring", "rantz cave"], slug: "feldip-hunter-area" },
  { aliases: ["southwest of brimhaven poh"], slug: "south-brimhaven-mine" },
  { aliases: ["southwest of brimhaven house portal"], slug: "south-brimhaven-mine" },
  { aliases: ["port khazard"], slug: "port-khazard-mine" },
  { aliases: ["desert quarry", "sandstorm mine", "sandstorm"], slug: "desert-quarry" },
  { aliases: ["prifddinas zalcano entrance"], slug: "prifddinas-zalcano-entrance" },
  { aliases: ["miscellania", "miscellania mine", "cip fairy ring"], slug: "miscellania-mine" },
  { aliases: ["piscatoris", "akq fairy ring"], slug: "piscatoris--akq-fairy-ring" },
  { aliases: ["hunter guild", "mine north-west of hunter guild"], slug: "mine-north-west-of-hunter-guild" },
  { aliases: ["colosseum entrance bank", "varlamore colosseum entrance bank"], slug: "varlamore-colosseum-entrance-bank" },
  { aliases: ["draynor village"], slug: "draynor-village" },
  { aliases: ["al kharid", "north of al kharid pvp arena"], slug: "al-kharid-mine" },
  { aliases: ["al kharid bank"], slug: "al-kharid-bank" },
  { aliases: ["varrock east mine", "varrock east bank", "southeast varrock mine"], slug: "varrock--east-bank" },
  { aliases: ["ralos rise"], slug: "ralos-rise-mining-site" },
  { aliases: ["mount karuulm", "mount karuulm bank"], slug: "mount-karuulm--bank" },
  { aliases: ["mage arena"], slug: "mage-arena" },
  { aliases: ["hosidius"], slug: "hosidius-mine" },
  { aliases: ["arceuus dense essence mine", "dense essence"], slug: "arceuus-dense-essence-mine" },
  { aliases: ["chambers of xeric bank", "mount quidamortem"], slug: "mount-quidamortem--bank" },
  { aliases: ["lovakite mine", "lovakengj", "lovakite"], slug: "lovakite-mine" },
  { aliases: ["shayzien mine", "shayzien mine south of kourend castle"], slug: "shayzien-mine" },
  { aliases: ["burgh de rott", "burgh de rott bank"], slug: "burgh-de-rott--bank" },
  { aliases: ["shilo village", "shilo village gem mine", "gem rocks"], slug: "shilo-village-mine" },
  { aliases: ["grand tree", "west of grand tree", "gnome stronghold spirit tree"], slug: "grand-tree" },
  { aliases: ["lunar isle"], slug: "lunar-isle-mine-entrance" },
  { aliases: ["coal trucks"], slug: "coal-trucks" },
  { aliases: ["dwarven mine", "dwarven mine next to edgeville"], slug: "dwarven-mine-northern-entrance" },
  { aliases: ["catherby", "catherby bank"], slug: "catherby-bank" },
  { aliases: ["civitas illa fortis"], slug: "civitas-illa-fortis--east-bank" },
  { aliases: ["crafting guild"], slug: "crafting-guild-mine" },
  { aliases: ["falador mine"], slug: "falador-mine" },
  { aliases: ["west falador mine", "east falador bank", "falador bank east"], slug: "west-falador-mine" },
  { aliases: ["yanille bank"], slug: "yanille-bank" },
  { aliases: ["yanille", "yanille mine"], slug: "yanille-mine" },
  { aliases: ["ardougne monastery", "ardougne monastery mine"], slug: "south-east-ardougne-mine--monastery" },
  { aliases: ["east lumbridge swamp mine"], slug: "east-lumbridge-swamp-mine" },
  { aliases: ["west lumbridge swamp mine"], slug: "west-lumbridge-swamp-mine" },
  { aliases: ["lumbridge swamp"], slug: "east-lumbridge-swamp-mine" },
  { aliases: ["rellekka"], slug: "rellekka-mine" },
  { aliases: ["canifis bank"], slug: "canifis--bank" },
  { aliases: ["canifis", "canifis mine"], slug: "canifis-mine" },
  { aliases: ["haunted mine"], slug: "haunted-mine" },
  { aliases: ["arandar"], slug: "arandar-mine" },
  { aliases: ["lletya"], slug: "lletya-mine" },
  { aliases: ["prifddinas mine"], slug: "prifddinas-mine" },
  { aliases: ["wilderness hobgoblin"], slug: "wilderness-hobgoblin-mine" },
  { aliases: ["mage of zamorak mine", "mage of zamorak mine lvl 7 wildy"], slug: "mage-arena" },
  { aliases: ["skeleton mine", "skeleton mine lvl 10 wildy"], slug: "south-west-wilderness-mine" },
  { aliases: ["wilderness runite", "lava maze runite mine"], slug: "wilderness-runite-mine" },
  { aliases: ["wilderness resource area"], slug: "resource-area" },
  { aliases: ["nardah"], slug: "nardah-mine" },
  { aliases: ["uzer"], slug: "uzer-mine" },
  { aliases: ["mudskipper"], slug: "mudskipper-point" },
  { aliases: ["brimhaven mine", "brimhaven mine gold", "brimhaven northwest gold mine", "brimhaven northwest"], slug: "brimhaven-mine-gold" },
  { aliases: ["nature altar", "nature altar mine north of shilo"], slug: "nature-altar-mine" },
  { aliases: ["crandor"], slug: "crandor-mine" },
  { aliases: ["jatizso"], slug: "jatizso-mine" },
  { aliases: ["salvager overlook in varlamore", "salvager overlook"], slug: "salvager-overlook-mine" },
  { aliases: ["varlamore south east mine"], slug: "varlamore-south-east-mine" },
];

function inferStarLocationSlug(locationName: string): string {
  return locationName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['.,]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s*\(([^)]+)\)\s*/g, (_, inner: string) => `--${inner}-`)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{3,}/g, "--")
    .replace(/^-+|-+$/g, "");
}

const WIKI_MAP_TILES: Record<string, string> = {
  "dwarven mine": "0_46_54",
  "ice": "0_46_54",
  "dwarf mine": "0_46_54",
  "mining guild": "0_46_52",
  "west falador": "0_45_52",
  "falador mine": "0_45_52",
  "taverley": "0_44_54",
  "crafting guild": "0_45_51",
  "rimmington": "0_46_51",
  "crandor": "0_43_51",
  "north brimhaven": "0_42_50",
  "south brimhaven": "0_42_49",
  "nature altar": "0_44_47",
  "karamja jungle": "0_44_47",
  "shilo village": "0_43_47",
  "feldip": "0_39_46",
  "rantz": "0_40_47",
  "corsair cove": "0_39_45",
  "corsair resource": "0_38_45",
  "myths guild": "0_38_44",
  "isle of souls": "0_33_44",
  "fossil island": "0_58_60",
  "volcanic mine": "0_59_59",
  "mos le'harmless": "0_57_46",
  "rellekka": "0_41_58",
  "keldagrim": "0_42_57",
  "miscellania": "0_39_61",
  "jatizso": "0_37_60",
  "fremennik isles": "0_36_60",
  "lunar isle": "0_33_61",
  "hosidius": "0_27_54",
  "shayzien": "0_24_57",
  "port piscarilius": "0_27_58",
  "dense essence": "0_27_60",
  "arceuus": "0_27_60",
  "lovakite": "0_22_60",
  "lovakengj": "0_23_58",
  "catherby": "0_43_54",
  "yanille": "0_40_48",
  "port khazard": "0_40_49",
  "legends guild": "0_41_52",
  "coal trucks": "0_40_54",
  "ardougne monastery": "0_40_50",
  "kebos": "0_18_57",
  "mount karuulm": "0_19_60",
  "quidamortem": "0_19_56",
  "al kharid mine": "0_51_51",
  "al kharid bank": "0_50_49",
  "al kharid": "0_51_51",
  "uzer": "0_53_49",
  "desert quarry": "0_49_45",
  "sandstorm": "0_49_45",
  "agility pyramid": "0_51_45",
  "nardah": "0_53_45",
  "emir arena": "0_51_51",
  "lumbridge swamp east": "0_50_49",
  "lumbridge swamp west": "0_48_49",
  "lumbridge swamp": "0_50_49",
  "draynor": "0_47_50",
  "varrock east": "0_50_53",
  "varrock": "0_50_53",
  "canifis": "0_54_54",
  "burgh de rott": "0_54_50",
  "abandoned mine": "0_53_50",
  "haunted mine": "0_53_50",
  "ver sinhaza": "0_56_50",
  "theatre of blood": "0_56_50",
  "daeyalt": "0_56_52",
  "piscatoris": "0_36_57",
  "grand tree": "0_37_54",
  "gnome stronghold": "0_37_54",
  "isafdar": "0_35_49",
  "arandar": "0_35_51",
  "lletya": "0_36_49",
  "prifddinas": "0_33_53",
  "trahaearn": "29_2_0_50_95",
  "mynydd": "0_33_53",
  "civitas": "0_27_48",
  "fortis": "0_27_48",
  "stonecutter": "0_26_46",
  "ralos": "0_22_48",
  "mistrock": "0_21_45",
  "salvager overlook": "0_25_51",
  "custodia": "0_19_53",
  "aldarin": "0_25_51",
  "mage of zamorak": "0_48_56",
  "mage arena": "0_47_62",
  "dark warriors": "0_46_56",
  "hobgoblin": "0_47_59",
  "lava maze": "0_47_61",
  "resource area": "0_49_61",
  "wilderness runite": "0_47_61",
  "pirates hideout": "0_47_61",
  "mudskipper": "0_46_50",
};

const WIKI_MAP_BASE = "https://maps.runescape.wiki/osrs/versions/2026-03-04_a/tiles/rendered/0/2";

function getWikiMapTile(locationName: string): string | null {
  const lower = normalizeStarLocation(locationName);
  for (const [key, tile] of Object.entries(WIKI_MAP_TILES)) {
    if (lower.includes(key)) {
      return `${WIKI_MAP_BASE}/${tile}.png`;
    }
  }
  return null;
}

export function getStarLocationMap(locationName: string, large = false): string | null {
  // Try wiki map tiles first (always available)
  const wikiTile = getWikiMapTile(locationName);
  if (wikiTile) return wikiTile;

  // Fall back to 07.gg images
  const lower = normalizeStarLocation(locationName);
  const match = STAR_LOCATION_MAPS.find((entry) =>
    entry.aliases.some((alias) => lower.includes(alias))
  );
  const slug = match?.slug ?? inferStarLocationSlug(locationName);
  if (!slug) return null;
  return `${STAR_MAP_BASE}/${slug}${large ? "-lg" : ""}.webp`;
}

export function getStarLocationBadge(locationName: string): string {
  const tokens = normalizeStarLocation(locationName)
    .split(" ")
    .filter((part) => part.length > 1);

  const preferred = tokens.filter(
    (part) =>
      ![
        "mine",
        "bank",
        "area",
        "of",
        "the",
        "in",
      ].includes(part)
  );

  const parts = (preferred.length >= 2 ? preferred : tokens).filter(
    (part) => !["mine", "bank", "area", "of", "the", "in"].includes(part)
  );

  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return letters || "S";
}

export function findStarSiteMatch(
  locationName: string,
  sites: StarSite[],
  locationKey?: string | null
): StarSite | null {
  if (locationKey) {
    const explicitName = STAR_SITE_KEYS[locationKey];
    if (explicitName) {
      const explicitSite = sites.find(
        (site) => normalizeStarLocation(site.name) === normalizeStarLocation(explicitName)
      );
      if (explicitSite) return explicitSite;
    }
  }

  const normalized = normalizeStarLocation(locationName);
  const simplified = simplifyStarLocation(locationName);
  const tokens = tokenizeStarLocation(locationName);
  const aliasTarget = STAR_SITE_ALIASES.find((entry) =>
    entry.aliases.some((alias) => normalized.includes(normalizeStarLocation(alias)))
  )?.canonical;

  if (aliasTarget) {
    const aliasNormalized = normalizeStarLocation(aliasTarget);
    const aliasSimplified = simplifyStarLocation(aliasTarget);
    const aliasSite = sites.find(
      (site) => {
        const siteNormalized = normalizeStarLocation(site.name);
        const siteSimplified = simplifyStarLocation(site.name);
        return (
          siteNormalized === aliasNormalized ||
          siteNormalized.includes(aliasNormalized) ||
          aliasNormalized.includes(siteNormalized) ||
          (aliasSimplified &&
            siteSimplified &&
            (siteSimplified === aliasSimplified ||
              siteSimplified.includes(aliasSimplified) ||
              aliasSimplified.includes(siteSimplified)))
        );
      }
    );
    if (aliasSite) return aliasSite;
  }

  for (const site of sites) {
    const siteNormalized = normalizeStarLocation(site.name);
    const siteSimplified = simplifyStarLocation(site.name);

    if (
      normalized === siteNormalized ||
      normalized.includes(siteNormalized) ||
      siteNormalized.includes(normalized) ||
      (simplified && siteSimplified && (simplified === siteSimplified || simplified.includes(siteSimplified) || siteSimplified.includes(simplified)))
    ) {
      return site;
    }
  }

  let bestSite: StarSite | null = null;
  let bestScore = 0;

  for (const site of sites) {
    const siteTokens = tokenizeStarLocation(site.name);
    if (tokens.length === 0 || siteTokens.length === 0) continue;

    const overlap = tokens.filter((token) => siteTokens.includes(token)).length;
    const score = overlap / Math.max(tokens.length, siteTokens.length);

    if (overlap >= 1 && score > bestScore) {
      bestScore = score;
      bestSite = site;
    }
  }

  if (bestSite && bestScore >= 0.34) {
    return bestSite;
  }

  return null;
}

// Teleport lookup by region/location keyword for live star locations
const TELEPORT_HINTS: Array<{ aliases: string[]; teleports: string[] }> = [
  { aliases: ["crafting guild"], teleports: ["Crafting cape teleport", "Falador teleport → run south"] },
  { aliases: ["falador", "east falador bank"], teleports: ["Falador teleport", "Explorer's ring 2+ → Falador farm"] },
  { aliases: ["dwarven mine", "edgeville"], teleports: ["Falador teleport → run east", "Skills necklace → Mining Guild"] },
  { aliases: ["mudskipper"], teleports: ["Fairy ring AIQ", "Port Sarim lodestone"] },
  { aliases: ["rimmington"], teleports: ["House teleport (if POH in Rimmington)", "Amulet of glory → Draynor → run south"] },
  { aliases: ["burthorpe"], teleports: ["Games necklace → Burthorpe"] },
  { aliases: ["brimhaven"], teleports: ["Brimhaven house teleport", "Charter ship to Brimhaven"] },
  { aliases: ["shilo", "gem mine"], teleports: ["Fairy ring CKR → run east", "Karamja gloves 3 → Shilo Village"] },
  { aliases: ["nature altar"], teleports: ["Fairy ring CKR"] },
  { aliases: ["crandor"], teleports: ["Karamja gloves → Crandor mine"] },
  { aliases: ["jatizso"], teleports: ["Enchanted lyre → Jatizso", "Fairy ring DKS → sail"] },
  { aliases: ["lunar"], teleports: ["Lunar Isle teleport", "Seal of passage required"] },
  { aliases: ["miscellania", "cip fairy ring"], teleports: ["Fairy ring CIP", "Ring of wealth → Miscellania"] },
  { aliases: ["rellekka"], teleports: ["Enchanted lyre", "Fairy ring DKS → run south"] },
  { aliases: ["ardougne", "monastery"], teleports: ["Ardougne teleport", "Ardougne cloak → Monastery"] },
  { aliases: ["coal trucks"], teleports: ["Fairy ring AJR → run south", "Kandarin headgear → Coal Trucks"] },
  { aliases: ["legends"], teleports: ["Fairy ring BLR", "Legends' Quest completion"] },
  { aliases: ["yanille"], teleports: ["Yanille house teleport", "Watchtower teleport → run south"] },
  { aliases: ["catherby"], teleports: ["Catherby teleport (Lunar)", "Camelot teleport → run south"] },
  { aliases: ["port khazard"], teleports: ["Fairy ring DJP → run south", "Charter ship"] },
  { aliases: ["lovakengj", "lovakite"], teleports: ["Xeric's talisman → Xeric's Inferno", "Lovakengj house teleport"] },
  { aliases: ["karuulm"], teleports: ["Fairy ring CIR", "Skills necklace → Farming Guild → run north"] },
  { aliases: ["hosidius"], teleports: ["Xeric's talisman → Xeric's Glade", "Tithe Farm minigame teleport"] },
  { aliases: ["kebos"], teleports: ["Fairy ring CIR → run south"] },
  { aliases: ["arceuus", "dense essence"], teleports: ["Xeric's talisman → Xeric's Altar", "Fairy ring CIS"] },
  { aliases: ["shayzien", "kourend castle"], teleports: ["Xeric's talisman → Xeric's Heart", "Shayzien teleport → run south"] },
  { aliases: ["chambers of xeric", "mount quidamortem"], teleports: ["Xeric's talisman → Xeric's Honour", "Mount Quidamortem teleport"] },
  { aliases: ["al kharid", "pvp arena"], teleports: ["Amulet of glory → Al Kharid", "Ring of dueling → PvP Arena"] },
  { aliases: ["lumbridge"], teleports: ["Lumbridge teleport", "Home teleport"] },
  { aliases: ["varrock"], teleports: ["Varrock teleport", "Grand Exchange teleport"] },
  { aliases: ["canifis"], teleports: ["Fairy ring CKS", "Kharyrll teleport (Ancient)"] },
  { aliases: ["haunted mine"], teleports: ["Fairy ring CLF → run south", "Burgh de Rott teleport"] },
  { aliases: ["theatre of blood", "ver sinhaza"], teleports: ["Drakan's medallion → Ver Sinhaza"] },
  { aliases: ["burgh"], teleports: ["Drakan's medallion → Burgh de Rott"] },
  { aliases: ["arandar"], teleports: ["Charter ship to Port Tyras → run north"] },
  { aliases: ["lletya"], teleports: ["Teleport crystal → Lletya"] },
  { aliases: ["prifddinas"], teleports: ["Teleport crystal → Prifddinas", "Prifddinas portal (POH)"] },
  { aliases: ["hobgoblin"], teleports: ["Burning amulet → Lava Maze", "Wilderness Obelisk"] },
  { aliases: ["wilderness runite", "lava maze runite"], teleports: ["Wilderness Obelisk → level 44", "Burning amulet"] },
  { aliases: ["wilderness resource"], teleports: ["Wilderness Obelisk → level 50"] },
  { aliases: ["desert quarry"], teleports: ["Fairy ring AKS → run south", "Camulet → Enakhra's Temple"] },
  { aliases: ["nardah"], teleports: ["Desert amulet 2+ → Nardah", "Fairy ring DLQ → run south"] },
  { aliases: ["uzer"], teleports: ["Fairy ring DLQ", "Necklace of passage → Eagle's Eyrie"] },
  { aliases: ["gnome stronghold", "grand tree"], teleports: ["Spirit tree → Gnome Stronghold", "Royal seed pod"] },
  { aliases: ["piscatoris"], teleports: ["Fairy ring AKQ", "Western banner 3+ → Piscatoris"] },
  { aliases: ["feldip", "rantz"], teleports: ["Fairy ring AKS", "Gnome glider → Feldip Hills"] },
  { aliases: ["varlamore", "aldarin", "salvager overlook"], teleports: ["Quetzal Whistle", "Fairy ring → Varlamore"] },
  { aliases: ["custodia"], teleports: ["Quetzal Whistle → Custodia", "Colosseum teleport"] },
  { aliases: ["colosseum"], teleports: ["Colosseum teleport", "Quetzal Whistle"] },
  { aliases: ["hunter guild"], teleports: ["Hunter guild teleport", "Quetzal Whistle"] },
  { aliases: ["myths"], teleports: ["Mythical cape teleport"] },
];

export function getTeleportsForLocation(locationName: string): string[] {
  const lower = normalizeStarLocation(locationName);
  for (const entry of TELEPORT_HINTS) {
    if (entry.aliases.some((alias) => lower.includes(alias))) return entry.teleports;
  }
  return [];
}

export function getTeleportsForLocationFromSites(
  locationName: string,
  sites: StarSite[],
  locationKey?: string | null
): string[] {
  const matched = findStarSiteMatch(locationName, sites, locationKey);
  if (matched?.teleports?.length) return matched.teleports;
  return getTeleportsForLocation(locationName);
}

function scoreTeleport(label: string): number {
  const lower = label.toLowerCase();
  if (
    lower.includes("whistle") ||
    lower.includes("teleport") ||
    lower.includes("talisman") ||
    lower.includes("seed pod") ||
    lower.includes("cape")
  ) {
    return 3;
  }
  if (
    lower.includes("fairy ring") ||
    lower.includes("glory") ||
    lower.includes("lyre") ||
    lower.includes("medallion") ||
    lower.includes("amulet") ||
    lower.includes("necklace") ||
    lower.includes("crystal")
  ) {
    return 2;
  }
  return 1;
}

export function getRankedTeleportsForLocation(locationName: string): RankedTeleport[] {
  const teleports = getTeleportsForLocation(locationName);

  return teleports
    .map((label) => ({ label, score: scoreTeleport(label) }))
    .sort((a, b) => b.score - a.score)
    .map((teleport, index) => ({
      label: teleport.label,
      priority: index === 0 ? "best" : index === 1 ? "good" : "backup",
    }));
}

export function getRankedTeleportsForLocationFromSites(
  locationName: string,
  sites: StarSite[],
  locationKey?: string | null
): RankedTeleport[] {
  const teleports = getTeleportsForLocationFromSites(locationName, sites, locationKey);

  return teleports
    .map((label) => ({ label, score: scoreTeleport(label) }))
    .sort((a, b) => b.score - a.score)
    .map((teleport, index) => ({
      label: teleport.label,
      priority: index === 0 ? "best" : index === 1 ? "good" : "backup",
    }));
}

export const STAR_SITES: StarSite[] = [
  // Asgarnia
  { name: "Crafting Guild mine", region: "Asgarnia" },
  { name: "Falador mine", region: "Asgarnia" },
  { name: "Dwarven mine next to Edgeville", region: "Asgarnia" },
  { name: "Mudskipper Point", region: "Asgarnia" },
  { name: "Rimmington mine", region: "Asgarnia" },
  { name: "South Burthorpe mine", region: "Asgarnia" },
  // Crandor / Karamja
  { name: "Brimhaven mine (gold)", region: "Karamja" },
  { name: "Shilo Village gem mine", region: "Karamja" },
  { name: "Nature altar mine", region: "Karamja" },
  { name: "Crandor mine", region: "Karamja" },
  // Fremennik
  { name: "Jatizso mine", region: "Fremennik" },
  { name: "Lunar Isle mine", region: "Fremennik" },
  { name: "Miscellania mine (cip fairy ring)", region: "Fremennik" },
  { name: "Rellekka mine", region: "Fremennik" },
  // Kandarin
  { name: "Ardougne Monastery", region: "Kandarin" },
  { name: "Coal trucks", region: "Kandarin" },
  { name: "South of Legends' Guild", region: "Kandarin" },
  { name: "Yanille bank", region: "Kandarin" },
  // Kourend & Kebos
  { name: "Lovakite mine", region: "Kourend" },
  { name: "Mount Karuulm bank", region: "Kourend" },
  { name: "Arceuus dense essence mine", region: "Kourend" },
  { name: "Shayzien mine south of Kourend Castle", region: "Kourend" },
  { name: "Chambers of Xeric bank", region: "Kourend" },
  // Misthalin
  { name: "Al Kharid bank", region: "Misthalin" },
  { name: "Draynor Village", region: "Misthalin" },
  { name: "East Lumbridge Swamp mine", region: "Misthalin" },
  { name: "West Lumbridge Swamp mine", region: "Misthalin" },
  { name: "Varrock east bank", region: "Misthalin" },
  { name: "Varrock west mine", region: "Misthalin" },
  // Morytania
  { name: "Canifis bank", region: "Morytania" },
  { name: "Haunted Mine", region: "Morytania" },
  // Tirannwn
  { name: "Arandar mine", region: "Tirannwn" },
  { name: "Lletya mine", region: "Tirannwn" },
  { name: "Prifddinas mine", region: "Tirannwn" },
  // Wilderness
  { name: "Wilderness Hobgoblin mine", region: "Wilderness" },
  { name: "Wilderness Runite mine", region: "Wilderness" },
  { name: "Wilderness Resource Area", region: "Wilderness" },
  // Desert
  { name: "Desert Quarry", region: "Desert" },
  { name: "Nardah mine", region: "Desert" },
  { name: "Uzer mine", region: "Desert" },
  // Varlamore
  { name: "Aldarin mine in Varlamore", region: "Varlamore" },
  { name: "Salvager Overlook in Varlamore", region: "Varlamore" },
  { name: "Custodia Mountains mine", region: "Varlamore" },
  { name: "Varlamore colosseum entrance bank", region: "Varlamore" },
  { name: "Mine north-west of hunter guild", region: "Varlamore" },
];

export interface StardustReward {
  name: string;
  cost: number;
  quantity: number;
  itemId?: number;
}

export const STARDUST_REWARDS: StardustReward[] = [
  { name: "Celestial ring (uncharged)", cost: 2000, quantity: 1, itemId: 25539 },
  { name: "Star fragment", cost: 3000, quantity: 1, itemId: 25547 },
  { name: "Soft clay pack", cost: 150, quantity: 100, itemId: 11741 },
  { name: "Uncut sapphire", cost: 50, quantity: 1, itemId: 1623 },
  { name: "Uncut emerald", cost: 75, quantity: 1, itemId: 1621 },
  { name: "Uncut ruby", cost: 100, quantity: 1, itemId: 1619 },
  { name: "Uncut diamond", cost: 200, quantity: 1, itemId: 1617 },
  { name: "Uncut dragonstone", cost: 300, quantity: 1, itemId: 1631 },
  { name: "Pure essence", cost: 50, quantity: 150, itemId: 7936 },
  { name: "Gold ore", cost: 50, quantity: 20, itemId: 444 },
  { name: "Coal", cost: 50, quantity: 20, itemId: 453 },
  { name: "Adamantite ore", cost: 75, quantity: 10, itemId: 449 },
  { name: "Runite ore", cost: 200, quantity: 3, itemId: 451 },
  { name: "Mithril seeds", cost: 100, quantity: 1, itemId: 299 },
  { name: "Bag full of gems", cost: 300, quantity: 1, itemId: 12020 },
];
