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
import { warn } from "../../lib/logger";
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
import { type CombatTask } from "../../lib/data/combat-achievements";
import { BOSS_DROP_TABLES } from "../../lib/data/boss-drops";
import type { RaidDropEntry } from "../../lib/data/raid-loot";

import { openExternal } from "../../lib/openExternal";
import {
  extractWeaknessFromSummary,
  handleGuideClick,
  normalizeBossSlug,
  scrollToGuideSection,
  weaknessToStyle,
} from "./bossGuideUtils";
import AccountPrefillBanner from "../../components/AccountPrefillBanner";
import { formatGp } from "../../lib/format";
import FreshnessStrip from "../../components/FreshnessStrip";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import StructuredSection from "./StructuredSection";
import BossMetaCard from "./components/BossMetaCard";
import BossActionIcon from "./components/BossActionIcon";
import { BOSS_METADATA } from "../../lib/data/boss-metadata";
import { fetchDropsForMonster, fetchBossDropsFromWiki, type WikiDrop, type BossWikiDrop } from "../../lib/api/drops";
import DropTable from "../../components/DropTable";
import { Button } from "../../components/primitives";
import { Skeleton, TableSkeleton, CardSkeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { initWikiInteractive } from "../../lib/wiki/interactive";
import {
  BOSS_WORKSPACE_TABS,
  CATEGORY_LABELS,
  type BossWorkspaceTab,
} from "./bossGuideConstants";
import { sectionContentClasses } from "../wiki-lookup/wikiLookupUtils";
import {
  buildItemMaps,
  computeDropCategoryCount,
  computeLootRows,
  computeLootTotals,
  computeTopDrops,
  getBossKc,
  getBossLootTable,
  getBossTasks,
  getRaidLootFallback,
  groupTasksByTier,
  raidTopUniqueName,
} from "./bossGuideSelectors";
import { getMetaPacksForBoss } from "../../lib/data/boss-meta-packs";

interface Props {
  hiscores?: HiscoreData | null;
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
  const [guideError, setGuideError] = useState<string | null>(null);
  const [dropsLoading, setDropsLoading] = useState(false);
  const [wikiDrops, setWikiDrops] = useState<WikiDrop[]>([]);
  const [bucketFallbackDrops, setBucketFallbackDrops] = useState<BossWikiDrop[]>([]);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [itemMap, setItemMap] = useState<Map<string, number>>(new Map());
  const [iconMap, setIconMap] = useState<Map<string, string>>(new Map());
  const activeRequest = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const guideContentRef = useRef<HTMLDivElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [bossQuery, setBossQuery] = useState("");
  const [tocExpanded, setTocExpanded] = useState<Record<string, boolean>>({});

  const filteredBosses = useMemo(() => {
    const byCat =
      selectedCategory === "All"
        ? BOSSES
        : BOSSES.filter((boss) => boss.category === selectedCategory);
    const q = bossQuery.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.location?.toLowerCase().includes(q) ?? false)
    );
  }, [selectedCategory, bossQuery]);

  const bossKc = useMemo(
    () => getBossKc(hiscores, selectedBoss),
    [hiscores, selectedBoss]
  );

  const bossTasks = useMemo(() => getBossTasks(selectedBoss), [selectedBoss]);

  const tasksByTier = useMemo(() => groupTasksByTier(bossTasks), [bossTasks]);

  const bossLootTable = useMemo(
    () => getBossLootTable(selectedBoss),
    [selectedBoss]
  );

  // Raid loot fallback: used when wiki drops are empty and boss is a raid
  const raidLootFallback = useMemo(() => {
    const hasLootData =
      dropCategories.length > 0 || wikiDrops.length > 0 || bossLootTable !== null;
    return getRaidLootFallback(selectedBoss, hasLootData);
  }, [selectedBoss, dropCategories, wikiDrops, bossLootTable]);

  const topDrops = useMemo(
    () => computeTopDrops(dropCategories, bossLootTable, itemMap, prices),
    [bossLootTable, dropCategories, itemMap, prices]
  );

  // Top drop from raid fallback (for summary card)
  const raidTopDrop = useMemo(
    () => raidTopUniqueName(raidLootFallback),
    [raidLootFallback]
  );

  const lootRows = useMemo(
    () => computeLootRows(bossLootTable, prices, lootKillsPerHour),
    [bossLootTable, lootKillsPerHour, prices]
  );

  const lootTotals = useMemo(() => computeLootTotals(lootRows), [lootRows]);

  const dropCategoryCount = useMemo(
    () => computeDropCategoryCount(dropCategories, bossLootTable, selectedBoss),
    [bossLootTable, dropCategories, selectedBoss]
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchLatestPrices(), fetchMapping()]).then(
      ([nextPrices, mapping]) => {
        if (cancelled) return;
        setPrices(nextPrices);
        const maps = buildItemMaps(mapping);
        setItemMap(maps.itemMap);
        setIconMap(maps.iconMap);
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
    setGuide(null);
    setGuideError(null);
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
      const dropsName = boss.dropsName ?? boss.name;
      const [guideResult, nextDrops, nextWikiDrops] = await Promise.all([
        fetchBossGuideDocument(boss.wikiPage).then(
          (doc) => ({ ok: true as const, doc }),
          (err: unknown) => ({
            ok: false as const,
            message: err instanceof Error ? err.message : "Failed to load boss guide",
          })
        ),
        fetchDropTable(boss.name).catch(() => ({ categories: [] })),
        fetchDropsForMonster(dropsName).then((t) => t.drops).catch(() => [] as WikiDrop[]),
      ]);
      if (requestId !== activeRequest.current) return;
      if (guideResult.ok) {
        setGuide(guideResult.doc);
        setGuideError(null);
      } else {
        setGuide(null);
        setGuideError(guideResult.message);
      }
      setDropCategories(nextDrops.categories);
      setWikiDrops(nextWikiDrops);
      if (!hasStaticDrops && nextWikiDrops.length === 0) {
        fetchBossDropsFromWiki(dropsName)
          .then((rows) => {
            if (requestId === activeRequest.current) setBucketFallbackDrops(rows);
          })
          .catch((err: unknown) => { warn("BossGuide: fetch bucket drops", err); });
      }
    } catch (err: unknown) {
      if (requestId === activeRequest.current) {
        setGuide(null);
        setGuideError(err instanceof Error ? err.message : "Failed to load boss guide");
      }
    } finally {
      if (requestId === activeRequest.current) {
        setLoading(false);
        setDropsLoading(false);
      }
    }
  }, []);

  // Default to highest-KC boss (or first in list) when no deep-link boss is set.
  const defaultBossDone = useRef(false);
  useEffect(() => {
    if (defaultBossDone.current) return;
    if (params.boss) {
      defaultBossDone.current = true;
      return;
    }
    if (selectedBoss) {
      defaultBossDone.current = true;
      return;
    }
    let best: { boss: BossInfo; kc: number } | null = null;
    if (hiscores?.activities?.length) {
      for (const boss of BOSSES) {
        const kc = getBossKc(hiscores, boss);
        if (kc == null || kc <= 0) continue;
        if (!best || kc > best.kc) best = { boss, kc };
      }
    }
    const pick = best?.boss ?? BOSSES[0] ?? null;
    if (pick) {
      defaultBossDone.current = true;
      void selectBoss(pick);
    }
  }, [hiscores, params.boss, selectedBoss, selectBoss]);

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

  // Scrollspy: highlight the guide TOC / mobile chip for the section in view.
  useEffect(() => {
    if (!guide || loading || activeTab !== "guide") {
      setActiveSectionId(null);
      return;
    }
    const root = guideContentRef.current;
    if (!root) return;

    const targets = guide.sections
      .map((s) => root.querySelector<HTMLElement>(`#${CSS.escape(s.id)}`))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        // Prefer the first H2 currently in view; fall back to first visible.
        for (const section of guide.sections) {
          if (visible.has(section.id)) {
            setActiveSectionId(section.id);
            return;
          }
        }
      },
      { rootMargin: "-12% 0px -55% 0px", threshold: [0, 0.1, 0.4] }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [guide, loading, activeTab]);

  // Reset mobile summary chrome / TOC expand when boss changes.
  useEffect(() => {
    setSummaryExpanded(false);
    setTocExpanded({});
  }, [selectedBoss?.name]);

  // Keep the selected boss visible in the sticky directory list.
  useEffect(() => {
    if (!selectedBoss) return;
    const el = document.querySelector<HTMLElement>(
      `[data-boss-name="${CSS.escape(selectedBoss.name)}"]`
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedBoss?.name]);

  // After a guide finishes loading on small screens, jump past chrome into content.
  useEffect(() => {
    if (loading || !guide || !selectedBoss) return;
    if (typeof window === "undefined" || window.innerWidth >= 1280) return;
    const t = window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [loading, guide, selectedBoss?.name]);

  // j / k — next / previous guide section (when not typing in an input).
  useEffect(() => {
    if (!guide || activeTab !== "guide") return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.key !== "j" && e.key !== "k") return;
      const ids = guide!.sections.map((s) => s.id);
      if (ids.length === 0) return;
      const current = activeSectionId && ids.includes(activeSectionId)
        ? ids.indexOf(activeSectionId)
        : 0;
      const next =
        e.key === "j"
          ? Math.min(ids.length - 1, current + 1)
          : Math.max(0, current - 1);
      e.preventDefault();
      scrollToGuideSection(ids[next]);
      setActiveSectionId(ids[next]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guide, activeTab, activeSectionId]);

  // Keep the active mobile chip scrolled into view.
  useEffect(() => {
    if (!activeSectionId) return;
    const chip = document.querySelector<HTMLElement>(
      `[data-guide-chips] [data-section-id="${CSS.escape(activeSectionId)}"]`
    );
    // If active is an H3, highlight its parent H2 chip instead.
    const parentChip =
      chip ??
      (() => {
        const section = guide?.sections.find((s) => s.id === activeSectionId);
        if (!section?.parentId) return null;
        return document.querySelector<HTMLElement>(
          `[data-guide-chips] [data-section-id="${CSS.escape(section.parentId)}"]`
        );
      })();
    parentChip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSectionId, guide?.sections]);

  return (
    <div className="space-y-5">
      {!selectedBoss ? (
        <AccountPrefillBanner
          hasHiscores={Boolean(hiscores)}
          context="boss kill counts and personalised task context"
        />
      ) : null}
      <div>
        <div
          className={`flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between ${
            selectedBoss ? "hidden sm:flex" : ""
          }`}
        >
          <div className="space-y-1">
            <h2 className="text-hero font-semibold tracking-tight">Boss Guides</h2>
            <p className="max-w-2xl text-sm text-text-secondary">
              Curated OSRS Wiki boss strategies with app-native layout, your kill count,
              and quick jumps into loot, combat tasks, and DPS workflows.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-secondary/60">
            {CATEGORY_LABELS[selectedCategory] ?? selectedCategory}
          </div>
        </div>

        <div
          className={`mt-4 flex flex-wrap gap-2 ${
            selectedBoss ? "hidden sm:flex" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              selectedCategory === "All"
                ? "bg-accent text-on-accent"
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
                  ? "bg-accent text-on-accent"
                  : "border border-border bg-bg-primary/60 text-text-secondary hover:text-text-primary"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)] min-w-0">
        {/* On small screens, collapse the full directory once a boss is open —
            dual-pane list + guide is the clunkiest layout on phone.
            On desktop, sticky so scrolling the guide doesn't leave an empty column. */}
        <aside
          className={`${
            selectedBoss ? "hidden xl:block" : "block"
          } xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-5rem)]`}
        >
          <div className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
            Boss Directory
          </div>
          <div className="mb-2 px-0.5">
            <input
              type="search"
              value={bossQuery}
              onChange={(e) => setBossQuery(e.target.value)}
              placeholder="Search bosses…"
              aria-label="Search bosses"
              className="w-full rounded-lg border border-border/60 bg-bg-primary/70 px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary/45 focus:border-accent/50"
            />
          </div>
          <div className="space-y-1.5 max-h-[70vh] xl:max-h-[calc(100vh-9rem)] overflow-y-auto pr-1 scroll-fade sidebar-scroll">
            {filteredBosses.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-text-secondary">
                No bosses match “{bossQuery.trim()}”.
              </div>
            ) : null}
            {filteredBosses.map((boss) => {
              const active = selectedBoss?.name === boss.name;
              return (
                <button
                  key={boss.name}
                  type="button"
                  data-boss-name={boss.name}
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
                      <div className="line-clamp-2 text-sm font-medium text-text-primary">
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
        </aside>

        <div ref={contentRef} className="space-y-4 min-w-0">
          {!selectedBoss ? (
            <EmptyState
              title="Select a boss"
              description="Pick a boss from the directory to load its curated strategy view, loot table, and combat tasks."
            />
          ) : null}

          {selectedBoss ? (
            <section className="min-w-0">
              {/* Mobile: back-to-directory control (directory is hidden when a boss is open). */}
              <button
                type="button"
                onClick={() => {
                  setSelectedBoss(null);
                  setGuide(null);
                  setGuideError(null);
                  navigate("bosses", {});
                }}
                className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-bg-primary/50 px-2.5 py-1.5 text-xs text-text-secondary transition hover:border-accent/40 hover:text-text-primary xl:hidden"
              >
                ← All bosses
              </button>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <WikiImage
                    src={bossIcon(selectedBoss.name)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-2xl border border-border/40 bg-bg-primary/60 object-contain p-1"
                    fallback={selectedBoss.name[0]}
                  />
                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-accent/70 font-medium">
                        {selectedBoss.category}
                      </div>
                      <h3 className="text-hero font-semibold tracking-tight">{selectedBoss.name}</h3>
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
                        <button
                          type="button"
                          title="Open Dry Calculator with this boss and KC prefilled"
                          onClick={() =>
                            navigate("dry-calc", {
                              boss: selectedBoss.name,
                              kc: String(bossKc),
                            })
                          }
                          className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-success transition hover:bg-success/20 cursor-pointer"
                        >
                          Your KC {bossKc.toLocaleString()}
                        </button>
                      ) : null}
                      {(() => {
                        const weakness: string | undefined = selectedBoss.weakness ?? (extractWeaknessFromSummary(guide?.summary ?? undefined) ?? undefined);
                        if (!weakness) return null;
                        const style = weaknessToStyle(weakness);
                        return (
                          <button
                            type="button"
                            title={`Open DPS Calculator — ${weakness} style`}
                            onClick={() =>
                              navigate("dps-calc", {
                                monster: selectedBoss.name,
                                style,
                              })
                            }
                            className="rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-warning transition hover:bg-warning/20 cursor-pointer"
                          >
                            Weak: {weakness.charAt(0).toUpperCase() + weakness.slice(1)}
                          </button>
                        );
                      })()}
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
                      {guide?.recommendedApproach ? (
                        <span className="rounded-full border border-border bg-bg-primary/60 px-3 py-1 text-text-secondary">
                          Approach: {guide.recommendedApproach}
                        </span>
                      ) : null}
                      {guide?.teamSize ? (
                        <span className="rounded-full border border-border bg-bg-primary/60 px-3 py-1 text-text-secondary">
                          Team: {guide.teamSize}
                        </span>
                      ) : null}
                      {guide?.combatLevel && !selectedBoss.combatLevel ? (
                        <span className="rounded-full border border-border bg-bg-primary/60 px-3 py-1 text-text-secondary">
                          Combat {guide.combatLevel}
                        </span>
                      ) : null}
                    </div>
                    {guide?.summary ? (
                      <div className="max-w-3xl">
                        <p
                          className={`text-sm leading-6 text-text-secondary ${
                            summaryExpanded ? "" : "line-clamp-3 sm:line-clamp-none"
                          }`}
                        >
                          {guide.summary}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSummaryExpanded((v) => !v)}
                          className="mt-1 text-xs text-accent hover:text-accent-hover sm:hidden"
                        >
                          {summaryExpanded ? "Show less" : "Read more"}
                        </button>
                      </div>
                    ) : null}
                    <FreshnessStrip
                      updatedAt={guide?.fetchedAt ? new Date(guide.fetchedAt) : null}
                      onRefresh={() => {
                        if (selectedBoss) void selectBoss(selectedBoss);
                      }}
                      cacheLabel="1 hour"
                    />
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-start">
                  <BossActionIcon
                    label="Profit Calculator"
                    icon="💰"
                    onClick={() =>
                      navigate("loot", {
                        boss: bossLootTable?.bossName ?? selectedBoss.name,
                        tab: "profit",
                      })
                    }
                  />
                  <BossActionIcon
                    label="DPS Calculator"
                    icon="⚔️"
                    onClick={() => navigate("dps-calc", { monster: selectedBoss.name })}
                  />
                  {selectedBoss.category === "Raids" && (
                    <BossActionIcon
                      label="Raid Rooms"
                      icon="🏛️"
                      onClick={() => navigate("raids")}
                    />
                  )}
                  <BossActionIcon
                    label="Open OSRS Wiki"
                    icon="🔗"
                    href={`https://oldschool.runescape.wiki/w/${selectedBoss.wikiPage}`}
                  />
                </div>
              </div>

              {(() => {
                const packs = getMetaPacksForBoss(
                  selectedBoss.name,
                  selectedBoss.weakness
                );
                if (packs.length === 0) return null;
                return (
                  <div className="mt-3 hidden rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 sm:block">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-accent/80 font-medium">
                        Meta loadouts
                      </div>
                      <button
                        type="button"
                        className="text-[10px] text-text-secondary hover:text-accent"
                        onClick={() =>
                          navigate("loadout-finder")
                        }
                      >
                        Budget finder →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {packs.map((pack) => (
                        <button
                          key={`${pack.preset}-${pack.style}`}
                          type="button"
                          title={pack.note ?? pack.preset}
                          onClick={() =>
                            navigate("dps-calc", {
                              monster: selectedBoss.name,
                              preset: pack.preset,
                              style: pack.style,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-tertiary px-2.5 py-1.5 text-xs text-text-primary hover:border-accent/40 transition"
                        >
                          <span className="font-medium">{pack.label ?? pack.style}</span>
                          <span className="text-text-secondary/70">{pack.preset}</span>
                          <span className="text-accent">DPS →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-3 flex items-stretch gap-2 overflow-x-auto pb-1 sidebar-scroll">
                {BOSS_WORKSPACE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-pill ${
                      activeTab === tab.id ? "tab-pill--active" : "tab-pill--inactive"
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

              {/* Metric strip — desktop/tablet only; mobile skips straight to guide. */}
              <div className="mt-4 hidden gap-2 overflow-x-auto pb-1 sidebar-scroll sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4 sm:gap-3">
                <div className="min-w-[9.5rem] shrink-0 rounded-xl border border-border-subtle bg-bg-tertiary px-3 py-2.5 sm:min-w-0 sm:px-4 sm:py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Sections
                  </div>
                  <div className="mt-0.5 text-base font-semibold text-text-primary sm:text-lg">
                    {guide?.sections.length ?? 0}
                  </div>
                  <div className="mt-0.5 hidden text-xs text-text-secondary sm:block">
                    Strategy blocks in this workspace.
                  </div>
                </div>
                <div className="min-w-[9.5rem] shrink-0 rounded-xl border border-border-subtle bg-bg-tertiary px-3 py-2.5 sm:min-w-0 sm:px-4 sm:py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Drop groups
                  </div>
                  <div className="mt-0.5 text-base font-semibold text-text-primary sm:text-lg">
                    {dropCategoryCount ?? "\u2014"}
                  </div>
                  <div className="mt-0.5 hidden text-xs text-text-secondary sm:block">
                    {dropCategories.length > 0
                      ? "From the OSRS Wiki."
                      : bossLootTable
                        ? "Curated RuneWise data."
                        : dropCategoryCount != null
                          ? "Raid loot groups."
                          : "No loot groups yet."}
                  </div>
                </div>
                <div className="min-w-[9.5rem] shrink-0 rounded-xl border border-border-subtle bg-bg-tertiary px-3 py-2.5 sm:min-w-0 sm:px-4 sm:py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Tasks
                  </div>
                  <div className="mt-0.5 text-base font-semibold text-text-primary sm:text-lg">
                    {bossTasks.length}
                  </div>
                  <div className="mt-0.5 hidden text-xs text-text-secondary sm:block">
                    Boss-linked combat tasks.
                  </div>
                </div>
                <div className="min-w-[9.5rem] shrink-0 rounded-xl border border-border-subtle bg-bg-tertiary px-3 py-2.5 sm:min-w-0 sm:px-4 sm:py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                    Top drop
                  </div>
                  {topDrops[0] ? (
                    <>
                      <div className="mt-0.5 truncate text-sm font-semibold text-text-primary">
                        {topDrops[0].drop.name}
                      </div>
                      <div className="mt-0.5 text-xs text-success">
                        {topDrops[0].gePrice != null
                          ? formatGp(topDrops[0].gePrice)
                          : topDrops[0].drop.price || "\u2014"}
                      </div>
                    </>
                  ) : raidTopDrop ? (
                    <div className="mt-0.5 truncate text-sm font-semibold text-text-primary">
                      {raidTopDrop}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-base font-semibold text-text-primary sm:text-lg">
                      {"\u2014"}
                    </div>
                  )}
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

          {selectedBoss && !loading && activeTab === "guide" && guideError ? (
            <ErrorState
              title="Guide failed to load"
              error={guideError}
              onRetry={() => void selectBoss(selectedBoss)}
            />
          ) : null}

          {selectedBoss && !loading && activeTab === "guide" && !guideError && guide && guide.sections.length > 0 ? (
            <div>
              {BOSS_METADATA[selectedBoss.name] && (
                <div className="mb-4 hidden sm:block">
                  <BossMetaCard
                    meta={BOSS_METADATA[selectedBoss.name]}
                    combatLevel={selectedBoss.combatLevel}
                    hitpoints={selectedBoss.hitpoints}
                    maxHit={selectedBoss.maxHit}
                    weakness={selectedBoss.weakness}
                    hiscores={hiscores}
                  />
                </div>
              )}
            <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)] min-w-0 items-start">
              {/* Desktop sticky TOC — hierarchical, collapsible for long raids */}
              <aside className="hidden xl:block h-fit xl:sticky xl:top-6 max-h-[calc(100vh-4rem)] overflow-y-auto scroll-fade sidebar-scroll rounded-xl border border-border/30 bg-bg-primary/20 p-2">
                <div className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
                  Guide Sections
                </div>
                <div className="space-y-0.5">
                  {(() => {
                    const byId = new Map(guide.sections.map((s) => [s.id, s]));
                    const depthOf = (id: string): number => {
                      let d = 0;
                      let cur = byId.get(id);
                      while (cur?.parentId && byId.has(cur.parentId)) {
                        d += 1;
                        cur = byId.get(cur.parentId);
                      }
                      return d;
                    };
                    const descendantsOf = (rootId: string) =>
                      guide.sections.filter((s) => {
                        let cur = s;
                        while (cur.parentId) {
                          if (cur.parentId === rootId) return true;
                          const parent = byId.get(cur.parentId);
                          if (!parent) break;
                          cur = parent;
                        }
                        return false;
                      });
                    const roots = guide.sections.filter((s) => !s.parentId || !byId.has(s.parentId));
                    const claimed = new Set<string>();
                    roots.forEach((r) => {
                      claimed.add(r.id);
                      descendantsOf(r.id).forEach((d) => claimed.add(d.id));
                    });
                    const orphans = guide.sections.filter((s) => !claimed.has(s.id));
                    let h2Counter = 0;
                    return (
                      <>
                        {roots.map((section) => {
                          const isTop = !section.parentId || section.level === 2;
                          if (isTop) h2Counter += 1;
                          const kids = descendantsOf(section.id);
                          const active =
                            activeSectionId === section.id ||
                            kids.some((k) => k.id === activeSectionId);
                          const expanded =
                            tocExpanded[section.id] ??
                            (active || kids.length <= 6);
                          return (
                            <div key={section.id}>
                              <div className="flex items-stretch gap-0.5">
                                {kids.length > 0 ? (
                                  <button
                                    type="button"
                                    aria-label={expanded ? "Collapse" : "Expand"}
                                    onClick={() =>
                                      setTocExpanded((m) => ({
                                        ...m,
                                        [section.id]: !expanded,
                                      }))
                                    }
                                    className="flex w-6 shrink-0 items-center justify-center rounded-md text-text-secondary/50 hover:bg-bg-primary/60 hover:text-text-primary"
                                  >
                                    <span className="text-[10px]">{expanded ? "▾" : "▸"}</span>
                                  </button>
                                ) : (
                                  <span className="w-6 shrink-0" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    scrollToGuideSection(section.id);
                                    if (kids.length > 0) {
                                      setTocExpanded((m) => ({ ...m, [section.id]: true }));
                                    }
                                  }}
                                  aria-current={active ? "location" : undefined}
                                  className={`group flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left transition ${
                                    active
                                      ? "bg-accent/10 text-text-primary"
                                      : "text-text-secondary hover:bg-bg-primary/60 hover:text-text-primary"
                                  }`}
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-medium ${
                                      active
                                        ? "bg-accent/20 text-accent"
                                        : "bg-bg-tertiary/60 text-text-secondary/60"
                                    }`}
                                  >
                                    {h2Counter}
                                  </span>
                                  <span className="line-clamp-2 text-sm leading-snug">
                                    {section.title}
                                  </span>
                                  {kids.length > 0 ? (
                                    <span className="ml-auto shrink-0 text-[10px] text-text-secondary/40">
                                      {kids.length}
                                    </span>
                                  ) : null}
                                </button>
                              </div>
                              {expanded && kids.length > 0 ? (
                                <div className="ml-6 space-y-0.5 border-l border-border/30 pl-1">
                                  {kids.map((child) => {
                                    const childActive = activeSectionId === child.id;
                                    const nest = Math.min(depthOf(child.id), 3);
                                    const leaf = child.title.includes(" > ")
                                      ? child.title.slice(child.title.lastIndexOf(" > ") + 3)
                                      : child.title;
                                    return (
                                      <button
                                        key={child.id}
                                        type="button"
                                        onClick={() => scrollToGuideSection(child.id)}
                                        aria-current={childActive ? "location" : undefined}
                                        style={{ paddingLeft: `${0.5 + nest * 0.45}rem` }}
                                        className={`flex w-full items-center gap-2 rounded-lg py-1.5 pr-2.5 text-left transition ${
                                          childActive
                                            ? "bg-accent/10 text-text-primary"
                                            : "text-text-secondary/70 hover:bg-bg-primary/60 hover:text-text-primary"
                                        }`}
                                      >
                                        <span
                                          className={`h-1 w-1 shrink-0 rounded-full ${
                                            childActive ? "bg-accent" : "bg-text-secondary/30"
                                          }`}
                                        />
                                        <span className="line-clamp-2 text-xs leading-snug">
                                          {leaf}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        {orphans.map((section) => {
                          const active = activeSectionId === section.id;
                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => scrollToGuideSection(section.id)}
                              aria-current={active ? "location" : undefined}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 pl-8 text-left transition ${
                                active
                                  ? "bg-accent/10 text-text-primary"
                                  : "text-text-secondary/70 hover:bg-bg-primary/60 hover:text-text-primary"
                              }`}
                            >
                              <span className="line-clamp-2 text-xs leading-snug">
                                {section.title}
                              </span>
                            </button>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </aside>

              {/* Mobile horizontal section chips — sticky while reading guide */}
              <div className="xl:hidden -mx-1 px-1 overflow-x-auto sidebar-scroll sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm py-1.5 -mt-1 border-b border-border/30">
                <div className="flex gap-1.5 pb-0.5 min-w-max" data-guide-chips>
                  {guide.sections
                    .filter((s) => s.level === 2)
                    .map((section, i) => {
                      const active =
                        activeSectionId === section.id ||
                        guide.sections.some(
                          (s) =>
                            s.parentId === section.id && s.id === activeSectionId
                        );
                      return (
                      <button
                        key={section.id}
                        type="button"
                        data-section-id={section.id}
                        onClick={() => scrollToGuideSection(section.id)}
                        aria-current={active ? "location" : undefined}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
                          active
                            ? "border-accent/40 bg-accent/15 text-accent"
                            : "border-border/60 bg-bg-primary/55 text-text-secondary hover:border-accent/40 hover:text-text-primary"
                        }`}
                      >
                        <span className={`mr-1.5 ${active ? "text-accent/70" : "text-text-secondary/45"}`}>
                          {i + 1}
                        </span>
                        {section.title}
                      </button>
                      );
                    })}
                </div>
              </div>

              <div ref={guideContentRef} className="space-y-3 min-w-0" onClick={handleGuideClick}>
                {guide.sections.map((section) => {
                  // StructuredSection owns requirements / skills / equipment UX —
                  // hide the raw HTML twin so we never double-render. Inventory
                  // setups stay as article HTML (tabbed grids).
                  const structuredOnly =
                    /requirements|skills|equipment|gear setup/i.test(section.title) &&
                    !/inventory/i.test(section.title);
                  // Skip near-empty prose cards, but keep index parents that only
                  // exist so the TOC can group their children.
                  const textOnly = section.html
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                  const isIndexParent = guide.sections.some(
                    (s) => s.parentId === section.id
                  );
                  if (
                    !structuredOnly &&
                    textOnly.length < 24 &&
                    !isIndexParent
                  ) {
                    return null;
                  }
                  return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`rounded-xl border bg-bg-primary/25 min-w-0 overflow-hidden scroll-mt-4 transition-[border-color,box-shadow] ${
                      section.level === 3
                        ? "border-border/25 xl:ml-4 p-4"
                        : "border-border/40 p-4 sm:p-5"
                    } ${
                      activeSectionId === section.id
                        ? "border-accent/35 shadow-[inset_3px_0_0_0_var(--color-accent)]"
                        : ""
                    }`}
                  >
                    {section.level === 3 ? (
                      <h5 className="mb-3 text-sm font-semibold tracking-tight text-text-secondary">
                        {section.title}
                      </h5>
                    ) : (
                      <h4 className="mb-4 text-base font-semibold tracking-tight text-text-primary">
                        {section.title}
                      </h4>
                    )}
                    <StructuredSection title={section.title} html={section.html} bossSlug={normalizeBossSlug(selectedBoss.name)} />
                    {!structuredOnly ? (
                      section.html.includes('data-section-index') ? (
                        <p className="text-xs text-text-secondary/60">
                          Use the subsections in the guide menu for detailed strategies.
                        </p>
                      ) : (
                        <div
                          className={`article-content text-sm leading-7 text-text-secondary ${sectionContentClasses(section.title)}`.trim()}
                          dangerouslySetInnerHTML={{ __html: section.html }}
                        />
                      )
                    ) : null}
                  </section>
                  );
                })}
              </div>
            </div>
            </div>
          ) : null}

          {selectedBoss && !loading && activeTab === "guide" && guide && guide.sections.length === 0 ? (
            <EmptyState
              title="No guide content available"
              description="No structured strategy sections were found for this boss. Try the wiki page for the full source."
              action={{ label: "Open Wiki", onClick: () => openExternal(`https://oldschool.runescape.wiki/w/${selectedBoss.wikiPage}`) }}
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
                            className="w-28 rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
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
                          <thead className="sticky-thead">
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
                          <thead className="sticky-thead">
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
                    <thead className="sticky-thead">
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
              ) : raidLootFallback ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-text-secondary/60">
                    <span className="rounded-full border border-border bg-bg-primary/60 px-2 py-1">Source: curated</span>
                    <span>Drop rates from OSRS Wiki (approximate, party-size-variable)</span>
                  </div>
                  {raidLootFallback.uniques.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-2">Unique Drops</h4>
                      <div className="rounded-xl border border-border/60 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-text-secondary text-xs">
                              <th scope="col" className="text-left px-4 py-2">Item</th>
                              <th scope="col" className="text-right px-4 py-2">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {raidLootFallback.uniques.map((drop: RaidDropEntry) => (
                              <tr key={drop.name} className="border-b border-border/50 even:bg-bg-primary/25 hover:bg-bg-secondary">
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => navigate("market", { query: drop.name })}
                                    className="flex items-center gap-2 text-left text-text-primary transition hover:text-accent"
                                  >
                                    <WikiImage src={itemIcon(drop.name)} alt="" className="h-5 w-5 shrink-0" fallback={drop.name[0]} />
                                    <span>{drop.name}</span>
                                  </button>
                                </td>
                                <td className="px-4 py-2 text-right text-text-secondary num">{drop.rate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {raidLootFallback.common.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-2">Common Drops</h4>
                      <div className="flex flex-wrap gap-2">
                        {raidLootFallback.common.map((drop: RaidDropEntry) => (
                          <span key={drop.name} className="rounded-full border border-border bg-bg-primary/60 px-3 py-1 text-xs text-text-secondary">
                            {drop.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                                <Button
                                  size="xs"
                                  onClick={() => navigate("dps-calc", { monster: selectedBoss.name })}
                                  className="hover:border-accent/35"
                                >
                                  DPS
                                </Button>
                                <Button
                                  size="xs"
                                  onClick={() => setActiveTab("drops")}
                                  className="hover:border-accent/35"
                                >
                                  Drops
                                </Button>
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
