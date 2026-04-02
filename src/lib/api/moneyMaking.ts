import { bucketQueryAll } from "./bucket";
import { getCached, setCache } from "./cache";

const CACHE_KEY = "wiki-money-making:v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const MMG_FIELDS = [
  "page_name",
  "value",
  "json",
] as const;

interface RawBucketMmg {
  [key: string]: unknown;
  page_name: string;
  value?: string;
  json?: string;
}

interface MmgJson {
  Activity?: string;
  Category?: string;
  Intensity?: string;
  Members?: string;
  "Profit (coins)"?: string;
  "Skill requirements"?: string;
  "Quest requirements"?: string;
  "Other requirements"?: string;
  "Inputs"?: Array<{ name: string; quantity: number; price?: number }>;
  "Outputs"?: Array<{ name: string; quantity: number; price?: number }>;
  "KPH"?: string;
}

export type MmgIntensity = "Low" | "Medium" | "High" | "Unknown";

export interface WikiMoneyMethod {
  name: string;
  activity: string;
  category: string;
  profitPerHour: number;
  intensity: MmgIntensity;
  members: boolean;
  skillRequirements: string;
  questRequirements: string;
}

function parseIntensity(raw: string | undefined): MmgIntensity {
  if (!raw) return "Unknown";
  const lower = raw.toLowerCase();
  if (lower.includes("high")) return "High";
  if (lower.includes("medium")) return "Medium";
  if (lower.includes("low")) return "Low";
  return "Unknown";
}

function toWikiMoneyMethod(raw: RawBucketMmg): WikiMoneyMethod | null {
  let json: MmgJson | null = null;
  if (raw.json) {
    try {
      json = JSON.parse(raw.json) as MmgJson;
    } catch {
      // Malformed
    }
  }

  const profit = parseInt(raw.value ?? json?.["Profit (coins)"] ?? "0", 10);
  if (isNaN(profit) || profit === 0) return null;

  return {
    name: raw.page_name,
    activity: json?.Activity ?? raw.page_name,
    category: json?.Category ?? "Other",
    profitPerHour: profit,
    intensity: parseIntensity(json?.Intensity),
    members: json?.Members !== "No",
    skillRequirements: json?.["Skill requirements"] ?? "",
    questRequirements: json?.["Quest requirements"] ?? "",
  };
}

let mmgPromise: Promise<WikiMoneyMethod[]> | null = null;

export async function fetchAllMoneyMethods(): Promise<WikiMoneyMethod[]> {
  const cached = getCached<WikiMoneyMethod[]>(CACHE_KEY, CACHE_TTL, { persist: true });
  if (cached) return cached;

  if (!mmgPromise) {
    mmgPromise = bucketQueryAll<RawBucketMmg>("money_making_guide", [...MMG_FIELDS])
      .then((raw) => {
        const methods = raw
          .map(toWikiMoneyMethod)
          .filter((m): m is WikiMoneyMethod => m !== null)
          .sort((a, b) => b.profitPerHour - a.profitPerHour);
        setCache(CACHE_KEY, methods, { persist: true });
        mmgPromise = null;
        return methods;
      })
      .catch((err: unknown) => {
        mmgPromise = null;
        console.error("[RuneWise] Failed to fetch money making methods:", err);
        throw err;
      });
  }

  return mmgPromise;
}
