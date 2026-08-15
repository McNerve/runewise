/**
 * Merge curated FINDER_TARGETS with live wiki monster multi-def stats.
 */
import type { WikiMonster } from "../../lib/api/monsters";
import { resolveWikiMonster } from "../../lib/wikiMonsterMatch";
import { FINDER_TARGETS, type LoadoutTarget } from "./budgetLoadoutFinder";

/** Convert a wiki NPC row into a LoadoutTarget. */
export function wikiMonsterToTarget(m: WikiMonster): LoadoutTarget {
  const label = m.version ? `${m.name} (${m.version})` : m.name;
  const defBonus = Math.max(m.defStab, m.defSlash, m.defCrush, 0);
  return {
    name: label,
    wikiName: m.name,
    version: m.version,
    defLevel: m.defenceLevel || 1,
    defBonus,
    defStab: m.defStab,
    defSlash: m.defSlash,
    defCrush: m.defCrush,
    defRanged: m.defRanged,
    defMagic: m.defMagic,
    hp: m.hitpoints || 100,
    magicLevel: m.magicLevel || undefined,
  };
}

/** Best wiki match for a curated target name (case-insensitive, optional version). */
export function findWikiMonster(
  monsters: WikiMonster[],
  name: string
): WikiMonster | null {
  const exact = resolveWikiMonster(monsters, name);
  if (exact) return exact;

  const q = name.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
  if (!q || monsters.length === 0) return null;

  const starts = monsters.filter(
    (m) =>
      m.name.toLowerCase().startsWith(q) ||
      q.startsWith(m.name.toLowerCase())
  );
  if (starts.length > 0) {
    return resolveWikiMonster(starts, starts[0]!.name);
  }

  const sub = monsters.filter((m) => m.name.toLowerCase().includes(q));
  if (sub.length > 0) {
    return resolveWikiMonster(sub, sub[0]!.name);
  }
  return null;
}

/**
 * Overlay wiki multi-def onto a curated target when the NPC is found.
 * Keeps curated name / preferDefStyle; fills live def/hp/magic.
 */
export function enrichTargetFromWiki(
  base: LoadoutTarget,
  monsters: WikiMonster[] | null | undefined
): LoadoutTarget {
  if (!monsters?.length || base.name === "Custom / Dummy") return base;
  // Strip parenthetical version from curated names for lookup
  const lookupName = base.name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const m = findWikiMonster(monsters, lookupName);
  if (!m) return base;
  return {
    ...base,
    wikiName: m.name,
    version: m.version,
    defLevel: m.defenceLevel || base.defLevel,
    defStab: m.defStab,
    defSlash: m.defSlash,
    defCrush: m.defCrush,
    defRanged: m.defRanged,
    defMagic: m.defMagic,
    defBonus: Math.max(m.defStab, m.defSlash, m.defCrush, base.defBonus),
    hp: m.hitpoints || base.hp,
    magicLevel: m.magicLevel || base.magicLevel,
  };
}

/**
 * Build the target list: curated first (wiki-enriched), then optional
 * search hits for free-text monster lookup.
 */
export function buildFinderTargetList(
  curated: LoadoutTarget[],
  monsters: WikiMonster[] | null | undefined,
  searchQuery?: string
): LoadoutTarget[] {
  const enriched = curated.map((t) => enrichTargetFromWiki(t, monsters));
  const q = searchQuery?.trim();
  if (!q || !monsters?.length) return enriched;

  const ql = q.toLowerCase();
  // Avoid dupes already in curated
  const curatedKeys = new Set(
    enriched.map((t) => t.name.toLowerCase().replace(/\s*\([^)]*\)\s*$/, "").trim())
  );

  const extras: LoadoutTarget[] = [];
  const seen = new Set<string>();
  for (const m of monsters) {
    if (!m.name.toLowerCase().includes(ql)) continue;
    const key = `${m.name}|${m.version ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    if (curatedKeys.has(m.name.toLowerCase()) && !m.version) continue;
    seen.add(key);
    extras.push(wikiMonsterToTarget(m));
    if (extras.length >= 25) break;
  }

  // Put search hits after custom, before end — or after all curated except Custom
  const custom = enriched.filter((t) => t.name === "Custom / Dummy");
  const rest = enriched.filter((t) => t.name !== "Custom / Dummy");
  return [...rest, ...extras, ...custom];
}

/** Resolve the selected target without depending on the search box list. */
export function resolveSelectedTarget(
  targetName: string,
  monsters: WikiMonster[] | null | undefined,
  custom?: { defLevel: number; defBonus: number; hp: number }
): LoadoutTarget {
  if (targetName === "Custom / Dummy") {
    const dummy = FINDER_TARGETS.find((t) => t.name === "Custom / Dummy")!;
    return {
      ...dummy,
      defLevel: custom?.defLevel ?? dummy.defLevel,
      defBonus: custom?.defBonus ?? dummy.defBonus,
      hp: custom?.hp ?? dummy.hp,
    };
  }
  const curated = FINDER_TARGETS.find((t) => t.name === targetName);
  if (curated) return enrichTargetFromWiki(curated, monsters);
  if (monsters?.length) {
    const hit = findWikiMonster(monsters, targetName);
    if (hit) return wikiMonsterToTarget(hit);
  }
  return enrichTargetFromWiki(FINDER_TARGETS[0]!, monsters);
}
