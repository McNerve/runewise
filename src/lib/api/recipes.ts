import { bucketQueryAll, type BucketWhere } from "./bucket";
import { getCached, setCache } from "./cache";

const CACHE_KEY = "wiki-recipes:v2";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const RECIPE_FIELDS = [
  "page_name",
  "uses_material",
  "uses_tool",
  "uses_facility",
  "is_members_only",
  "is_boostable",
  "uses_skill",
  "source_template",
  "production_json",
] as const;

interface RawBucketRecipe {
  [key: string]: unknown;
  page_name: string;
  uses_material?: string;
  uses_tool?: string;
  uses_facility?: string;
  is_members_only?: string;
  is_boostable?: string;
  uses_skill?: string;
  source_template?: string;
  production_json?: string;
}

interface ProductionJson {
  materials?: Array<{ name: string; quantity: number }>;
  skills?: Array<{ name: string; level: number; experience: number; boostable?: boolean }>;
  output?: Array<{ name: string; quantity: number; cost?: number }>;
  ticks?: number;
  members?: boolean;
  facility?: string;
}

export interface WikiRecipe {
  name: string;
  skill: string;
  levelReq: number;
  xp: number;
  materials: Array<{ name: string; quantity: number }>;
  output: Array<{ name: string; quantity: number }>;
  facility: string | null;
  ticks: number | null;
  members: boolean;
  boostable: boolean;
}

function toWikiRecipe(raw: RawBucketRecipe): WikiRecipe | null {
  let json: ProductionJson | null = null;
  if (raw.production_json) {
    try {
      json = JSON.parse(raw.production_json) as ProductionJson;
    } catch {
      // Malformed
    }
  }

  const skill = json?.skills?.[0]?.name || raw.uses_skill || "";
  const levelReq = json?.skills?.[0]?.level ?? 0;
  const xp = json?.skills?.[0]?.experience ?? 0;

  if (!skill || levelReq === 0) return null;

  return {
    name: raw.page_name,
    skill,
    levelReq,
    xp,
    materials: json?.materials ?? [],
    output: json?.output ?? [{ name: raw.page_name, quantity: 1 }],
    facility: json?.facility || raw.uses_facility || null,
    ticks: json?.ticks ?? null,
    members: raw.is_members_only === "Yes" || json?.members === true,
    boostable: raw.is_boostable === "Yes" || json?.skills?.[0]?.boostable === true,
  };
}

let recipesPromise: Promise<WikiRecipe[]> | null = null;

export async function fetchAllRecipes(): Promise<WikiRecipe[]> {
  const cached = getCached<WikiRecipe[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!recipesPromise) {
    recipesPromise = bucketQueryAll<RawBucketRecipe>("recipe", [...RECIPE_FIELDS])
      .then((raw) => {
        const recipes = raw
          .map(toWikiRecipe)
          .filter((r): r is WikiRecipe => r !== null);
        if (recipes.length > 0) setCache(CACHE_KEY, recipes, { persist: true });
        recipesPromise = null;
        return recipes;
      })
      .catch((err: unknown) => {
        recipesPromise = null;
        console.error("[RuneWise] Failed to fetch recipes:", err);
        throw err;
      });
  }

  return recipesPromise;
}

export function getRecipesForSkill(
  recipes: WikiRecipe[],
  skill: string
): WikiRecipe[] {
  return recipes
    .filter((r) => r.skill.toLowerCase() === skill.toLowerCase())
    .sort((a, b) => a.levelReq - b.levelReq);
}

export async function fetchRecipesForSkill(
  skill: string
): Promise<WikiRecipe[]> {
  const skillKey = `wiki-recipes-skill:${skill.toLowerCase()}`;
  const cached = getCached<WikiRecipe[]>(skillKey, CACHE_TTL, { persist: true });
  if (cached) return cached;

  const raw = await bucketQueryAll<RawBucketRecipe>(
    "recipe",
    [...RECIPE_FIELDS],
    { field: "uses_skill", value: skill } as BucketWhere
  );

  const recipes = raw
    .map(toWikiRecipe)
    .filter((r): r is WikiRecipe => r !== null)
    .sort((a, b) => a.levelReq - b.levelReq);

  setCache(skillKey, recipes, { persist: true });
  return recipes;
}
