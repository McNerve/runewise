import { useEffect, useMemo, useState } from "react";
import type { HiscoreData } from "../../lib/api/hiscores";
import { fetchAllEquipment } from "../../lib/api/equipment";
import { useGEData } from "../../hooks/useGEData";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useNavigation } from "../../lib/NavigationContext";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import ItemTooltip from "../../components/ItemTooltip";
import AccountPrefillBanner from "../../components/AccountPrefillBanner";
import { Button, Card, FilterPills, StatCard, StatGrid } from "../../components/primitives";
import {
  FINDER_TARGETS,
  findBudgetLoadouts,
  buildDpsInput,
  type LoadoutTarget,
  type RankedLoadout,
} from "./budgetLoadoutFinder";
import {
  findUpgradePathUnderBudget,
  type LeftoverUpgrade,
} from "./leftoverUpgrade";
import type { CombatStyle } from "../dps-calc/dpsTypes";

const BUDGETS: { id: string; label: string; gp: number }[] = [
  { id: "1m", label: "1M", gp: 1_000_000 },
  { id: "10m", label: "10M", gp: 10_000_000 },
  { id: "50m", label: "50M", gp: 50_000_000 },
  { id: "100m", label: "100M", gp: 100_000_000 },
  { id: "500m", label: "500M", gp: 500_000_000 },
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

function ResultRow({
  rank,
  row,
  bestDps,
  onOpen,
  upgradePath,
  leftover,
  onApplyPath,
}: {
  rank: number;
  row: RankedLoadout;
  bestDps: number;
  onOpen: () => void;
  upgradePath?: LeftoverUpgrade[];
  leftover?: number;
  onApplyPath?: () => void;
}) {
  const pctOfBest = bestDps > 0 ? (row.dps / bestDps) * 100 : 0;
  const slotEntries = Object.entries(row.gear).filter(([, item]) => item != null);
  const lowAcc = row.accuracy > 0 && row.accuracy < 0.4;

  return (
    <li className="rounded-xl border border-border-subtle bg-bg-primary/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-secondary/70 text-xs num tabular-nums w-5">#{rank}</span>
            <h3 className="font-semibold text-sm sm:text-base truncate">{row.preset.name}</h3>
            <span
              className={`text-2xs uppercase tracking-wide px-1.5 py-0.5 rounded border ${styleBadgeClass(row.style)}`}
            >
              {row.style}
            </span>
            {lowAcc && (
              <span className="text-2xs px-1.5 py-0.5 rounded border border-warning/40 bg-warning/10 text-warning">
                Low accuracy
              </span>
            )}
          </div>
          {row.preset.description && (
            <p className="text-xs text-text-secondary">{row.preset.description}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-secondary">
            <span>
              <span className="text-text-secondary/60">DPS </span>
              <span className="num text-text-primary font-medium">{row.dps.toFixed(2)}</span>
              {rank > 1 && bestDps > 0 && (
                <span className="text-text-secondary/50"> ({pctOfBest.toFixed(0)}% of #1)</span>
              )}
            </span>
            <span>
              <span className="text-text-secondary/60">Max </span>
              <span className="num">{row.maxHit}</span>
            </span>
            <span>
              <span className="text-text-secondary/60">Acc </span>
              <span className={`num ${lowAcc ? "text-warning" : ""}`}>
                {(row.accuracy * 100).toFixed(1)}%
              </span>
            </span>
            <span>
              <span className="text-text-secondary/60">TTK </span>
              <span className="num">{row.ttk > 0 ? `${row.ttk.toFixed(1)}s` : "—"}</span>
            </span>
            <span>
              <span className="text-text-secondary/60">Cost </span>
              <span className="num text-accent">
                {row.totalCost > 0 ? formatGp(row.totalCost) : "—"}
              </span>
              {row.unpricedCount > 0 && row.totalCost > 0 && (
                <span className="text-text-secondary/50"> (GE tradeables)</span>
              )}
              {row.unpricedCount > 0 && row.totalCost === 0 && (
                <span className="text-text-secondary/50"> (untradeables)</span>
              )}
            </span>
          </div>
          {lowAcc && (
            <p className="text-2xs text-warning/90">
              Levels or better gear will help more than raising budget alone.
            </p>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={onOpen}>
          Open in DPS
        </Button>
      </div>

      {slotEntries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {slotEntries.map(([slot, item]) =>
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
      )}

      {row.missingItems.length > 0 && (
        <p className="mt-2 text-2xs text-warning/90">
          Missing wiki match: {row.missingItems.slice(0, 4).join(", ")}
          {row.missingItems.length > 4 ? "…" : ""}
        </p>
      )}

      {upgradePath && upgradePath.length > 0 && leftover != null && leftover > 0 && (
        <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-2 text-xs space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-wide text-accent/80">
              Upgrade path under leftover {formatGp(leftover)}
            </div>
            {onApplyPath && (
              <button
                type="button"
                onClick={onApplyPath}
                className="text-[10px] font-medium text-accent hover:text-accent-hover"
              >
                Open path in DPS →
              </button>
            )}
          </div>
          {upgradePath.map((u, i) => (
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
      )}
    </li>
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

  const [targetName, setTargetName] = useState(FINDER_TARGETS[0]!.name);
  const [budgetId, setBudgetId] = useState("50m");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [customDef, setCustomDef] = useState(100);
  const [customDefBonus, setCustomDefBonus] = useState(0);
  const [customHp, setCustomHp] = useState(150);

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

  const target: LoadoutTarget = useMemo(() => {
    const base = FINDER_TARGETS.find((t) => t.name === targetName) ?? FINDER_TARGETS[0]!;
    if (base.name === "Custom / Dummy") {
      return {
        ...base,
        defLevel: customDef,
        defBonus: customDefBonus,
        hp: customHp,
      };
    }
    return base;
  }, [targetName, customDef, customDefBonus, customHp]);

  const budget = BUDGETS.find((b) => b.id === budgetId)?.gp ?? 50_000_000;

  const priceOf = useMemo(
    () => (name: string) => priceByName.get(name.toLowerCase()) ?? null,
    [priceByName]
  );

  const results = useMemo(() => {
    if (!equipment || equipment.length === 0) return [];
    const styles: CombatStyle[] | undefined =
      styleFilter === "all" ? undefined : [styleFilter];
    return findBudgetLoadouts({
      equipment,
      priceOf,
      hiscores,
      target,
      budget,
      styles,
      requirePriced: false,
      limit: 10,
    });
  }, [equipment, priceOf, hiscores, target, budget, styleFilter]);

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
      const baseInput = buildDpsInput(
        row.style,
        row.gear,
        hiscores,
        target,
        row.preset.prayer
      );
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
  }, [results, equipment, budget, hiscores, target, priceOf]);

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
    const get = (n: string) =>
      hiscores.skills.find((s) => s.name.toLowerCase() === n.toLowerCase())?.level ?? "—";
    return `Using your levels — Atk ${get("Attack")} · Str ${get("Strength")} · Ranged ${get("Ranged")} · Magic ${get("Magic")}`;
  }, [hiscores]);

  const openInDps = (row: RankedLoadout) => {
    const params: Record<string, string> = {
      preset: row.preset.name,
      style: row.style,
    };
    if (target.name !== "Custom / Dummy") {
      params.monster = target.name;
    }
    navigate("dps-calc", params);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <AccountPrefillBanner
        hasHiscores={Boolean(hiscores)}
        context="Combat levels from your hiscores for accurate DPS ranking"
      />

      <div>
        <h2 className="text-h3 font-semibold">Budget Loadout Finder</h2>
        <p className="text-sm text-text-secondary mt-1">
          Pick a monster and budget — rank full gear presets by DPS with live GE prices.
        </p>
        <p className="text-xs text-text-secondary/80 mt-1">{levelSummary}</p>
      </div>

      <Card kicker="Inputs" elevation="hero">
        <div className="space-y-4 p-1">
          <div>
            <label className="text-2xs uppercase tracking-wide text-text-secondary/80 block mb-1.5">
              Target
            </label>
            <select
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
            >
              {FINDER_TARGETS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} (def {t.defLevel}, hp {t.hp})
                </option>
              ))}
            </select>
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
        </div>
      </Card>

      {!loading && results.length > 0 && (
        <StatGrid columns={3}>
          <StatCard label="Best DPS" value={bestDps.toFixed(2)} />
          <StatCard
            label="Best cost"
            value={results[0]!.totalCost > 0 ? formatGp(results[0]!.totalCost) : "—"}
          />
          <StatCard label="Setups" value={String(results.length)} />
        </StatGrid>
      )}

      <Card
        kicker="Ranked setups"
        action={
          loading ? (
            <span className="text-xs text-text-secondary">Loading gear & prices…</span>
          ) : (
            <span className="text-xs text-text-secondary">
              vs {target.name}
              {budget > 0 ? ` · ≤ ${formatGp(budget)}` : " · no budget cap"}
            </span>
          )
        }
      >
        {hasEquipError && (
          <p className="text-sm text-danger p-2">Could not load equipment data. Try again later.</p>
        )}
        {loading && !hasEquipError && (
          <div className="space-y-2 py-2">
            <div className="animate-pulse bg-bg-tertiary/50 h-16 rounded-xl" />
            <div className="animate-pulse bg-bg-tertiary/50 h-16 rounded-xl" />
            <div className="animate-pulse bg-bg-tertiary/50 h-16 rounded-xl" />
          </div>
        )}
        {!loading && !hasEquipError && results.length === 0 && (
          <p className="text-sm text-text-secondary py-4 text-center">
            No presets fit this budget and style. Raise the budget or switch style.
          </p>
        )}
        {!loading && results.length > 0 && (
          <ol className="space-y-2 list-none p-0 m-0">
            {results.map((row, i) => {
              const lo = leftoverByPreset.get(row.preset.name);
              return (
                <ResultRow
                  key={row.preset.name}
                  rank={i + 1}
                  row={row}
                  bestDps={bestDps}
                  onOpen={() => openInDps(row)}
                  upgradePath={lo?.path}
                  leftover={lo?.leftover}
                  onApplyPath={
                    lo?.path?.length
                      ? () => openPathInDps(row, lo.path)
                      : undefined
                  }
                />
              );
            })}
          </ol>
        )}
      </Card>

      <p className="text-2xs text-text-secondary/70 leading-relaxed">
        Ranks curated gear presets (not a full combinatorial search). Untradeables (torso, fire cape,
        defenders, etc.) are treated as free. Open a setup in the DPS calculator to tweak gear,
        prayers, and modifiers.
      </p>
    </div>
  );
}
