import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  calculateDps,
  DPS_MODIFIERS,
  type DpsModifier,
} from "../../lib/formulas/dps";
import { PRAYERS, type Prayer } from "../../lib/data/prayers";
import { MONSTERS } from "../../lib/data/monsters";
import { fetchAllMonsters, type WikiMonster } from "../../lib/api/monsters";
import { type HiscoreData } from "../../lib/api/hiscores";
import { type WikiEquipment, type EquipmentSlot } from "../../lib/api/equipment";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { useNavigation } from "../../lib/NavigationContext";
import { itemIcon } from "../../lib/sprites";
import MonsterSearch from "./components/MonsterSearch";
import ModifierToggles from "./components/ModifierToggles";
import DpsBreakdown from "./components/DpsBreakdown";
import GearSelector from "./GearSelector";

type CombatStyle = "melee" | "ranged" | "magic";
type BonusMode = "equipment" | "manual";

const GEAR_SLOTS: Array<{ slot: EquipmentSlot | "2h"; label: string }> = [
  { slot: "head", label: "Head" },
  { slot: "cape", label: "Cape" },
  { slot: "neck", label: "Neck" },
  { slot: "ammo", label: "Ammo" },
  { slot: "weapon", label: "Weapon" },
  { slot: "body", label: "Body" },
  { slot: "shield", label: "Shield" },
  { slot: "legs", label: "Legs" },
  { slot: "hands", label: "Hands" },
  { slot: "feet", label: "Feet" },
  { slot: "ring", label: "Ring" },
];

type EquippedGear = Partial<Record<EquipmentSlot | "2h", WikiEquipment>>;

function sumGearBonuses(gear: EquippedGear): {
  attackBonus: number;
  strengthBonus: number;
  attackSpeed: number;
  rangedBonus: number;
  rangedStrength: number;
  magicBonus: number;
  magicDamage: number;
  prayer: number;
} {
  const items = Object.values(gear).filter(Boolean) as WikiEquipment[];
  return {
    attackBonus: items.reduce((s, i) => s + i.attackStab + i.attackSlash + i.attackCrush, 0),
    strengthBonus: items.reduce((s, i) => s + i.strengthBonus, 0),
    attackSpeed: 0, // speed comes from weapon directly
    rangedBonus: items.reduce((s, i) => s + i.attackRanged, 0),
    rangedStrength: items.reduce((s, i) => s + i.rangedStrength, 0),
    magicBonus: items.reduce((s, i) => s + i.attackMagic, 0),
    magicDamage: items.reduce((s, i) => s + i.magicDamage, 0),
    prayer: items.reduce((s, i) => s + i.prayerBonus, 0),
  };
}

interface GearLoadout {
  name: string;
  combatStyle: CombatStyle;
  stanceIdx: number;
  prayerIdx: number;
  attackBonus: number;
  strengthBonus: number;
  attackSpeed: number;
  modifiers: string[];
}

const LOADOUTS_KEY = "runewise_dps_loadouts";

interface Stance {
  label: string;
  attackBonus: number;
  strengthBonus: number;
}

const STANCES: Record<CombatStyle, Stance[]> = {
  melee: [
    { label: "Accurate", attackBonus: 3, strengthBonus: 0 },
    { label: "Aggressive", attackBonus: 0, strengthBonus: 3 },
    { label: "Controlled", attackBonus: 1, strengthBonus: 1 },
    { label: "Defensive", attackBonus: 0, strengthBonus: 0 },
  ],
  ranged: [
    { label: "Accurate", attackBonus: 3, strengthBonus: 0 },
    { label: "Rapid", attackBonus: 0, strengthBonus: 0 },
    { label: "Longrange", attackBonus: 0, strengthBonus: 0 },
  ],
  magic: [
    { label: "Accurate", attackBonus: 3, strengthBonus: 0 },
    { label: "Longrange", attackBonus: 0, strengthBonus: 0 },
  ],
};

const DEFAULT_SPEED: Record<CombatStyle, number> = {
  melee: 4,
  ranged: 5,
  magic: 5,
};

function getDefBonus(m: WikiMonster, style: CombatStyle): number {
  if (style === "ranged") return m.defRanged;
  if (style === "magic") return m.defMagic;
  return Math.min(m.defStab, m.defSlash, m.defCrush);
}

function getSkillLevel(hiscores: HiscoreData | null, name: string): number {
  if (!hiscores) return 99;
  return (
    hiscores.skills.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    )?.level ?? 99
  );
}

interface Props {
  hiscores: HiscoreData | null;
}

export default function DpsCalculator({ hiscores }: Props) {
  const { params } = useNavigation();
  const [combatStyle, setCombatStyle] = useState<CombatStyle>("melee");
  const [attackLevel, setAttackLevel] = useState(99);
  const [strengthLevel, setStrengthLevel] = useState(99);
  const [rangedLevel, setRangedLevel] = useState(99);
  const [magicLevel, setMagicLevel] = useState(99);
  const [attackBonus, setAttackBonus] = useState(0);
  const [strengthBonus, setStrengthBonus] = useState(0);
  const [attackSpeed, setAttackSpeed] = useState(DEFAULT_SPEED.melee);
  const [stanceIdx, setStanceIdx] = useState(0);
  const [prayerIdx, setPrayerIdx] = useState(0);
  const [selectedMonster, setSelectedMonster] = useState<WikiMonster | null>(null);
  const [customDef, setCustomDef] = useState({ defLevel: 1, defBonus: 0, hp: 100 });
  const [activeModifiers, setActiveModifiers] = useState<Set<string>>(new Set());
  const [wikiMonsters, setWikiMonsters] = useState<WikiMonster[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [loadouts, setLoadouts] = useState<GearLoadout[]>(() =>
    loadJSON(LOADOUTS_KEY, [])
  );
  const [loadoutName, setLoadoutName] = useState("");
  const pendingLoadout = useRef<GearLoadout | null>(null);

  // Gear selector state
  const [bonusMode, setBonusMode] = useState<BonusMode>("equipment");
  const [equippedGear, setEquippedGear] = useState<EquippedGear>({});
  const [openSlot, setOpenSlot] = useState<EquipmentSlot | "2h" | null>(null);

  // Load wiki monsters
  useEffect(() => {
    fetchAllMonsters().then(setWikiMonsters);
  }, []);

  // Sync hiscores stats
  useEffect(() => {
    if (hiscores) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external hiscores data
      setAttackLevel(getSkillLevel(hiscores, "Attack"));
      setStrengthLevel(getSkillLevel(hiscores, "Strength"));
      setRangedLevel(getSkillLevel(hiscores, "Ranged"));
      setMagicLevel(getSkillLevel(hiscores, "Magic"));
    }
  }, [hiscores]);

  // Handle monster param from cross-nav
  useEffect(() => {
    if (!params.monster || wikiMonsters.length === 0) return;
    const match = wikiMonsters.find(
      (m) => m.name.toLowerCase() === params.monster?.toLowerCase()
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync target from URL params
    if (match) setSelectedMonster(match);
    else {
      // Fallback to old static monsters
      const staticMatch = MONSTERS.find(
        (m) => m.name.toLowerCase() === params.monster?.toLowerCase()
      );
      if (staticMatch && staticMatch.name !== "Custom target") {
        setSelectedMonster({
          name: staticMatch.name,
          version: null,
          combatLevel: 0,
          hitpoints: staticMatch.hp,
          maxHit: 0,
          attackSpeed: 0,
          attackStyles: [],
          attackLevel: 0,
          strengthLevel: 0,
          defenceLevel: staticMatch.defLevel,
          magicLevel: 0,
          rangedLevel: 0,
          slayerLevel: 0,
          slayerXp: 0,
          defStab: staticMatch.defStab,
          defSlash: staticMatch.defSlash,
          defCrush: staticMatch.defCrush,
          defMagic: staticMatch.defMagic,
          defRanged: staticMatch.defRanged,
          attackBonus: 0,
          strengthBonus: 0,
          magicAttackBonus: 0,
          rangedAttackBonus: 0,
          magicDamageBonus: 0,
          image: null,
          examine: null,
        });
      }
    }
  }, [params.monster, wikiMonsters]);

  // Reset stance and prayer when combat style changes, or apply pending loadout
  useEffect(() => {
    const loadout = pendingLoadout.current;
    if (loadout && loadout.combatStyle === combatStyle) {
      pendingLoadout.current = null;
      setStanceIdx(loadout.stanceIdx);
      setPrayerIdx(loadout.prayerIdx);
      setAttackBonus(loadout.attackBonus);
      setStrengthBonus(loadout.strengthBonus);
      setAttackSpeed(loadout.attackSpeed);
      setActiveModifiers(new Set(loadout.modifiers));
    } else {
      setStanceIdx(0);
      setPrayerIdx(0);
      setAttackSpeed(DEFAULT_SPEED[combatStyle]);
      setActiveModifiers(new Set());
    }
  }, [combatStyle]);

  // Compute effective bonuses depending on mode
  const gearBonuses = useMemo(() => sumGearBonuses(equippedGear), [equippedGear]);
  const effectiveAttackBonus = bonusMode === "equipment"
    ? (combatStyle === "ranged" ? gearBonuses.rangedBonus : combatStyle === "magic" ? gearBonuses.magicBonus : gearBonuses.attackBonus)
    : attackBonus;
  const effectiveStrengthBonus = bonusMode === "equipment"
    ? (combatStyle === "ranged" ? gearBonuses.rangedStrength : combatStyle === "magic" ? gearBonuses.magicDamage : gearBonuses.strengthBonus)
    : strengthBonus;
  // Weapon attack speed from equipped weapon slot
  const weaponItem = equippedGear["weapon"] ?? equippedGear["2h"] ?? null;
  const effectiveAttackSpeed = bonusMode === "equipment" && weaponItem
    ? attackSpeed // speed is still manual; weapon data doesn't carry tick speed in WikiEquipment
    : attackSpeed;

  const stances = STANCES[combatStyle];
  const stance = stances[stanceIdx] ?? stances[0];
  const filteredPrayers = useMemo(
    () => PRAYERS.filter((p) => p.style === combatStyle),
    [combatStyle]
  );
  const prayer: Prayer = filteredPrayers[prayerIdx] ?? filteredPrayers[0];

  const isCustom = !selectedMonster;
  const targetDefLevel = isCustom
    ? customDef.defLevel
    : selectedMonster.defenceLevel;
  const targetDefBonus = isCustom
    ? customDef.defBonus
    : getDefBonus(selectedMonster, combatStyle);
  const targetHp = isCustom ? customDef.hp : selectedMonster.hitpoints;

  const modifierList = useMemo<DpsModifier[]>(
    () =>
      [...activeModifiers]
        .map((id) => DPS_MODIFIERS[id])
        .filter((m): m is DpsModifier => m != null),
    [activeModifiers]
  );

  const result = useMemo(
    () =>
      calculateDps({
        attackLevel,
        strengthLevel,
        rangedLevel,
        magicLevel,
        attackBonus: effectiveAttackBonus,
        strengthBonus: effectiveStrengthBonus,
        prayerAttackMult: prayer.attackMult,
        prayerStrengthMult: prayer.strengthMult,
        stanceAttackBonus: stance.attackBonus,
        stanceStrengthBonus: stance.strengthBonus,
        attackSpeed: effectiveAttackSpeed,
        combatStyle,
        targetDefLevel,
        targetDefBonus,
        targetHp,
        targetMagicLevel: selectedMonster?.magicLevel,
        modifiers: modifierList,
      }),
    [
      attackLevel,
      strengthLevel,
      rangedLevel,
      magicLevel,
      effectiveAttackBonus,
      effectiveStrengthBonus,
      prayer,
      stance,
      effectiveAttackSpeed,
      combatStyle,
      targetDefLevel,
      targetDefBonus,
      targetHp,
      selectedMonster?.magicLevel,
      modifierList,
    ]
  );

  const toggleModifier = useCallback((id: string) => {
    setActiveModifiers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const saveLoadout = useCallback(() => {
    const name = loadoutName.trim();
    if (!name) return;
    const loadout: GearLoadout = {
      name,
      combatStyle,
      stanceIdx,
      prayerIdx,
      attackBonus,
      strengthBonus,
      attackSpeed,
      modifiers: [...activeModifiers],
    };
    setLoadouts((prev) => {
      const next = prev.filter((l) => l.name !== name);
      next.push(loadout);
      saveJSON(LOADOUTS_KEY, next);
      return next;
    });
    setLoadoutName("");
  }, [loadoutName, combatStyle, stanceIdx, prayerIdx, attackBonus, strengthBonus, attackSpeed, activeModifiers]);

  const applyLoadout = useCallback((loadout: GearLoadout) => {
    if (loadout.combatStyle === combatStyle) {
      // Same style — apply directly, no effect needed
      setStanceIdx(loadout.stanceIdx);
      setPrayerIdx(loadout.prayerIdx);
      setAttackBonus(loadout.attackBonus);
      setStrengthBonus(loadout.strengthBonus);
      setAttackSpeed(loadout.attackSpeed);
      setActiveModifiers(new Set(loadout.modifiers));
    } else {
      // Different style — stash loadout and let the combatStyle effect apply it
      pendingLoadout.current = loadout;
      setCombatStyle(loadout.combatStyle);
    }
  }, [combatStyle]);

  const deleteLoadout = useCallback((name: string) => {
    setLoadouts((prev) => {
      const next = prev.filter((l) => l.name !== name);
      saveJSON(LOADOUTS_KEY, next);
      return next;
    });
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-5">DPS Calculator</h2>

      <div className="space-y-5">
        {/* Combat Style */}
        <div className="flex gap-2">
          {(["melee", "ranged", "magic"] as const).map((style) => (
            <button
              key={style}
              onClick={() => setCombatStyle(style)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                combatStyle === style
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Loadout Presets */}
        <div>
          <div className="section-kicker mb-3">Loadouts</div>
          {loadouts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {loadouts.map((l) => (
                <div
                  key={l.name}
                  className="flex items-center gap-1 bg-bg-secondary border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => applyLoadout(l)}
                    className="px-3 py-1.5 text-xs font-medium hover:bg-bg-tertiary transition-colors"
                  >
                    {l.name}
                    <span className="ml-1.5 text-text-secondary/50 capitalize">
                      {l.combatStyle}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteLoadout(l.name)}
                    className="px-1.5 py-1.5 text-text-secondary/40 hover:text-danger text-xs transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={loadoutName}
              onChange={(e) => setLoadoutName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveLoadout()}
              placeholder="Loadout name..."
              className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              onClick={saveLoadout}
              disabled={!loadoutName.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>

        {/* Stats + Equipment side by side */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="section-kicker mb-3">Player Stats</div>
            <div className="space-y-2">
              {combatStyle === "melee" && (
                <>
                  <StatInput label="Attack" value={attackLevel} onChange={setAttackLevel} />
                  <StatInput label="Strength" value={strengthLevel} onChange={setStrengthLevel} />
                </>
              )}
              {combatStyle === "ranged" && (
                <StatInput label="Ranged" value={rangedLevel} onChange={setRangedLevel} />
              )}
              {combatStyle === "magic" && (
                <StatInput label="Magic" value={magicLevel} onChange={setMagicLevel} />
              )}
            </div>
            {hiscores && (
              <p className="text-[10px] text-text-secondary/50 mt-2">
                Auto-loaded from Hiscores
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="section-kicker">Equipment Bonuses</div>
              <div className="flex gap-1">
                {(["equipment", "manual"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setBonusMode(m)}
                    className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                      bonusMode === m
                        ? "bg-accent text-white"
                        : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {bonusMode === "equipment" ? (
              <div>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {GEAR_SLOTS.map(({ slot, label }) => {
                    const equipped = equippedGear[slot];
                    return (
                      <button
                        key={slot}
                        onClick={() => setOpenSlot(slot)}
                        title={equipped?.name ?? label}
                        className={`flex flex-col items-center justify-center gap-0.5 p-1.5 rounded border transition-colors text-center ${
                          equipped
                            ? "border-accent/40 bg-accent/8 hover:bg-accent/15"
                            : "border-border bg-bg-secondary hover:bg-bg-tertiary"
                        }`}
                      >
                        {equipped ? (
                          <img
                            src={itemIcon(equipped.version ? `${equipped.name}_${equipped.version}` : equipped.name)}
                            alt={equipped.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = itemIcon(equipped.name);
                            }}
                          />
                        ) : (
                          <span className="w-6 h-6 flex items-center justify-center text-[10px] text-text-secondary/30">
                            +
                          </span>
                        )}
                        <span className="text-[9px] text-text-secondary/60 leading-none truncate w-full text-center">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[10px] text-text-secondary/50 space-y-0.5">
                  {combatStyle === "melee" && (
                    <>
                      <div>Atk: <span className={effectiveAttackBonus >= 0 ? "text-success" : "text-danger"}>{effectiveAttackBonus >= 0 ? "+" : ""}{effectiveAttackBonus}</span></div>
                      <div>Str: <span className="text-success">+{effectiveStrengthBonus}</span></div>
                    </>
                  )}
                  {combatStyle === "ranged" && (
                    <>
                      <div>Rng Atk: <span className={effectiveAttackBonus >= 0 ? "text-success" : "text-danger"}>{effectiveAttackBonus >= 0 ? "+" : ""}{effectiveAttackBonus}</span></div>
                      <div>Rng Str: <span className="text-success">+{effectiveStrengthBonus}</span></div>
                    </>
                  )}
                  {combatStyle === "magic" && (
                    <>
                      <div>Mag Atk: <span className={effectiveAttackBonus >= 0 ? "text-success" : "text-danger"}>{effectiveAttackBonus >= 0 ? "+" : ""}{effectiveAttackBonus}</span></div>
                      <div>Mag Dmg: <span className="text-success">+{effectiveStrengthBonus}%</span></div>
                    </>
                  )}
                  <div>Prayer: <span className="text-accent">+{gearBonuses.prayer}</span></div>
                </div>
                <StatInput label="Atk speed" value={attackSpeed} onChange={setAttackSpeed} min={1} max={12} suffix="ticks" />
              </div>
            ) : (
              <div className="space-y-2">
                <StatInput label="Attack bonus" value={attackBonus} onChange={setAttackBonus} min={-64} max={300} />
                <StatInput label="Strength bonus" value={strengthBonus} onChange={setStrengthBonus} min={0} max={300} />
                <StatInput label="Attack speed" value={attackSpeed} onChange={setAttackSpeed} min={1} max={12} suffix="ticks" />
              </div>
            )}
          </div>
        </div>

        {/* Gear selector modal */}
        {openSlot !== null && (
          <GearSelector
            slot={openSlot}
            onSelect={(item) => {
              if (item === null) {
                setEquippedGear((prev) => {
                  const next = { ...prev };
                  delete next[openSlot];
                  return next;
                });
              } else {
                setEquippedGear((prev) => ({ ...prev, [openSlot]: item }));
              }
              setOpenSlot(null);
            }}
            onClose={() => setOpenSlot(null)}
          />
        )}

        {/* Prayer + Stance */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="section-kicker mb-3">Prayer</div>
            <select
              value={prayerIdx}
              onChange={(e) => setPrayerIdx(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            >
              {filteredPrayers.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                  {p.attackMult > 1 || p.strengthMult > 1
                    ? ` (+${Math.round((p.attackMult - 1) * 100)}% atk, +${Math.round((p.strengthMult - 1) * 100)}% str)`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="section-kicker mb-3">Stance</div>
            <select
              value={stanceIdx}
              onChange={(e) => setStanceIdx(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            >
              {stances.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                  {s.attackBonus > 0 ? ` (+${s.attackBonus} atk)` : ""}
                  {s.strengthBonus > 0 ? ` (+${s.strengthBonus} str)` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modifiers */}
        <div>
          <div className="section-kicker mb-3">Modifiers</div>
          <ModifierToggles
            activeIds={activeModifiers}
            onToggle={toggleModifier}
            combatStyle={combatStyle}
          />
        </div>

        {/* Target */}
        <div>
          <div className="section-kicker mb-3">Target</div>
          <MonsterSearch
            monsters={wikiMonsters}
            selected={selectedMonster}
            onSelect={setSelectedMonster}
            combatStyle={combatStyle}
          />

          {isCustom && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <StatInput
                label="Def level"
                value={customDef.defLevel}
                onChange={(v) => setCustomDef((p) => ({ ...p, defLevel: v }))}
                min={1}
                max={500}
              />
              <StatInput
                label="Def bonus"
                value={customDef.defBonus}
                onChange={(v) => setCustomDef((p) => ({ ...p, defBonus: v }))}
                min={-100}
                max={500}
              />
              <StatInput
                label="HP"
                value={customDef.hp}
                onChange={(v) => setCustomDef((p) => ({ ...p, hp: v }))}
                min={1}
                max={10000}
              />
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-kicker">Results</div>
            <button
              onClick={() => setShowBreakdown((p) => !p)}
              className="text-xs text-text-secondary hover:text-accent transition-colors"
            >
              {showBreakdown ? "Hide" : "Show"} breakdown
            </button>
          </div>
          <DpsBreakdown
            maxHit={result.maxHit}
            accuracy={result.accuracy}
            dps={result.dps}
            ttk={result.ttk}
            attackRoll={result.attackRoll}
            defenseRoll={result.defenseRoll}
          />
        </div>
      </div>
    </div>
  );
}

function StatInput({
  label,
  value,
  onChange,
  min = 1,
  max = 99,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-28 text-sm text-text-secondary shrink-0">
        {label}
      </label>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) =>
            onChange(Math.max(min, Math.min(max, Number(e.target.value))))
          }
          className="w-full bg-bg-tertiary border border-border rounded px-3 py-1.5 text-sm tabular-nums"
        />
        {suffix && (
          <span className="text-xs text-text-secondary shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
