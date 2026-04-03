import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOSS_CATEGORIES,
  BOSSES,
  findBossByName,
  normalizeBossLookup,
  type BossInfo,
} from "../../lib/data/bosses";
import { bossIcon, bossIconSmall } from "../../lib/sprites";
import { itemIcon } from "../../lib/sprites";
import type { HiscoreData } from "../../lib/api/hiscores";
import {
  fetchBossGuideDocument,
  type BossGuideDocument,
} from "../../lib/wiki/bossGuide";
import { fetchDropTable, type DropItem } from "../../lib/api/wiki";
import {
  fetchLatestPrices,
  fetchMapping,
  type ItemPrice,
} from "../../lib/api/ge";
import {
  COMBAT_TASKS,
  COMBAT_TIERS,
  type CombatTask,
} from "../../lib/data/combat-achievements";
import {
  BOSS_DROP_TABLES,
  type BossDropTable,
} from "../../lib/data/boss-drops";
import { formatGp } from "../../lib/format";
import SourceAttribution from "../../components/SourceAttribution";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import StructuredSection from "./StructuredSection";
import BossMetaCard from "./components/BossMetaCard";
import { BOSS_METADATA } from "../../lib/data/boss-metadata";
import { fetchDropsForMonster, fetchBossDropsFromWiki, type WikiDrop, type BossWikiDrop } from "../../lib/api/drops";
import DropTable from "../../components/DropTable";
import { Skeleton, TableSkeleton, CardSkeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import {
  initWikiInteractive,
  handleLightboxClick,
} from "../../lib/wiki/interactive";

interface Props {
  hiscores?: HiscoreData | null;
}

type BossWorkspaceTab = "guide" | "drops" | "tasks";

const BOSS_WORKSPACE_TABS: Array<{
  id: BossWorkspaceTab;
  label: string;
  description: string;
}> = [
  { id: "guide", label: "Strategy", description: "Mechanics, requirements, gear" },
  { id: "drops", label: "Loot & Drops", description: "Uniques, value, drop groups" },
  { id: "tasks", label: "Task Planner", description: "Boss-linked CA reference" },
];

const CATEGORY_LABELS: Record<string, string> = {
  All: "All bosses",
  Raids: "Raid encounters",
  GWD: "God Wars Dungeon",
  Slayer: "Slayer bosses",
  Wilderness: "Wilderness bosses",
  Other: "Other bosses",
  Varlamore: "Varlamore",
};

function BossActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
    >
      {label}
    </button>
  );
}

function guideSectionClassName(title: string) {
  const lower = title.toLowerCase();
  if (
    lower.includes("suggested skills") ||
    lower.includes("recommended skills") ||
    lower.includes("requirements")
  ) {
    return "article-content--structured article-content--requirements";
  }

  if (
    lower.includes("equipment") ||
    lower.includes("inventory") ||
    lower.includes("gear")
  ) {
    return "article-content--structured article-content--loadout article-content--loadout-table";
  }

  return "";
}

function scrollToGuideSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleGuideClick(e: React.MouseEvent) {
  const target = e.target;

  if (target instanceof HTMLButtonElement && target.classList.contains("tile-marker-copy")) {
    const tiles = target.getAttribute("data-tiles");
    if (tiles) {
      navigator.clipboard.writeText(tiles).then(() => {
        const original = target.textContent;
        target.textContent = "✓ Copied!";
        target.style.color = "#22c55e";
        target.style.borderColor = "rgba(34,197,94,0.3)";
        setTimeout(() => {
          target.textContent = original;
          target.style.color = "#3b82f6";
          target.style.borderColor = "#2e3345";
        }, 2000);
      });
    }
    return;
  }

  handleLightboxClick(e);
}

export default function BossGuide({ hiscores }: Props) {
  const { navigate, params } = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBoss, setSelectedBoss] = useState<BossInfo | null>(null);
  const [activeTab, setActiveTab] = useState<BossWorkspaceTab>("guide");
  const [guide, setGuide] = useState<BossGuideDocument | null>(null);
  const [dropCategories, setDropCategories] = useState<
    { name: string; drops: DropItem[] }[]
  >([]);
  const [lootKillsPerHour, setLootKillsPerHour] = useState(20);
  const [loading, setLoading] = useState(false);
  const [dropsLoading, setDropsLoading] = useState(false);
  const [wikiDrops, setWikiDrops] = useState<WikiDrop[]>([]);
  const [bucketFallbackDrops, setBucketFallbackDrops] = useState<BossWikiDrop[]>([]);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [itemMap, setItemMap] = useState<Map<string, number>>(new Map());
  const [iconMap, setIconMap] = useState<Map<string, string>>(new Map());
  const activeRequest = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const guideContentRef = useRef<HTMLDivElement>(null);

  const filteredBosses = useMemo(
    () =>
      selectedCategory === "All"
        ? BOSSES
        : BOSSES.filter((boss) => boss.category === selectedCategory),
    [selectedCategory]
  );

  const bossKc = useMemo(() => {
    if (!selectedBoss || !hiscores?.activities) return null;
    const bossName = selectedBoss.name.toLowerCase();
    const altName = selectedBoss.hiscoresName?.toLowerCase();
    const activity = hiscores.activities.find((item) => {
      const actName = item.name.toLowerCase();
      return (
        actName === bossName ||
        (altName && actName === altName) ||
        bossName.includes(actName) ||
        actName.includes(bossName)
      );
    });
    return activity && activity.score > 0 ? activity.score : null;
  }, [hiscores, selectedBoss]);

  const bossTasks = useMemo(() => {
    if (!selectedBoss) return [];

    // Map boss names to their combat task boss names (handles mismatches)
    const TASK_ALIASES: Record<string, string[]> = {
      "Dagannoth Rex": ["Dagannoth Kings"],
      "Dagannoth Prime": ["Dagannoth Kings"],
      "Dagannoth Supreme": ["Dagannoth Kings"],
      "TzKal-Zuk": ["The Inferno"],
      "TzTok-Jad": ["TzHaar Fight Cave"],
      "Barrows Chests": ["Barrows"],
      "The Gauntlet": ["Gauntlet"],
      "The Corrupted Gauntlet": ["Corrupted Gauntlet"],
      "Nightmare": ["The Nightmare"],
    };

    const selected = normalizeBossLookup(selectedBoss.name);
    const aliases = (TASK_ALIASES[selectedBoss.name] ?? []).map(normalizeBossLookup);

    return COMBAT_TASKS.filter((task) => {
      const taskBoss = normalizeBossLookup(task.boss);
      return (
        taskBoss === selected ||
        taskBoss.includes(selected) ||
        selected.includes(taskBoss) ||
        aliases.some((alias) => taskBoss === alias || taskBoss.includes(alias))
      );
    });
  }, [selectedBoss]);

  const tasksByTier = useMemo(
    () =>
      COMBAT_TIERS.map((tier) => ({
        tier,
        tasks: bossTasks.filter((task) => task.tier === tier),
      })).filter((group) => group.tasks.length > 0),
    [bossTasks]
  );

  const bossLootTable = useMemo<BossDropTable | null>(() => {
    if (!selectedBoss) return null;
    return (
      BOSS_DROP_TABLES.find(
        (boss) => normalizeBossLookup(boss.bossName) === normalizeBossLookup(selectedBoss.name)
      ) ?? null
    );
  }, [selectedBoss]);

  const topDrops = useMemo(() => {
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
  }, [bossLootTable, dropCategories, itemMap, prices]);

  const lootRows = useMemo(() => {
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
  }, [bossLootTable, lootKillsPerHour, prices]);

  const lootTotals = useMemo(() => {
    const perKill = lootRows.reduce((sum, row) => sum + (row.evPerKill ?? 0), 0);
    const perHour = lootRows.reduce((sum, row) => sum + (row.evPerHr ?? 0), 0);
    return { perKill, perHour };
  }, [lootRows]);

  const dropCategoryCount = useMemo(() => {
    if (dropCategories.length > 0) return dropCategories.length;
    if (!bossLootTable) return null;
    return new Set(bossLootTable.drops.map((drop) => drop.category)).size;
  }, [bossLootTable, dropCategories]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchLatestPrices(), fetchMapping()]).then(
      ([nextPrices, mapping]) => {
        if (cancelled) return;
        setPrices(nextPrices);
        const nameToId = new Map<string, number>();
        const nameToIcon = new Map<string, string>();
        for (const item of mapping) {
          nameToId.set(item.name.toLowerCase(), item.id);
          if (item.icon) nameToIcon.set(item.name.toLowerCase(), item.icon);
        }
        setItemMap(nameToId);
        setIconMap(nameToIcon);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const selectBoss = useCallback(async (boss: BossInfo) => {
    setSelectedBoss(boss);
    setActiveTab("guide");
    setLoading(true);
    if (window.innerWidth < 1280) {
      setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setDropsLoading(true);
    setDropCategories([]);
    setWikiDrops([]);
    setBucketFallbackDrops([]);
    const requestId = ++activeRequest.current;
    const hasStaticDrops = BOSS_DROP_TABLES.some(
      (t) => normalizeBossLookup(t.bossName) === normalizeBossLookup(boss.name)
    );
    try {
      const [nextGuide, nextDrops, nextWikiDrops] = await Promise.all([
        fetchBossGuideDocument(boss.wikiPage),
        fetchDropTable(boss.name).catch(() => ({ categories: [] })),
        fetchDropsForMonster(boss.name).then((t) => t.drops).catch(() => [] as WikiDrop[]),
      ]);
      if (requestId === activeRequest.current) {
        setGuide(nextGuide);
        setDropCategories(nextDrops.categories);
        setWikiDrops(nextWikiDrops);
        if (!hasStaticDrops && nextWikiDrops.length === 0) {
          fetchBossDropsFromWiki(boss.name)
            .then((rows) => {
              if (requestId === activeRequest.current) setBucketFallbackDrops(rows);
            })
            .catch(() => {});
        }
      }
    } finally {
      if (requestId === activeRequest.current) {
        setLoading(false);
        setDropsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!params.boss) return;

    const targetBoss = findBossByName(params.boss);

    if (!targetBoss) return;
    if (selectedBoss?.name === targetBoss.name) return;
    void selectBoss(targetBoss);
  }, [params.boss, selectBoss, selectedBoss?.name]);

  useEffect(() => {
    if (params.tab === "guide" || params.tab === "drops" || params.tab === "tasks") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (bossLootTable) {
      setLootKillsPerHour(bossLootTable.killsPerHour);
    }
  }, [bossLootTable]);

  // Initialize wiki tabbers after guide content renders
  useEffect(() => {
    if (!loading && guide && guideContentRef.current) {
      initWikiInteractive(guideContentRef.current);
    }
  }, [loading, guide]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Boss Guides</h2>
            <p className="max-w-2xl text-sm text-text-secondary">
              Curated OSRS Wiki boss strategies with app-native layout, your kill count,
              and quick jumps into loot, combat tasks, and DPS workflows.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-secondary/60">
            {CATEGORY_LABELS[selectedCategory] ?? selectedCategory}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              selectedCategory === "All"
                ? "bg-accent text-white"
                : "border border-border bg-bg-primary/60 text-text-secondary hover:text-text-primary"
            }`}
          >
            All
          </button>
          {BOSS_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === category
                  ? "bg-accent text-white"
                  : "border border-border bg-bg-primary/60 text-text-secondary hover:text-text-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <div className="mb-3 px-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
            Boss Directory
          </div>
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1 scroll-fade sidebar-scroll">
            {filteredBosses.map((boss) => {
              const active = selectedBoss?.name === boss.name;
              return (
                <button
                  key={boss.name}
                  type="button"
                  onClick={() => void selectBoss(boss)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-accent/35 bg-accent/10"
                      : "border-transparent bg-bg-primary/55 hover:border-border hover:bg-bg-primary/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <WikiImage
                      src={bossIconSmall(boss.name)}
                      alt=""
                      className="h-10 w-10 rounded-lg object-contain"
                      fallback={boss.name[0]}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text-primary">
                        {boss.name}
                      </div>
                      <div className="mt-1 text-[11px] text-text-secondary">
                        {boss.category}
                        {boss.combatLevel ? ` · Combat ${boss.combatLevel}` : ""}
                        {boss.hitpoints ? ` · ${boss.hitpoints} HP` : ""}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedBoss && (
            <div className="flex justify-center py-2 xl:hidden text-text-secondary/30">
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
                <path d="M2 2l8 8 8-8" />
              </svg>
            </div>
          )}
        </aside>

        <div ref={contentRef} className="space-y-4">
          {!selectedBoss ? (
            <EmptyState
              title="Select a boss"
              description="Pick a boss from the directory to load its curated strategy view, loot table, and combat tasks."
            />
          ) : null}

          {selectedBoss ? (
            <section>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <WikiImage
                    src={bossIcon(selectedBoss.name)}
                    alt=""
                    className="h-20 w-20 rounded-2xl border border-border/40 bg-bg-primary/60 object-contain p-1"
                    fallback={selectedBoss.name[0]}
                  />
                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-accent/70 font-medium">
                        {selectedBoss.category}
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight">{selectedBoss.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedBoss.combatLevel ? (
                        <span className="rounded-full border border-border bg-bg-primary/60 px-3 py-1 text-text-secondary">
                          Combat {selectedBoss.combatLevel}
                        </span>
                      ) : null}
                      {selectedBoss.hitpoints ? (
                        <span className="rounded-full border border-danger/20 bg-danger/10 px-3 py-1 text-danger">
                          {selectedBoss.hitpoints} HP
                        </span>
                      ) : null}
                      {bossKc != null ? (
                        <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-success">
                          Your KC {bossKc.toLocaleString()}
                        </span>
                      ) : null}
                      {selectedBoss.location ? (
                        <a
                          href={`https://oldschool.runescape.wiki/w/${selectedBoss.location.replace(/ /g, "_")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-accent transition hover:bg-accent/20"
                        >
                          📍 {selectedBoss.location}
                        </a>
                      ) : null}
                    </div>
                    {guide?.summary ? (
                      <p className="max-w-3xl text-sm leading-6 text-text-secondary">
                        {guide.summary}
                      </p>
                    ) : null}
                    <SourceAttribution
                      source="OSRS Wiki"
                      fetchedAt={guide?.fetchedAt ?? null}
                      cacheLabel="1 hour"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                  {BOSS_WORKSPACE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
                        activeTab === tab.id
                          ? "border-accent/50 bg-accent/10"
                          : "border-border bg-bg-primary/50 text-text-secondary hover:border-border hover:bg-bg-primary/70"
                      }`}
                    >
                      {activeTab === tab.id && (
                        <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
                      )}
                      <div className={`text-xs font-semibold ${activeTab === tab.id ? "text-accent" : ""}`}>
                        {tab.label}
                      </div>
                      <div className={`hidden sm:block text-[11px] ${activeTab === tab.id ? "text-accent/60" : "text-text-secondary/60"}`}>
                        {tab.description}
                      </div>
                    </button>
                  ))}
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                  <BossActionButton
                    label="Loot Calculator"
                    onClick={() =>
                      navigate("loot", {
                        boss: bossLootTable?.bossName ?? selectedBoss.name,
                        tab: "profit",
                      })
                    }
                  />
                  <BossActionButton
                    label="DPS"
                    onClick={() => navigate("dps-calc", { monster: selectedBoss.name })}
                  />
                  {selectedBoss.category === "Raids" && (
                    <BossActionButton
                      label="Raid Rooms"
                      onClick={() => navigate("raids")}
                    />
                  )}
                  <a
                    href={`https://oldschool.runescape.wiki/w/${selectedBoss.wikiPage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                  >
                    Open Wiki
                  </a>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Guide Sections
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text-primary">
                    {guide?.sections.length ?? 0}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    Structured strategy blocks in this workspace.
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Drop Categories
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text-primary">
                    {dropCategoryCount ?? "\u2014"}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    {dropCategories.length > 0
                      ? "Embedded loot groups from the OSRS Wiki."
                      : bossLootTable
                        ? "Curated loot groups from RuneWise data."
                        : "No structured loot groups available yet."}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Task References
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text-primary">
                    {bossTasks.length}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    Boss-linked combat tasks available for planning.
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Top Drop
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text-primary">
                    {topDrops[0]?.gePrice != null ? formatGp(topDrops[0].gePrice) : "\u2014"}
                  </div>
                  <div className="mt-1 truncate text-xs text-text-secondary">
                    {topDrops[0]?.drop.name ?? "Waiting on loot data"}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {loading && selectedBoss ? (
            <div className="space-y-4">
              <CardSkeleton />
              <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg" />
                  ))}
                </div>
                <div className="space-y-4">
                  <CardSkeleton />
                  <TableSkeleton rows={4} cols={3} />
                </div>
              </div>
            </div>
          ) : null}

          {selectedBoss && !loading && activeTab === "guide" && guide && guide.sections.length > 0 ? (
            <div>
              {BOSS_METADATA[selectedBoss.name] && (
                <BossMetaCard
                  meta={BOSS_METADATA[selectedBoss.name]}
                  combatLevel={selectedBoss.combatLevel}
                  hitpoints={selectedBoss.hitpoints}
                  maxHit={selectedBoss.maxHit}
                  weakness={selectedBoss.weakness}
                  hiscores={hiscores}
                />
              )}
            <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="h-fit xl:sticky xl:top-6 max-h-[calc(100vh-4rem)] overflow-y-auto scroll-fade sidebar-scroll">
                <div className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
                  Guide Sections
                </div>
                <div className="space-y-0.5">
                  {guide.sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToGuideSection(section.id)}
                      className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-secondary transition hover:bg-bg-primary/60 hover:text-text-primary"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg-tertiary/60 text-[10px] font-medium text-text-secondary/60 group-hover:text-text-primary">
                        {index + 1}
                      </span>
                      <span className="truncate">{section.title}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <div ref={guideContentRef} className="space-y-4" onClick={handleGuideClick}>
                {guide.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="rounded-xl border border-border/40 bg-bg-primary/25 p-5"
                  >
                    <h4 className="mb-4 text-base font-semibold tracking-tight text-text-primary">
                      {section.title}
                    </h4>
                    <StructuredSection title={section.title} html={section.html} />
                    <div
                      className={`article-content text-sm leading-7 text-text-secondary ${guideSectionClassName(section.title)}`.trim()}
                      dangerouslySetInnerHTML={{ __html: section.html }}
                      style={
                        section.title.toLowerCase().includes("requirements") ||
                        section.title.toLowerCase().includes("skills") ||
                        section.title.toLowerCase().includes("equipment") ||
                        section.title.toLowerCase().includes("inventory")
                          ? { display: "none" }
                          : undefined
                      }
                    />
                  </section>
                ))}
              </div>
            </div>
            </div>
          ) : null}

          {selectedBoss && !loading && activeTab === "guide" && guide && guide.sections.length === 0 ? (
            <EmptyState
              title="No guide content available"
              description="No structured strategy sections were found for this boss. Try the wiki page for the full source."
              action={{ label: "Open Wiki", onClick: () => window.open(`https://oldschool.runescape.wiki/w/${selectedBoss.wikiPage}`, "_blank") }}
            />
          ) : null}

          {selectedBoss && !loading && activeTab === "drops" ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold tracking-tight text-text-primary">
                    Loot & Drops
                  </h4>
                  <p className="mt-1 text-sm text-text-secondary">
                    Wiki drop data for {selectedBoss.name}, kept inside the boss workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("loot", { monster: selectedBoss.name, tab: "drops" })}
                  className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                >
                  Open Full Drops View
                </button>
              </div>

              {dropsLoading ? (
                <TableSkeleton rows={8} cols={4} />
              ) : wikiDrops.length > 0 ? (
                <DropTable
                  drops={wikiDrops}
                  prices={prices}
                  itemMap={itemMap}
                  iconMap={iconMap}
                  killsPerHour={lootKillsPerHour}
                  onKillsPerHourChange={setLootKillsPerHour}
                  showProfit
                />
              ) : dropCategories.length > 0 ? (
                <div className="space-y-4">
                  {bossLootTable ? (
                    <div>
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-text-secondary/45">
                            Loot Calculator
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">
                            Expected value from the curated RuneWise loot table for {selectedBoss.name}.
                          </p>
                        </div>
                        <label className="block">
                          <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-text-secondary/45">
                            Kills / Hour
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={lootKillsPerHour}
                            onChange={(e) => setLootKillsPerHour(Math.max(1, Number(e.target.value) || 1))}
                            className="w-28 rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                          />
                        </label>
                      </div>

                      <div className="mb-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border/60 bg-bg-secondary/70 px-4 py-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                            Expected GP / Kill
                          </div>
                          <div className="mt-1 text-lg font-semibold text-success">
                            {formatGp(Math.round(lootTotals.perKill))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-bg-secondary/70 px-4 py-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                            Expected GP / Hour
                          </div>
                          <div className="mt-1 text-lg font-semibold text-success">
                            {formatGp(Math.round(lootTotals.perHour))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-text-secondary text-xs">
                              <th scope="col" className="px-4 py-2 text-left">Item</th>
                              <th scope="col" className="px-4 py-2 text-right">Rate</th>
                              <th scope="col" className="px-4 py-2 text-right">Qty</th>
                              <th scope="col" className="px-4 py-2 text-right">GE</th>
                              <th scope="col" className="px-4 py-2 text-right">GP/Kill</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lootRows.map((row) => (
                              <tr
                                key={`loot-row-${row.itemId}`}
                                className="border-b border-border/50 even:bg-bg-primary/25"
                              >
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => navigate("market", { query: row.itemName })}
                                    className="flex items-center gap-2 text-left text-text-primary transition hover:text-accent"
                                  >
                                    <WikiImage
                                      src={itemIcon(row.itemName)}
                                      alt=""
                                      className="h-5 w-5 shrink-0"
                                      fallback={row.itemName[0]}
                                    />
                                    <span>{row.itemName}</span>
                                  </button>
                                </td>
                                <td className="px-4 py-2 text-right text-text-secondary">
                                  {row.rate === 1 ? "Always" : `1/${row.rate.toLocaleString()}`}
                                </td>
                                <td className="px-4 py-2 text-right text-text-secondary">{row.quantity}</td>
                                <td className="px-4 py-2 text-right text-success">
                                  {formatGp(row.gePrice)}
                                </td>
                                <td className="px-4 py-2 text-right text-success">
                                  {formatGp(row.evPerKill != null ? Math.round(row.evPerKill) : null)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {topDrops.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      {topDrops.map(({ drop, gePrice }) => (
                        <button
                          key={`top-drop-${drop.name}`}
                          type="button"
                          onClick={() => navigate("market", { query: drop.name })}
                          className="rounded-xl border border-border/50 bg-bg-primary/45 p-3 text-left transition hover:bg-bg-primary/70 hover:border-accent/30"
                        >
                          <div className="flex items-center gap-3">
                            <WikiImage
                              src={itemIcon(drop.name)}
                              alt=""
                              className="h-8 w-8 shrink-0"
                              fallback={drop.name[0]}
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-text-primary">
                                {drop.name}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {drop.rarity}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-sm font-semibold text-success">
                            {gePrice != null ? formatGp(gePrice) : drop.price || "\u2014"}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {dropCategories.slice(0, 4).map((category) => (
                    <div key={category.name}>
                      <h5 className="mb-2 text-xs uppercase tracking-[0.18em] text-text-secondary/45">
                        {category.name}
                      </h5>
                      <div className="rounded-xl border border-border/60 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-text-secondary text-xs">
                              <th scope="col" className="px-4 py-2 text-left">Item</th>
                              <th scope="col" className="px-4 py-2 text-right">Qty</th>
                              <th scope="col" className="px-4 py-2 text-right">Rate</th>
                              <th scope="col" className="px-4 py-2 text-right">GE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.drops.slice(0, 8).map((drop, index) => (
                              <tr
                                key={`${category.name}-${drop.name}-${index}`}
                                className="border-b border-border/50 even:bg-bg-secondary/35"
                              >
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => navigate("market", { query: drop.name })}
                                    className="flex items-center gap-2 text-left text-text-primary transition hover:text-accent"
                                  >
                                    <WikiImage
                                      src={itemIcon(drop.name)}
                                      alt=""
                                      className="h-5 w-5 shrink-0"
                                      fallback={drop.name[0]}
                                    />
                                    <span>{drop.name}</span>
                                  </button>
                                </td>
                                <td className="px-4 py-2 text-right text-text-secondary">
                                  {drop.quantity}
                                </td>
                                <td className="px-4 py-2 text-right text-text-secondary">
                                  {drop.rarity}
                                </td>
                                <td className="px-4 py-2 text-right text-success">
                                  {(() => {
                                    const itemId = itemMap.get(drop.name.toLowerCase());
                                    const price = itemId ? prices[String(itemId)] : null;
                                    const gePrice = price?.high ?? price?.low ?? null;
                                    return gePrice != null
                                      ? formatGp(gePrice)
                                      : drop.price || "\u2014";
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : bucketFallbackDrops.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs text-text-secondary">
                    Wiki bucket drop data for {selectedBoss.name}.
                  </p>
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary text-xs">
                        <th scope="col" className="px-4 py-2 text-left">Item</th>
                        <th scope="col" className="px-4 py-2 text-right">Qty</th>
                        <th scope="col" className="px-4 py-2 text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bucketFallbackDrops.map((drop, i) => (
                        <tr
                          key={`bucket-drop-${drop.item}-${i}`}
                          className="border-b border-border/50 even:bg-bg-secondary/35"
                        >
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => navigate("market", { query: drop.item })}
                              className="flex items-center gap-2 text-left text-text-primary transition hover:text-accent"
                            >
                              <WikiImage
                                src={itemIcon(drop.item)}
                                alt=""
                                className="h-5 w-5 shrink-0"
                                fallback={drop.item[0]}
                              />
                              <span>{drop.item}</span>
                            </button>
                          </td>
                          <td className="px-4 py-2 text-right text-text-secondary">{drop.quantity}</td>
                          <td className="px-4 py-2 text-right text-text-secondary">
                            {drop.rate === 1 ? "Always" : drop.rate > 0 ? `1/${drop.rate.toLocaleString()}` : "Varies"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No drop data available"
                  description="No structured loot data was found for this boss. Try the full drops view or wiki page."
                  action={{ label: "Open Full Drops View", onClick: () => navigate("loot", { monster: selectedBoss.name, tab: "drops" }) }}
                />
              )}
            </section>
          ) : null}

          {selectedBoss && !loading && activeTab === "tasks" ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold tracking-tight text-text-primary">
                    Combat Tasks Reference
                  </h4>
                  <p className="mt-1 text-sm text-text-secondary">
                    Boss-linked combat achievement tasks for planning. This is reference data, not synced completion.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("combat-tasks", { search: selectedBoss.name })}
                  className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                >
                  Open Full Tasks View
                </button>
              </div>

              {tasksByTier.length > 0 ? (
                <div className="space-y-4">
                  {tasksByTier.map((group) => (
                    <div key={group.tier}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          group.tier === "Easy" ? "bg-success" :
                          group.tier === "Medium" ? "bg-accent" :
                          group.tier === "Hard" ? "bg-warning" :
                          group.tier === "Elite" ? "bg-danger" :
                          group.tier === "Master" ? "bg-[#a78bfa]" :
                          "bg-[#f472b6]"
                        }`} />
                        <span className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                          {group.tier}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {group.tasks.map((task: CombatTask) => (
                          <div
                            key={task.name}
                            className="rounded-xl border border-border/40 bg-bg-primary/30 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-text-primary">{task.name}</div>
                                <div className="mt-1 text-xs text-text-secondary">{task.description}</div>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() => navigate("dps-calc", { monster: selectedBoss.name })}
                                  className="rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5 text-[11px] text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                                >
                                  DPS
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab("drops")}
                                  className="rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5 text-[11px] text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                                >
                                  Drops
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No combat tasks found"
                  description={`No boss-linked combat achievement tasks found for ${selectedBoss.name}.`}
                />
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
