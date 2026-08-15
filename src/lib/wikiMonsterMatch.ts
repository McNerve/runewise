import type { WikiMonster } from "./api/monsters";

/** Wiki `page_name_sub` is sometimes `Vorkath#Post-quest`. Keep the suffix. */
export function normalizeMonsterVersion(
  name: string,
  version: string | null | undefined
): string | null {
  if (!version) return null;
  const trimmed = version.trim();
  const hash = trimmed.indexOf("#");
  if (hash >= 0) {
    const before = trimmed.slice(0, hash);
    const after = trimmed.slice(hash + 1).trim();
    if (after && before.toLowerCase() === name.toLowerCase()) return after;
  }
  return trimmed;
}

export function parseMonsterRef(raw: string): { name: string; version: string | null } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match?.[1] && match[2]) {
    return { name: match[1].trim(), version: match[2].trim() };
  }
  return { name: trimmed, version: null };
}

/** Same-name rows: explicit version, else unversioned, else highest HP. */
export function resolveWikiMonster(
  monsters: WikiMonster[],
  rawName: string,
  version?: string | null
): WikiMonster | null {
  const parsed = parseMonsterRef(rawName);
  const name = parsed.name;
  const wantVersion = normalizeMonsterVersion(name, version ?? parsed.version);
  if (!name || monsters.length === 0) return null;

  const q = name.toLowerCase();
  const exact = monsters.filter((m) => m.name.toLowerCase() === q);
  if (exact.length === 0) return null;

  if (wantVersion) {
    const hit = exact.find(
      (m) => normalizeMonsterVersion(m.name, m.version)?.toLowerCase() === wantVersion.toLowerCase()
    );
    if (hit) return hit;
  }

  return (
    exact.find((m) => !m.version) ??
    [...exact].sort((a, b) => b.hitpoints - a.hitpoints)[0] ??
    null
  );
}
