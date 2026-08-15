import { useEffect, useMemo, useState } from "react";
import { type HiscoreData, getSkillLevel } from "../../lib/api/hiscores";
import { fetchAllEquipment } from "../../lib/api/equipment";
import { fetchAllMonsters } from "../../lib/api/monsters";
import { useGEData } from "../../hooks/useGEData";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useNavigation } from "../../lib/NavigationContext";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import ItemTooltip from "../../components/ItemTooltip";
import AccountPrefillBanner from "../../components/AccountPrefillBanner";
import { Button, Card, FilterPills, StatCard, StatGrid } from "../../components/primitives";
import { accuracyTier, formatTtk, loadoutVerdict } from "./loadoutVerdict";
import {
  FINDER_TARGETS,
  COMMON_OWNED_CHIPS,
  findBudgetLoadouts,
  buildDpsInput,
  type LoadoutTarget,
  type RankedLoadout,
} from "./budgetLoadoutFinder";
import {
  findUpgradePathUnderBudget,
  type LeftoverUpgrade,
} from "./leftoverUpgrade";
import { optimizeAllStyles } from "./budgetOptimize";
import { parseBudgetInput } from "./parseBudget";
import { parseOwnedInventory } from "./parseOwnedInventory";
import { buildFinderTargetList, enrichTargetFromWiki } from "./wikiTargets";
import type { CombatStyle } from "../dps-calc/dpsTypes";

const BUDGETS: { id: string; label: string; gp: number }[] = [
  { id: "1m", label: "1M", gp: 1_000_000 },
  { id: "10m", label: "10M", gp: 10_000_000 },
  { id: "50m", label: "50M", gp: 50_000_000 },
  { id: "100m", label: "100M", gp: 100_000_000 },
  { id: "500m", label: "500M", gp: 500_000_000 },
  { id: "custom", label: "Custom", gp: -1 },
  { id: "any", label: "Any", gp: 0 },
];

type StyleFilter = "all" | CombatStyle;

const STYLE_PILLS: { id: StyleFilter; label: string }[] = [
  { id: "all", label: "All styles" },
  { id: "melee", label: "Melee" },
  { id: "ranged", label: "Ranged" },
  { id: "magic", label: "Magic" },
];

interface Props {
  hiscores: HiscoreData | null;
}

function styleBadgeClass(style: CombatStyle): string {
  if (style === "melee") return "text-danger bg-danger/10 border-danger/30";
  if (style === "ranged") return "text-success bg-success/10 border-success/30";
  return "text-accent bg-accent/10 border-accent/30";
}

function StyleBadge({ style }: { style: CombatStyle }) {
  return (
    <span className={`text-2xs uppercase tracking-wide px-1.5 py-0.5 rounded border ${styleBadgeClass(style)}`}>
      {style}
    </span>
  );
}

function AccuracyMeter({ accuracy }: { accuracy: number }) {
  const tier = accuracyTier(accuracy);
  const accColor =
    tier === "high" ? "text-success" : tier === "moderate" ? "text-warning" : "text-danger";
  const accLabel =
    tier === "high" ? "High accuracy" : tier === "moderate" ? "Moderate accuracy" : "Low accuracy";
  const accBar =
    tier === "high" ? "bg-success" : tier === "moderate" ? "bg-warning" : "bg-danger";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="section-kicker">{accLabel}</span>
        <span className={`num text-sm font-semibold ${accColor}`}>{(accuracy * 100).toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${accBar}`}
          style={{ width: `${Math.min(accuracy * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function GearStrip({ row }: { row: RankedLoadout }) {
  const slots = Object.entries(row.gear).filter(([, item]) => item != null);
  if (slots.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {slots.map(([slot, item]) =>
        item ? (
          <ItemTooltip key={slot} itemName={item.name}>
            <img
              src={itemIcon(item.name)}
              alt={item.name}
              title={`${slot}: ${item.name}`}
              className="w-7 h-7 rounded border border-border-subtle bg-bg-tertiary object-contain"
            />
          </ItemTooltip>
        ) : null
      )}
    </div>
  );
}

function UpgradePath({
  path,
  leftover,
  onApply,
}: {
  path: LeftoverUpgrade[];
  leftover: number;
  onApply?: () => void;
}) {
  if (path.length === 0 || leftover <= 0) return null;
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-2 text-xs space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wide text-accent/80">
          Upgrade path under leftover {formatGp(leftover)}
        </div>
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            className="text-[10px] font-medium text-accent hover:text-accent-hover"
          >
            Open path in DPS →
          </button>
        )}
      </div>
      {path.map((u, i) => (
        <div key={`${u.item.name}-${i}`} className="flex flex-wrap items-center gap-2 text-text-secondary">
          <span className="text-text-secondary/50 num w-3">{i + 1}.</span>
          <img src={itemIcon(u.item.name)} alt="" className="w-5 h-5 object-contain" />
          <span className="text-text-primary font-medium">{u.item.name}</span>
          <span className="text-text-secondary/60">({u.slot})</span>
          <span className="num text-accent">{formatGp(u.price)}</span>
          <span className="text-success">+{u.dpsGain.toFixed(2)} DPS</span>
        </div>
      ))}
    </div>
  );
}

export default function LoadoutFinder({ hiscores }: Props) {
  const { navigate } = useNavigation();
  const { mapping, prices, fetchIfNeeded, loading: geLoading } = useGEData();
  const {
    data: equipment,
    loading: equipLoading,
    error: equipError,
  } = useAsyncData(() => fetchAllEquipment(), []);
  const { data: wikiMonsters } = useAsyncData(() => fetchAllMonsters(), []);

  const [targetName, setTargetName] = useState(FINDER_TARGETS[0]!.name);
  const [monsterSearch, setMonsterSearch] = useState("");
  const [budgetId, setBudgetId] = useState("50m");
  const [customBudgetText, setCustomBudgetText] = useState("75m");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [customDef, setCustomDef] = useState(100);
  const [customDefBonus, setCustomDefBonus] = useState(0);
  const [customHp, setCustomHp] = useState(150);
  const [ownedChips, setOwnedChips] = useState<string[]>([]);
  const [ownedExtra, setOwnedExtra] = useState("");
  const [bankPaste, setBankPaste] = useState("");
  const [excludeText, setExcludeText] = useState("");
  const [onTask, setOnTask] = useState(false);

  useEffect(() => {
    void fetchIfNeeded();
  }, [fetchIfNeeded]);

  const priceByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of mapping) {
      const entry = prices[String(m.id)];
      const price = entry?.high ?? entry?.low;
      if (price != null && price > 0) map.set(m.name.toLowerCase(), price);
    }
    return map;
  }, [mapping, prices]);

  const targetList = useMemo(
    () => buildFinderTargetList(FINDER_TARGETS, wikiMonsters, monsterSearch),
    [wikiMonsters, monsterSearch]
  );

  const target: LoadoutTarget = useMemo(() => {
    const base =
      targetList.find((t) => t.name === targetName) ??
      FINDER_TARGETS.find((t) => t.name === targetName) ??
      FINDER_TARGETS[0]!;
    if (base.name === "Custom / Dummy") {
      return {
        ...base,
        defLevel: customDef,
        defBonus: customDefBonus,
        hp: customHp,
      };
    }
    // Re-enrich in case targetList is stale relative to wiki
    return enrichTargetFromWiki(base, wikiMonsters);
  }, [targetName, customDef, customDefBonus, customHp, targetList, wikiMonsters]);

  const budget = useMemo(() => {
    if (budgetId === "custom") {
      return parseBudgetInput(customBudgetText) ?? 0;
    }
    return BUDGETS.find((b) => b.id === budgetId)?.gp ?? 50_000_000;
  }, [budgetId, customBudgetText]);

  const priceOf = useMemo(
    () => (name: string) => priceByName.get(name.toLowerCase()) ?? null,
    [priceByName]
  );

  const bankOwned = useMemo(() => parseOwnedInventory(bankPaste), [bankPaste]);

  const ownedItems = useMemo(() => {
    const extra = ownedExtra
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return [...new Set([...ownedChips, ...extra, ...bankOwned])];
  }, [ownedChips, ownedExtra, bankOwned]);

  const excludeItems = useMemo(
    () =>
      excludeText
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [excludeText]
  );

  const toggleOwnedChip = (name: string) => {
    setOwnedChips((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const [useOptimizer, setUseOptimizer] = useState(true);

  const results = useMemo(() => {
    if (!equipment || equipment.length === 0) return [];
    const styles: CombatStyle[] | undefined =
      styleFilter === "all" ? undefined : [styleFilter];
    const shared = {
      equipment,
      priceOf,
      hiscores,
      target,
      budget,
      styles,
      ownedItems,
      excludeItems,
      onTask,
    };
    const presets = findBudgetLoadouts({
      ...shared,
      requirePriced: false,
      limit: 10,
    });
    if (!useOptimizer) return presets;
    const optimized = optimizeAllStyles(shared);
    // Merge: optimized first (dedupe by name), then presets by DPS
    const seen = new Set(optimized.map((r) => r.preset.name));
    const merged = [...optimized, ...presets.filter((p) => !seen.has(p.preset.name))];
    merged.sort((a, b) => b.dps - a.dps);
    return merged.slice(0, 12);
  }, [
    equipment,
    priceOf,
    hiscores,
    target,
    budget,
    styleFilter,
    useOptimizer,
    ownedItems,
    excludeItems,
    onTask,
  ]);

  /** Multi-step upgrade path under leftover cash for top setups (budget mode only). */
  const leftoverByPreset = useMemo(() => {
    const map = new Map<string, { path: LeftoverUpgrade[]; leftover: number }>();
    if (!equipment || budget <= 0) return map;
    for (const row of results.slice(0, 5)) {
      const leftover = Math.max(0, budget - row.totalCost);
      if (leftover <= 0) {
        map.set(row.preset.name, { path: [], leftover: 0 });
        continue;
      }
      const baseInput = buildDpsInput(row.style, row.gear, hiscores, target, {
        prayerName: row.preset.prayer,
        onTask,
      });
      const path = findUpgradePathUnderBudget({
        gear: row.gear,
        combatStyle: row.style,
        equipment,
        priceOf,
        remainingBudget: leftover,
        baseInput,
        meleeAttackType: baseInput.attackType ?? "slash",
        maxSteps: 3,
      });
      map.set(row.preset.name, { path, leftover });
    }
    return map;
  }, [results, equipment, budget, hiscores, target, priceOf, onTask]);

  const openPathInDps = (row: RankedLoadout, path: LeftoverUpgrade[]) => {
    const params: Record<string, string> = {
      preset: row.preset.name,
      style: row.style,
    };
    if (target.name !== "Custom / Dummy") params.monster = target.name;
    if (path[0]) {
      params.upgradeItem = path[0].item.name;
      params.upgradeSlot = path[0].slot;
    }
    // Encode full path as optional comma list for future steps
    if (path.length > 1) {
      params.upgradePath = path.map((u) => `${u.slot}:${u.item.name}`).join("|");
    }
    navigate("dps-calc", params);
  };

  const bestDps = results[0]?.dps ?? 0;
  const loading = equipLoading || (geLoading && mapping.length === 0);
  const isCustom = targetName === "Custom / Dummy";
  const hasEquipError = Boolean(equipError);

  const levelSummary = useMemo(() => {
    if (!hiscores) return "Levels: 99s (no hiscores — using defaults)";
    const get = (n: string) => {
      const level = getSkillLevel(hiscores, n, 0);
      return level > 0 ? level : "—";
    };
    return `Using your levels — Atk ${get("Attack")} · Str ${get("Strength")} · Ranged ${get("Ranged")} · Magic ${get("Magic")}`;
  }, [hiscores]);

  const openInDps = (row: RankedLoadout) => {
    const params: Record<string, string> = {
      style: row.style,
    };
    // Named presets deep-link by name; optimized / custom gear is JSON-encoded
    // so DPS can equip every slot reliably (upgradePath alone was flaky on name match).
    if (!row.preset.name.startsWith("Optimized ")) {
      params.preset = row.preset.name;
    }
    const gearSlots: Record<string, string> = {};
    for (const [slot, item] of Object.entries(row.gear)) {
      if (item?.name) gearSlots[slot] = item.name;
    }
    if (Object.keys(gearSlots).length > 0) {
      params.gear = JSON.stringify(gearSlots);
    }
    if (row.prayerName) params.prayer = row.prayerName;
    if (target.name !== "Custom / Dummy") {
      params.monster = target.name;
    }
    navigate("dps-calc", params);
  };

  const pick = results[0] ?? null;
  const alts = results.slice(1);
  const leftover = pick ? leftoverByPreset.get(pick.preset.name) : undefined;
  const verdictLine = pick
    ? loadoutVerdict({
        pick: {
          name: pick.preset.name,
          style: pick.style,
          dps: pick.dps,
          ttk: pick.ttk,
          accuracy: pick.accuracy,
          cost: pick.totalCost,
        },
        others: alts.map((row) => ({
          name: row.preset.name,
          style: row.style,
          dps: row.dps,
        })),
        targetName: target.name === "Custom / Dummy" ? null : target.name,
      })
    : null;

  return (
    <div className="max-w-5xl">
      <AccountPrefillBanner
        hasHiscores={Boolean(hiscores)}
        context="Combat levels from your hiscores for accurate DPS ranking"
      />

      <div className="mb-4">
        <h2 className="text-h3 font-semibold">Budget Loadout Finder</h2>
        <p className="text-sm text-text-secondary mt-1">
          Monster + budget → one setup to wear. Live GE prices, your levels.
        </p>
        <p className="text-xs text-text-secondary/80 mt-1">{levelSummary}</p>
      </div>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-[3fr_2fr] gap-6 items-start">
      <div className="space-y-4">
      <Card kicker="Inputs">
        <div className="space-y-4 p-1">
          <div>
            <label className="text-2xs uppercase tracking-wide text-text-secondary/80 block mb-1.5">
              Target
            </label>
            <input
              type="search"
              value={monsterSearch}
              onChange={(e) => setMonsterSearch(e.target.value)}
              placeholder="Search wiki NPCs…"
              aria-label="Search monsters"
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-sm mb-1.5"
            />
            <select
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm"
              value={targetList.some((t) => t.name === targetName) ? targetName : targetList[0]?.name}
              onChange={(e) => setTargetName(e.target.value)}
            >
              {targetList.map((t) => {
                const defHint =
                  t.defStab != null
                    ? ` · S/L/C ${t.defStab}/${t.defSlash ?? "—"}/${t.defCrush ?? "—"}`
                    : "";
                return (
                  <option key={t.name} value={t.name}>
                    {t.name} (def {t.defLevel}
                    {defHint}, hp {t.hp})
                  </option>
                );
              })}
            </select>
            {wikiMonsters && wikiMonsters.length > 0 && (
              <p className="text-2xs text-text-secondary/70 mt-1">
                Live wiki multi-def when matched · {wikiMonsters.length.toLocaleString()} NPCs loaded
              </p>
            )}
          </div>

          {isCustom && (
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs space-y-1">
                <span className="text-text-secondary">Def level</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={customDef}
                  onChange={(e) => setCustomDef(Number(e.target.value) || 1)}
                  className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-sm num"
                />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-text-secondary">Def bonus</span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={customDefBonus}
                  onChange={(e) => setCustomDefBonus(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-sm num"
                />
              </label>
              <label className="text-xs space-y-1">
                <span className="text-text-secondary">HP</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={customHp}
                  onChange={(e) => setCustomHp(Number(e.target.value) || 1)}
                  className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-sm num"
                />
              </label>
            </div>
          )}

          <div>
            <label className="text-2xs uppercase tracking-wide text-text-secondary/80 block mb-1.5">
              Budget (GE buy)
            </label>
            <FilterPills
              ariaLabel="Budget"
              activeKey={budgetId}
              onChange={setBudgetId}
              items={BUDGETS.map((b) => ({ id: b.id, label: b.label }))}
            />
            {budgetId === "custom" && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={customBudgetText}
                  onChange={(e) => setCustomBudgetText(e.target.value)}
                  placeholder="e.g. 75m, 1.5b, 250k"
                  aria-label="Custom budget"
                  className="w-40 rounded-lg border border-border bg-bg-primary px-2.5 py-1.5 text-sm num"
                />
                <span className="text-xs text-text-secondary">
                  {budget > 0 ? `= ${formatGp(budget)}` : "Enter amount (k / m / b)"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-2xs uppercase tracking-wide text-text-secondary/80 block mb-1.5">
              Style
            </label>
            <FilterPills
              ariaLabel="Combat style"
              activeKey={styleFilter}
              onChange={setStyleFilter}
              items={STYLE_PILLS}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={useOptimizer}
              onChange={(e) => setUseOptimizer(e.target.checked)}
              className="rounded border-border"
            />
            Combinatorial BiS under budget (GearScape-class search)
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={onTask}
              onChange={(e) => setOnTask(e.target.checked)}
              className="rounded border-border"
            />
            On-task (slayer helm / black mask when worn)
          </label>

          <div>
            <label className="text-2xs uppercase tracking-wide text-text-secondary/80 block mb-1.5">
              I already own (free / 0 gp)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_OWNED_CHIPS.map((name) => {
                const on = ownedChips.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleOwnedChip(name)}
                    className={`text-2xs px-2 py-1 rounded-full border transition-colors ${
                      on
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border-subtle bg-bg-primary/40 text-text-secondary hover:border-border"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={ownedExtra}
              onChange={(e) => setOwnedExtra(e.target.value)}
              placeholder="More items, comma-separated…"
              aria-label="Additional owned items"
              className="w-full rounded-lg border border-border bg-bg-primary px-2.5 py-1.5 text-sm"
            />
            <label className="text-2xs uppercase tracking-wide text-text-secondary/80 block mt-2 mb-1">
              Paste bank / inventory dump
            </label>
            <textarea
              value={bankPaste}
              onChange={(e) => setBankPaste(e.target.value)}
              placeholder={
                "One item per line, CSV, JSON array, or RuneLite dump\n3 x Abyssal whip\nFire cape"
              }
              aria-label="Bank dump paste"
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-primary px-2.5 py-1.5 text-xs font-mono"
            />
            {bankOwned.length > 0 && (
              <p className="text-2xs text-success mt-1">
                Parsed {bankOwned.length} owned item{bankOwned.length === 1 ? "" : "s"} from paste
                {ownedItems.length > bankOwned.length
                  ? ` · ${ownedItems.length} total free`
                  : ""}
              </p>
            )}
          </div>

          <div>
            <label className="text-2xs uppercase tracking-wide text-text-secondary/80 block mb-1.5">
              Exclude items
            </label>
            <input
              type="text"
              value={excludeText}
              onChange={(e) => setExcludeText(e.target.value)}
              placeholder="e.g. Scythe of vitur, Tumeken's shadow"
              aria-label="Excluded items"
              className="w-full rounded-lg border border-border bg-bg-primary px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>
      </Card>

      <p className="text-2xs text-text-secondary/70 leading-relaxed">
        Combinatorial BiS under budget, then curated presets as backups. Missing GE prices are
        skipped on a capped budget — mark them owned or set Any. Presets still assume fire cape /
        torso / defenders. Open the pick in DPS to tweak prayers and modifiers.
      </p>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
        {hasEquipError && (
          <Card kicker="Pick">
            <p className="text-sm text-danger">Could not load equipment data. Try again later.</p>
          </Card>
        )}
        {loading && !hasEquipError && (
          <Card kicker="Pick" elevation="hero">
            <div className="space-y-3 py-1">
              <div className="animate-pulse bg-bg-tertiary/50 h-16 rounded-xl" />
              <div className="animate-pulse bg-bg-tertiary/50 h-10 rounded-xl" />
              <div className="animate-pulse bg-bg-tertiary/50 h-24 rounded-xl" />
            </div>
          </Card>
        )}
        {!loading && !hasEquipError && !pick && (
          <Card kicker="Pick">
            <p className="text-sm text-text-secondary py-2">
              No setup fits this budget and style. Raise the budget or switch style.
            </p>
          </Card>
        )}
        {!loading && pick && verdictLine && (
          <Card
            elevation="hero"
            kicker={target.name}
            action={
              <span className="text-xs text-text-secondary">
                {budget > 0 ? `≤ ${formatGp(budget)}` : "no cap"}
              </span>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{pick.preset.name}</h3>
                  <StyleBadge style={pick.style} />
                </div>
                <Button variant="primary" size="sm" onClick={() => openInDps(pick)}>
                  Open in DPS
                </Button>
              </div>

              <div className="flex items-end justify-between gap-4 border-b border-border-subtle pb-4">
                <div>
                  <div className="hero-metric text-accent-bright">{pick.dps.toFixed(2)}</div>
                  <div className="section-kicker mt-1">damage / second</div>
                </div>
                <div className="text-right">
                  <div className="num text-h3 font-semibold text-text-primary">
                    {formatTtk(pick.ttk)}
                  </div>
                  <div className="section-kicker">time to kill</div>
                </div>
              </div>

              <p className="text-sm leading-6 text-text-secondary">{verdictLine}</p>

              <AccuracyMeter accuracy={pick.accuracy} />

              <StatGrid columns={2}>
                <StatCard label="Max Hit" value={pick.maxHit} />
                <StatCard
                  label="Cost"
                  value={
                    pick.totalCost > 0
                      ? formatGp(pick.totalCost)
                      : pick.unpricedCount > 0
                        ? "Unpriced"
                        : "Free"
                  }
                  suffix={
                    pick.totalCost > 0 && pick.unpricedCount > 0 ? "GE tradeables" : undefined
                  }
                />
              </StatGrid>

              {(pick.prayerName && pick.prayerName !== "None") || pick.spellName ? (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-secondary">
                  {pick.prayerName && pick.prayerName !== "None" && (
                    <span>
                      <span className="text-text-secondary/60">Prayer </span>
                      <span className="text-text-primary">{pick.prayerName}</span>
                    </span>
                  )}
                  {pick.spellName && (
                    <span>
                      <span className="text-text-secondary/60">Spell </span>
                      <span className="text-text-primary">{pick.spellName}</span>
                    </span>
                  )}
                </div>
              ) : null}

              <GearStrip row={pick} />

              {pick.missingItems.length > 0 && (
                <p className="text-2xs text-warning/90">
                  Missing wiki match: {pick.missingItems.slice(0, 4).join(", ")}
                  {pick.missingItems.length > 4 ? "…" : ""}
                </p>
              )}

              {leftover && (
                <UpgradePath
                  path={leftover.path}
                  leftover={leftover.leftover}
                  onApply={
                    leftover.path.length > 0
                      ? () => openPathInDps(pick, leftover.path)
                      : undefined
                  }
                />
              )}
            </div>
          </Card>
        )}

        {!loading && alts.length > 0 && (
          <Card kicker="Also ranked">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-text-secondary">
                  <th className="text-left px-1 py-1.5 font-medium">Setup</th>
                  <th className="text-right px-1 py-1.5 font-medium">DPS</th>
                  <th className="text-right px-1 py-1.5 font-medium">Δ</th>
                  <th className="text-right px-1 py-1.5 font-medium">Cost</th>
                  <th className="px-1 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {alts.map((row) => {
                  const delta = bestDps > 0 ? (row.dps / bestDps - 1) * 100 : 0;
                  return (
                    <tr key={row.preset.name} className="border-b border-border/20 last:border-0">
                      <td className="px-1 py-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{row.preset.name}</span>
                          <StyleBadge style={row.style} />
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-right num text-accent">{row.dps.toFixed(2)}</td>
                      <td className="px-1 py-1.5 text-right num text-xs text-text-secondary">
                        {delta > -0.5 ? "tied" : `${delta.toFixed(0)}%`}
                      </td>
                      <td className="px-1 py-1.5 text-right num text-text-secondary">
                        {row.totalCost > 0 ? formatGp(row.totalCost) : "—"}
                      </td>
                      <td className="px-1 py-1.5 text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => openInDps(row)}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
