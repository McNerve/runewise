import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";

const CACHE_KEY = "wiki-quests:v2";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const QUEST_FIELDS = [
  "page_name",
  "description",
  "enemies_to_defeat",
  "ironman_concerns",
  "items_required",
  "official_difficulty",
  "official_length",
  "requirements",
  "reward",
  "start_point",
  "json",
] as const;

interface RawBucketQuest {
  page_name: string;
  description?: string;
  enemies_to_defeat?: string;
  ironman_concerns?: string;
  items_required?: string;
  official_difficulty?: string;
  official_length?: string;
  requirements?: string;
  reward?: string;
  start_point?: string;
  json?: string;
}

export interface QuestReward {
  xp: Array<{ skill: string; amount: number }>;
  items: string[];
  other: string[];
}

export interface WikiQuest {
  name: string;
  description: string;
  difficulty: "Novice" | "Intermediate" | "Experienced" | "Master" | "Grandmaster" | "Special";
  length: string;
  startPoint: string;
  enemiesToDefeat: string;
  ironmanConcerns: string;
  itemsRequired: string;
  skillRequirements: Array<{ skill: string; level: number; boostable?: boolean }>;
  questRequirements: string[];
  members: boolean;
  questPoints: number;
  rewards: QuestReward;
}

const SKILLS = new Set([
  "Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic",
  "Runecraft", "Hitpoints", "Crafting", "Mining", "Smithing",
  "Fishing", "Cooking", "Firemaking", "Woodcutting", "Agility",
  "Herblore", "Thieving", "Fletching", "Slayer", "Farming",
  "Construction", "Hunter", "Sailing",
]);

function parseRewards(raw: string | undefined): QuestReward {
  const result: QuestReward = { xp: [], items: [], other: [] };
  if (!raw) return result;

  // Clean wiki markup
  const clean = raw
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/'''|''|<[^>]*>/g, "");

  const lines = clean.split(/\n|<br\s*\/?>/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // XP pattern: "1,000 Attack experience" or "10000 Cooking XP"
    const xpMatch = line.match(/^([\d,]+)\s+(\w+)\s+(?:experience|xp|exp)/i);
    if (xpMatch) {
      const amount = parseInt(xpMatch[1].replace(/,/g, ""), 10);
      const skill = xpMatch[2].charAt(0).toUpperCase() + xpMatch[2].slice(1).toLowerCase();
      if (SKILLS.has(skill) && amount > 0) {
        result.xp.push({ skill, amount });
        continue;
      }
    }

    // Quest point lines already captured elsewhere, skip
    if (/quest\s*point/i.test(line)) continue;

    // Access/unlock lines
    if (/access|unlock|ability|can now|permission/i.test(line)) {
      result.other.push(line);
      continue;
    }

    // Remaining lines with item-like content
    if (line.length > 2 && line.length < 200) {
      result.items.push(line);
    }
  }

  return result;
}

interface QuestJson {
  difficulty?: string;
  length?: string;
  start?: string;
  enemies?: string;
  ironman?: string;
  items?: string;
  requirements?: string;
  quest_points?: number;
  members?: boolean;
  skills?: Array<{ skill: string; level: number; boostable?: boolean }>;
  quests?: string[];
}

function parseDifficulty(raw: string | undefined): WikiQuest["difficulty"] {
  if (!raw) return "Novice";
  const lower = raw.toLowerCase();
  if (lower.includes("grandmaster")) return "Grandmaster";
  if (lower.includes("master")) return "Master";
  if (lower.includes("experienced")) return "Experienced";
  if (lower.includes("intermediate")) return "Intermediate";
  if (lower.includes("special")) return "Special";
  return "Novice";
}

function parseSkillRequirements(
  raw: string | undefined,
  json: QuestJson | null
): Array<{ skill: string; level: number; boostable?: boolean }> {
  if (json?.skills && json.skills.length > 0) return json.skills;
  if (!raw) return [];

  const reqs: Array<{ skill: string; level: number }> = [];
  const skillPattern = /(\d+)\s+(Attack|Strength|Defence|Ranged|Prayer|Magic|Runecraft|Hitpoints|Crafting|Mining|Smithing|Fishing|Cooking|Firemaking|Woodcutting|Agility|Herblore|Thieving|Fletching|Slayer|Farming|Construction|Hunter|Sailing)/gi;
  let match;
  while ((match = skillPattern.exec(raw)) !== null) {
    reqs.push({ skill: match[2], level: parseInt(match[1], 10) });
  }
  return reqs;
}

function parseQuestRequirements(
  raw: string | undefined,
  json: QuestJson | null
): string[] {
  if (json?.quests && json.quests.length > 0) return json.quests;
  if (!raw) return [];

  return raw
    .split(/[,\n]/)
    .map((s) => s.replace(/\[\[|\]\]/g, "").trim())
    .filter((s) => s.length > 2 && !s.match(/^\d+\s/));
}

function toWikiQuest(raw: RawBucketQuest): WikiQuest {
  let json: QuestJson | null = null;
  if (raw.json) {
    try {
      json = JSON.parse(raw.json) as QuestJson;
    } catch {
      // Malformed JSON
    }
  }

  return {
    name: raw.page_name,
    description: raw.description || json?.description || "",
    difficulty: parseDifficulty(raw.official_difficulty || json?.difficulty),
    length: raw.official_length || json?.length || "Unknown",
    startPoint: raw.start_point || json?.start || "",
    enemiesToDefeat: raw.enemies_to_defeat || json?.enemies || "None",
    ironmanConcerns: raw.ironman_concerns || json?.ironman || "None",
    itemsRequired: raw.items_required || json?.items || "",
    skillRequirements: parseSkillRequirements(raw.requirements, json),
    questRequirements: parseQuestRequirements(raw.requirements, json),
    members: json?.members ?? true,
    questPoints: json?.quest_points ?? 1,
    rewards: parseRewards(raw.reward),
  };
}

let questsPromise: Promise<WikiQuest[]> | null = null;

export async function fetchAllQuests(): Promise<WikiQuest[]> {
  const cached = getCached<WikiQuest[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!questsPromise) {
    questsPromise = bucketQueryAll<RawBucketQuest>("quest", [...QUEST_FIELDS])
      .then((raw) => {
        const quests = raw.map(toWikiQuest);
        setCache(CACHE_KEY, quests, { persist: true });
        questsPromise = null;
        return quests;
      })
      .catch(() => {
        questsPromise = null;
        return [];
      });
  }

  return questsPromise;
}
