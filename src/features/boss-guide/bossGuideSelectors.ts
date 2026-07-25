import type { HiscoreData } from "../../lib/api/hiscores";
import type { ItemPrice } from "../../lib/api/ge";
import type { DropItem } from "../../lib/api/wiki";
import {
  COMBAT_TASKS,
  COMBAT_TIERS,
  type CombatTask,
  type CombatTier,
} from "../../lib/data/combat-achievements";
import {
  BOSS_DROP_TABLES,
  type BossDropTable,
} from "../../lib/data/boss-drops";
import { getRaidLoot, type RaidDropEntry } from "../../lib/data/raid-loot";
import {
  normalizeBossLookup,
  type BossInfo,
} from "../../lib/data/bosses";

/** Map boss names to combat-task boss names (handles wiki mismatches). */
export const TASK_ALIASES: Record<string, string[]> = {
  "Dagannoth Rex": ["Dagannoth Kings"],
  "Dagannoth Prime": ["Dagannoth Kings"],
  "Dagannoth Supreme": ["Dagannoth Kings"],
  "TzKal-Zuk": ["The Inferno"],
  "TzTok-Jad": ["TzHaar Fight Cave"],
  "Barrows Chests": ["Barrows"],
  "The Gauntlet": ["Gauntlet"],
  "The Corrupted Gauntlet": ["Corrupted Gauntlet"],
  Nightmare: ["The Nightmare"],
};

/** Known raid category counts when wiki drops are empty: Uniques + Common = 2. */
export const RAID_DROP_CATEGORY_COUNTS: Record<string, number> = {
  "Tombs of Amascut": 2,
  "Tombs of Amascut: Expert Mode": 2,
  "Theatre of Blood": 2,
  "Theatre of Blood: Hard Mode": 2,
  "Chambers of Xeric": 2,
  "Chambers of Xeric: Challenge Mode": 2,
};

export function getBossKc(
  hiscores: HiscoreData | null | undefined,
  boss: BossInfo | null
): number | null {
  if (!boss || !hiscores?.activities) return null;
  const bossName = boss.name.toLowerCase();
  const altName = boss.hiscoresName?.toLowerCase();

  // Prefer exact name / hiscoresName so shorter base activities
  // (e.g. "Theatre of Blood") never steal Hard/Challenge/Expert variants.
  const exact = hiscores.activities.find((item) => {
    const actName = item.name.toLowerCase();
    return actName === bossName || (altName != null && actName === altName);
  });
  if (exact) return exact.score > 0 ? exact.score : null;

  // Fallback: longest activity name that contains the boss name (or equal
  // length). Never let a shorter activity name steal a longer boss variant
  // (HM/CM/Expert).
  let best: { score: number; len: number } | null = null;
  for (const item of hiscores.activities) {
    const actName = item.name.toLowerCase();
    if (item.score <= 0) continue;
    if (actName.length < bossName.length) continue;
    if (!(actName.includes(bossName) || bossName.includes(actName))) continue;
    if (!best || actName.length > best.len) {
      best = { score: item.score, len: actName.length };
    }
  }
  return best?.score ?? null;
}

export function getBossTasks(boss: BossInfo | null): CombatTask[] {
  if (!boss) return [];
  const selected = normalizeBossLookup(boss.name);
  const aliases = (TASK_ALIASES[boss.name] ?? []).map(normalizeBossLookup);

  return COMBAT_TASKS.filter((task) => {
    const taskBoss = normalizeBossLookup(task.boss);
    return (
      taskBoss === selected ||
      taskBoss.includes(selected) ||
      selected.includes(taskBoss) ||
      aliases.some((alias) => taskBoss === alias || taskBoss.includes(alias))
    );
  });
}

export function groupTasksByTier(
  tasks: CombatTask[]
): Array<{ tier: CombatTier; tasks: CombatTask[] }> {
  return COMBAT_TIERS.map((tier) => ({
    tier,
    tasks: tasks.filter((task) => task.tier === tier),
  })).filter((group) => group.tasks.length > 0);
}

export function getBossLootTable(boss: BossInfo | null): BossDropTable | null {
  if (!boss) return null;
  return (
    BOSS_DROP_TABLES.find(
      (entry) => normalizeBossLookup(entry.bossName) === normalizeBossLookup(boss.name)
    ) ?? null
  );
}

export function getRaidLootFallback(
  boss: BossInfo | null,
  hasOtherLoot: boolean
): ReturnType<typeof getRaidLoot> {
  if (!boss || hasOtherLoot) return null;
  return getRaidLoot(boss.name);
}

export function computeTopDrops(
  dropCategories: { name: string; drops: DropItem[] }[],
  bossLootTable: BossDropTable | null,
  itemMap: Map<string, number>,
  prices: Record<string, ItemPrice>
): Array<{ drop: DropItem; gePrice: number | null }> {
  if (dropCategories.length > 0) {
    return dropCategories
      .flatMap((category) => category.drops)
      .map((drop) => {
        const itemId = itemMap.get(drop.name.toLowerCase());
        const price = itemId ? prices[String(itemId)] : null;
        const gePrice = price?.high ?? price?.low ?? null;
        return { drop, gePrice };
      })
      .sort((a, b) => (b.gePrice ?? 0) - (a.gePrice ?? 0))
      .slice(0, 3);
  }

  if (!bossLootTable) return [];

  return bossLootTable.drops
    .map((drop) => {
      const price = prices[String(drop.itemId)];
      const gePrice = price?.high ?? price?.low ?? null;
      return {
        drop: {
          name: drop.itemName,
          quantity: String(drop.quantity),
          rarity: drop.rate === 1 ? "Always" : `1/${drop.rate.toLocaleString()}`,
          price: gePrice != null ? String(gePrice) : "",
          category: drop.category,
        },
        gePrice,
      };
    })
    .sort((a, b) => (b.gePrice ?? 0) - (a.gePrice ?? 0))
    .slice(0, 3);
}

export interface LootRow {
  itemId: number;
  itemName: string;
  quantity: number;
  rate: number;
  category: string;
  gePrice: number | null;
  evPerKill: number | null;
  evPerHr: number | null;
}

export function computeLootRows(
  bossLootTable: BossDropTable | null,
  prices: Record<string, ItemPrice>,
  lootKillsPerHour: number
): LootRow[] {
  if (!bossLootTable) return [];

  return bossLootTable.drops.map((drop) => {
    const price = prices[String(drop.itemId)];
    const gePrice =
      price?.high != null && price?.low != null
        ? Math.round((price.high + price.low) / 2)
        : (price?.high ?? price?.low ?? null);
    const evPerKill = gePrice != null ? (drop.quantity * gePrice) / drop.rate : null;
    return {
      ...drop,
      gePrice,
      evPerKill,
      evPerHr: evPerKill != null ? evPerKill * lootKillsPerHour : null,
    };
  });
}

export function computeLootTotals(lootRows: LootRow[]): {
  perKill: number;
  perHour: number;
} {
  const perKill = lootRows.reduce((sum, row) => sum + (row.evPerKill ?? 0), 0);
  const perHour = lootRows.reduce((sum, row) => sum + (row.evPerHr ?? 0), 0);
  return { perKill, perHour };
}

export function computeDropCategoryCount(
  dropCategories: { name: string; drops: DropItem[] }[],
  bossLootTable: BossDropTable | null,
  boss: BossInfo | null
): number | null {
  if (dropCategories.length > 0) return dropCategories.length;
  if (bossLootTable) return new Set(bossLootTable.drops.map((drop) => drop.category)).size;
  if (boss && RAID_DROP_CATEGORY_COUNTS[boss.name] != null) {
    return RAID_DROP_CATEGORY_COUNTS[boss.name]!;
  }
  return null;
}

export function raidTopUniqueName(
  raidLoot: { uniques: RaidDropEntry[] } | null
): string | null {
  if (!raidLoot) return null;
  return raidLoot.uniques[0]?.name ?? null;
}

export function buildItemMaps(
  mapping: Array<{ name: string; id: number; icon?: string }>
): { itemMap: Map<string, number>; iconMap: Map<string, string> } {
  const itemMap = new Map<string, number>();
  const iconMap = new Map<string, string>();
  for (const item of mapping) {
    itemMap.set(item.name.toLowerCase(), item.id);
    if (item.icon) iconMap.set(item.name.toLowerCase(), item.icon);
  }
  return { itemMap, iconMap };
}
