import { useMemo, useState } from "react";
import { fetchAllEquipment, type WikiEquipment } from "../../../lib/api/equipment";
import { itemIcon } from "../../../lib/sprites";
import ItemTooltip from "../../../components/ItemTooltip";
import { useGEData } from "../../../hooks/useGEData";
import { formatGp } from "../../../lib/format";
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
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [sortMode, setSortMode] = useState<UpgradeSort>("dps");
  const { mapping, prices, fetchIfNeeded } = useGEData();

  const enable = () => {
    setEnabled(true);
    void fetchIfNeeded();
    if (equipment) return;
    setLoading(true);
    fetchAllEquipment()
      .then(setEquipment)
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

  if (bonusMode !== "equipment") return null;

  const priceLookup = (name: string) => priceByName.get(name.toLowerCase());
  const withUpgrades = slotResults?.filter((s) => s.upgrades.length > 0) ?? [];
  const maxedSlots = slotResults?.filter((s) => s.upgrades.length === 0) ?? [];
  const visibleSlots = showAllSlots ? withUpgrades : withUpgrades.slice(0, 4);

  return (
    <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-4">
      <div className="flex items-center justify-between">
        <div className="section-kicker">Upgrade Finder</div>
        {enabled && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1" role="group" aria-label="Upgrade sort order">
              {([["dps", "Top DPS"], ["value", "Best value"]] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  aria-pressed={sortMode === mode}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    sortMode === mode
                      ? "bg-accent text-on-accent border-accent"
                      : "bg-bg-tertiary text-text-secondary border-transparent hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEnabled(false)}
              className="text-[10px] text-text-secondary/50 hover:text-text-primary transition-colors"
            >
              Hide
            </button>
          </div>
        )}
      </div>

      {!enabled ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">
            Scan every item against this target and rank each slot by real DPS gained.
          </p>
          <button
            onClick={enable}
            className="shrink-0 px-3 py-1.5 text-xs font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors"
          >
            Find upgrades
          </button>
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
            visibleSlots.map(({ slot, current, upgrades }) => (
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
                            <span className="text-text-secondary/50 ml-1.5 text-[10px] tabular-nums">
                              {formatGp(price)} gp
                              {sortMode === "value" && dpsGain > 0 && (
                                <span className="text-text-secondary/40"> · {formatGp(Math.round(price / dpsGain))}/dps</span>
                              )}
                            </span>
                          )}
                        </span>
                      </ItemTooltip>
                      <span className="shrink-0 text-[11px] tabular-nums text-success">
                        +{dpsGain.toFixed(2)} <span className="text-success/60">({dpsGainPct >= 0 ? "+" : ""}{dpsGainPct.toFixed(1)}%)</span>
                      </span>
                      <button
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
                        className="shrink-0 text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                      >
                        Equip
                      </button>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {withUpgrades.length > 4 && (
            <button
              onClick={() => setShowAllSlots((v) => !v)}
              className="text-[10px] text-accent hover:text-accent-hover transition-colors"
            >
              {showAllSlots ? "Show fewer slots" : `Show ${withUpgrades.length - 4} more slots`}
            </button>
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
    </div>
  );
}
