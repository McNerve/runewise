import { fetchJson } from "./client";
import { WIKI_API } from "../wiki/helpers";

const BUCKET_TTL = 24 * 60 * 60 * 1000; // 24 hours
const BUCKET_CACHE_VERSION = "v2"; // bump to invalidate stale cached empty arrays
const MAX_PER_QUERY = 5000;

export interface BucketWhere {
  field: string;
  value: string;
}

function buildBucketQueryString(
  bucket: string,
  fields: string[],
  where?: BucketWhere,
  limit?: number,
  offset?: number
): string {
  const selectList = fields.map((f) => `"${f}"`).join(",");
  let query = `bucket("${bucket}").select(${selectList})`;

  if (where) {
    query += `.where({"${where.field}":"${where.value}"})`;
  }

  query += `.limit(${limit ?? MAX_PER_QUERY})`;

  if (offset) {
    query += `.offset(${offset})`;
  }

  query += ".run()";
  return query;
}

export async function bucketQuery<T extends Record<string, unknown>>(
  bucket: string,
  fields: string[],
  where?: BucketWhere,
  limit?: number
): Promise<T[]> {
  const whereKey = where ? `:${where.field}=${where.value}` : "";
  const cacheKey = `${BUCKET_CACHE_VERSION}:bucket:${bucket}:${fields.join(",")}${whereKey}`;

  return fetchJson<T[]>({
    url: `${WIKI_API}?action=bucket&query=${encodeURIComponent(
      buildBucketQueryString(bucket, fields, where, limit)
    )}&format=json`,
    cacheKey,
    ttlMs: BUCKET_TTL,
    transform: (json) => {
      if (Array.isArray(json)) return json as T[];
      const obj = json as Record<string, unknown>;
      if (obj?.results && Array.isArray(obj.results)) return obj.results as T[];
      // API returns { bucket: [...] } directly (array, not { results: [...] })
      if (obj?.bucket && Array.isArray(obj.bucket)) return obj.bucket as T[];
      if (
        typeof json === "object" &&
        json !== null &&
        "bucket" in json &&
        typeof json.bucket === "object" &&
        json.bucket !== null &&
        "results" in json.bucket &&
        Array.isArray(json.bucket.results)
      ) {
        return json.bucket.results as T[];
      }
      console.warn("[RuneWise] Unexpected bucket response shape:", typeof json, json !== null && typeof json === "object" ? Object.keys(json as Record<string, unknown>).join(",") : "");
      return [];
    },
  });
}

export async function bucketQueryAll<T extends Record<string, unknown>>(
  bucket: string,
  fields: string[],
  where?: BucketWhere
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;

  while (true) {
    const whereKey = where ? `:${where.field}=${where.value}` : "";
    const cacheKey = `bucket:${bucket}:${fields.join(",")}${whereKey}:${offset}`;

    const batch = await fetchJson<T[]>({
      url: `${WIKI_API}?action=bucket&query=${encodeURIComponent(
        buildBucketQueryString(bucket, fields, where, MAX_PER_QUERY, offset)
      )}&format=json`,
      cacheKey,
      ttlMs: BUCKET_TTL,
      transform: (json) => {
        if (Array.isArray(json)) return json as T[];
        const obj = json as Record<string, unknown>;
        if (obj?.results && Array.isArray(obj.results)) return obj.results as T[];
        if (
          typeof json === "object" &&
          json !== null &&
          "bucket" in json &&
          typeof json.bucket === "object" &&
          json.bucket !== null &&
          "results" in json.bucket &&
          Array.isArray(json.bucket.results)
        ) {
          return json.bucket.results as T[];
        }
        console.warn("[RuneWise] Unexpected bucket response shape:", typeof json, json !== null && typeof json === "object" ? Object.keys(json as Record<string, unknown>).join(",") : "");
        return [];
      },
    });

    results.push(...batch);

    if (batch.length < MAX_PER_QUERY) break;
    offset += MAX_PER_QUERY;
  }

  return results;
}
