import { useMemo, useState } from "react";
import { fetchAllEquipment, type WikiEquipment } from "../../../lib/api/equipment";
import { itemIcon } from "../../../lib/sprites";
import ItemTooltip from "../../../components/ItemTooltip";
import { useGEData } from "../../../hooks/useGEData";
import { formatGp } from "../../../lib/format";
import { Button, Card, DeltaBadge } from "../../../components/primitives";
import { findUpgrades, rankUpgradesForDisplay, type UpgradeSort } from "../upgradeFinder";
import type { DpsState, EquippedGear } from "../hooks/useDpsState";

interface UpgradeFinderProps {
  state: DpsState;
}

const SLOT_LABELS: Record<string, string> = {
  weapon: "Weapon",
  head: "Head",
  cape: "Cape",
  neck: "Neck",
  ammo: "Ammo",
  shield: "Shield",
  body: "Body",
  legs: "Legs",
  hands: "Hands",
  feet: "Feet",
  ring: "Ring",
};

export default function UpgradeFinder({ state }: UpgradeFinderProps) {
  const { dpsInput, equippedGear, setEquippedGear, combatStyle, stance, bonusMode } = state;
  const [enabled, setEnabled] = useState(false);
  const [equipment, setEquipment] = useState<WikiEquipment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [sortMode, setSortMode] = useState<UpgradeSort>("dps");
  const { mapping, prices, fetchIfNeeded } = useGEData();

  const enable = () => {
    setEnabled(true);
    void fetchIfNeeded();
    if (equipment) return;
    setLoading(true);
    setLoadError(false);
    fetchAllEquipment()
      .then(setEquipment)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // GE price by lowercase item name — untradeables simply won't match.
  const priceByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of mapping) {
      const entry = prices[String(m.id)];
      const price = entry?.high ?? entry?.low;
      if (price != null) map.set(m.name.toLowerCase(), price);
    }
    return map;
  }, [mapping, prices]);

  const slotResults = useMemo(() => {
    if (!enabled || !equipment) return null;
    return findUpgrades({
      baseInput: dpsInput,
      gear: equippedGear,
      equipment,
      combatStyle,
      meleeAttackType: stance.attackType,
      stanceSpeedMod: stance.speedMod,
      // Fetch a deeper pool so value-sorting has candidates to reorder.
      perSlot: 8,
    });
  }, [enabled, equipment, dpsInput, equippedGear, combatStyle, stance.attackType, stance.speedMod]);

  // Cross-slot heroes: top raw DPS pick and best gp-per-DPS among priced upgrades.
  // Must run before any early return so hooks stay unconditional.
  const heroPicks = useMemo(() => {
    if (!slotResults) return null;
    type Pick = {
      slot: string;
      item: WikiEquipment;
      dpsGain: number;
      dpsGainPct: number;
      price?: number;
    };
    let bestDps: Pick | null = null;
    let bestValue: Pick | null = null;
    for (const { slot, upgrades } of slotResults) {
      for (const u of upgrades) {
        const price = priceByName.get(u.item.name.toLowerCase());
        const pick: Pick = {
          slot: SLOT_LABELS[slot] ?? slot,
          item: u.item,
          dpsGain: u.dpsGain,
          dpsGainPct: u.dpsGainPct,
          price,
        };
        if (!bestDps || u.dpsGain > bestDps.dpsGain) bestDps = pick;
        if (price != null && u.dpsGain > 0) {
          const value = price / u.dpsGain;
          if (!bestValue || value < (bestValue.price! / bestValue.dpsGain)) {
            bestValue = pick;
          }
        }
      }
    }
    return { bestDps, bestValue };
  }, [slotResults, priceByName]);

  if (bonusMode !== "equipment") return null;

  const priceLookup = (name: string) => priceByName.get(name.toLowerCase());
  const withUpgrades = slotResults?.filter((s) => s.upgrades.length > 0) ?? [];
  const maxedSlots = slotResults?.filter((s) => s.upgrades.length === 0) ?? [];
  const visibleSlots = showAllSlots ? withUpgrades : withUpgrades.slice(0, 4);

  return (
    <Card
      kicker="Upgrade Finder"
      action={
        enabled ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1" role="group" aria-label="Upgrade sort order">
              {([["dps", "Top DPS"], ["value", "Best value"]] as const).map(([mode, label]) => (
                <Button
                  key={mode}
                  size="xs"
                  variant={sortMode === mode ? "primary" : "secondary"}
                  onClick={() => setSortMode(mode)}
                  aria-pressed={sortMode === mode}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Button size="xs" variant="ghost" onClick={() => setEnabled(false)}>
              Hide
            </Button>
          </div>
        ) : undefined
      }
    >

      {!enabled ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">
            Scan every item against this target and rank each slot by real DPS gained —
            then jump straight to the single best upgrade or best gp-per-DPS pick.
          </p>
          <Button variant="primary" onClick={enable} className="shrink-0">
            Find upgrades
          </Button>
        </div>
      ) : loadError ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-text-secondary">
          <span>Couldn&apos;t load the equipment catalog. Check your connection.</span>
          <Button size="xs" onClick={enable} className="shrink-0">
            Retry
          </Button>
        </div>
      ) : loading || !slotResults ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-bg-tertiary/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {withUpgrades.length === 0 ? (
            <div className="py-3 text-center text-sm text-success">
              Nothing beats this setup — every scanned slot is best in slot.
            </div>
          ) : (
            <>
            {heroPicks?.bestDps && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-xl border border-accent/25 bg-accent/8 px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-accent/80">
                    Top DPS upgrade · {heroPicks.bestDps.slot}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-text-primary truncate">
                    {heroPicks.bestDps.item.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <DeltaBadge
                      delta={heroPicks.bestDps.dpsGain}
                      pct={heroPicks.bestDps.dpsGainPct}
                      title="DPS gained"
                    />
                    {heroPicks.bestDps.price != null && (
                      <span className="text-text-secondary/60 num">
                        {formatGp(heroPicks.bestDps.price)} gp
                      </span>
                    )}
                  </div>
                </div>
                {heroPicks.bestValue && (
                  <div className="rounded-xl border border-border-subtle bg-bg-tertiary/60 px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
                      Best value · {heroPicks.bestValue.slot}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-text-primary truncate">
                      {heroPicks.bestValue.item.name}
                    </div>
                    <div className="mt-0.5 text-xs text-text-secondary num">
                      {formatGp(Math.round(heroPicks.bestValue.price! / heroPicks.bestValue.dpsGain))}
                      /dps
                      <span className="text-text-secondary/50">
                        {" "}
                        · +{heroPicks.bestValue.dpsGain.toFixed(2)} dps
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {visibleSlots.map(({ slot, current, upgrades }) => (
              <div key={slot}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary/50">
                    {SLOT_LABELS[slot] ?? slot}
                  </span>
                  <span className="text-[10px] text-text-secondary/40 truncate max-w-[55%]">
                    {current ? `now: ${current.name}` : "empty"}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {rankUpgradesForDisplay(upgrades, priceLookup, sortMode).map(({ item, dpsGain, dpsGainPct }) => {
                    const price = priceByName.get(item.name.toLowerCase());
                    return (
                    <div
                      key={`${item.name}:${item.version ?? ""}`}
                      className="flex items-center gap-2 rounded-lg bg-bg-tertiary/40 border border-border/20 px-2 py-1.5"
                    >
                      <img
                        src={itemIcon(item.version ? `${item.name}_${item.version}` : item.name)}
                        alt=""
                        className="w-5 h-5 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = itemIcon(item.name);
                        }}
                      />
                      <ItemTooltip itemName={item.name}>
                        <span className="flex-1 min-w-0 truncate text-xs text-text-primary cursor-default">
                          {item.name}
                          {item.version && (
                            <span className="text-text-secondary/50 ml-1 text-[10px]">({item.version})</span>
                          )}
                          {price != null && (
                            <span className="text-text-secondary/50 ml-1.5 text-[10px] num">
                              {formatGp(price)} gp
                              {sortMode === "value" && dpsGain > 0 && (
                                <span className="text-text-secondary/40"> · {formatGp(Math.round(price / dpsGain))}/dps</span>
                              )}
                            </span>
                          )}
                        </span>
                      </ItemTooltip>
                      <DeltaBadge delta={dpsGain} pct={dpsGainPct} className="shrink-0" title="DPS gained" />
                      <Button
                        size="xs"
                        onClick={() =>
                          setEquippedGear((prev: EquippedGear) => {
                            const next = { ...prev };
                            if (slot === "weapon") {
                              // Weapon candidates may be 1h or 2h; a 2h evicts the shield.
                              delete next.weapon;
                              delete next["2h"];
                              if (item.slot === "2h") {
                                delete next.shield;
                                next["2h"] = item;
                              } else {
                                next.weapon = item;
                              }
                            } else {
                              next[slot] = item;
                            }
                            return next;
                          })
                        }
                        className="shrink-0 bg-accent/10 text-accent border-transparent hover:bg-accent/20 hover:text-accent"
                      >
                        Equip
                      </Button>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
            </>
          )}

          {withUpgrades.length > 4 && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setShowAllSlots((v) => !v)}
              className="text-accent hover:text-accent-hover"
            >
              {showAllSlots ? "Show fewer slots" : `Show ${withUpgrades.length - 4} more slots`}
            </Button>
          )}

          {maxedSlots.length > 0 && withUpgrades.length > 0 && (
            <div className="text-[10px] text-text-secondary/50">
              <span className="text-success">✓ Best in slot:</span>{" "}
              {maxedSlots.map((s) => SLOT_LABELS[s.slot] ?? s.slot).join(", ")}
            </div>
          )}

          <p className="text-[10px] text-text-secondary/40">
            Ranked against the current target with your stance and prayer held fixed. Only
            weapons with verified attack speeds are ranked; weapon-bound passives (Twisted bow,
            dragonbane, …) follow the candidate, not your toggles. A 2h candidate gives up your
            shield; a 1h replacing a 2h is ranked without one.
          </p>
        </div>
      )}
    </Card>
  );
}
