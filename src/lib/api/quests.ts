import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";

const CACHE_KEY = "wiki-quests:v1";
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
  start_point?: string;
  json?: string;
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
