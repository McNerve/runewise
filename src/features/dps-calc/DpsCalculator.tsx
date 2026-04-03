import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  calculateDps,
  DPS_MODIFIERS,
  type DpsModifier,
} from "../../lib/formulas/dps";
import { PRAYERS, type Prayer } from "../../lib/data/prayers";
import { MONSTERS } from "../../lib/data/monsters";
import { fetchAllMonsters, type WikiMonster } from "../../lib/api/monsters";
import { fetchAllEquipment } from "../../lib/api/equipment";
import { type HiscoreData } from "../../lib/api/hiscores";
import { type WikiEquipment, type EquipmentSlot } from "../../lib/api/equipment";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { useNavigation } from "../../lib/NavigationContext";
import { itemIcon } from "../../lib/sprites";
import { getWeaponType, type WeaponStance } from "../../lib/data/weapon-stances";
import { GEAR_PRESETS, type GearPreset } from "../../lib/data/gear-presets";
import MonsterSearch from "./components/MonsterSearch";
import ModifierToggles from "./components/ModifierToggles";
import DpsBreakdown from "./components/DpsBreakdown";
import GearSelector from "./GearSelector";

type CombatStyle = "melee" | "ranged" | "magic";
type BonusMode = "equipment" | "manual";


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
  bonusMode?: BonusMode;
  gear?: Record<string, WikiEquipment>;
}

const LOADOUTS_KEY = "runewise_dps_loadouts";

// Fallback generic stances when no weapon is equipped
const GENERIC_STANCES: Record<CombatStyle, WeaponStance[]> = {
  melee: getWeaponType("Slash Sword").stances,
  ranged: getWeaponType("Bow").stances,
  magic: getWeaponType("Staff").stances,
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
  const { params, navigate } = useNavigation();
  const [combatStyle, setCombatStyle] = useState<CombatStyle>("melee");
  const [defReductions, setDefReductions] = useState(0);
  const [poisonType, setPoisonType] = useState<"none" | "poison" | "venom">("none");
  const [showRaidScaling, setShowRaidScaling] = useState(false);
  const [toaInvocation, setToaInvocation] = useState(0);
  const [coxPartySize, setCoxPartySize] = useState(1);
  const [attackLevel, setAttackLevel] = useState(99);
  const [strengthLevel, setStrengthLevel] = useState(99);
  const [rangedLevel, setRangedLevel] = useState(99);
  const [magicLevel, setMagicLevel] = useState(99);
  const [attackBonus, setAttackBonus] = useState(0);
  const [strengthBonus, setStrengthBonus] = useState(0);
  const [attackSpeed, setAttackSpeed] = useState(DEFAULT_SPEED.melee);
  const [stanceIdx, setStanceIdx] = useState(0);
  const [activeLoadout, setActiveLoadout] = useState<string | null>(null);
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

  const [allEquipment, setAllEquipment] = useState<WikiEquipment[]>([]);

  // Load wiki data
  useEffect(() => {
    fetchAllMonsters().then(setWikiMonsters);
    fetchAllEquipment().then(setAllEquipment);
  }, []);

  const applyPreset = useCallback((preset: GearPreset) => {
    setCombatStyle(preset.style);
    setBonusMode("equipment");
    setActiveLoadout(preset.name);
    const gear: EquippedGear = {};
    for (const [slot, itemName] of Object.entries(preset.slots)) {
      if (!itemName) continue;
      const match = allEquipment.find(
        (e) => e.name.toLowerCase() === itemName.toLowerCase()
      );
      if (match) gear[slot as EquipmentSlot | "2h"] = match;
    }
    setEquippedGear(gear);
    if (preset.prayer) {
      const stylePrayers = PRAYERS.filter((p) => p.style === preset.style);
      const pIdx = stylePrayers.findIndex((p) => p.name === preset.prayer);
      if (pIdx >= 0) setPrayerIdx(pIdx);
    }
    setStanceIdx(0);
  }, [allEquipment]);

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
  // Get weapon-specific stances from equipped weapon's combat_style
  const weaponItem = equippedGear["weapon"] ?? equippedGear["2h"] ?? null;
  const weaponCombatStyle = weaponItem?.combatStyle ?? undefined;
  const weaponType = getWeaponType(weaponCombatStyle);
  const stances = bonusMode === "equipment" && weaponCombatStyle
    ? weaponType.stances
    : GENERIC_STANCES[combatStyle];
  const stance = stances[stanceIdx] ?? stances[0];

  // Weapon attack speed — auto from equipped weapon, fallback to manual
  const weaponSpeed = weaponItem?.attackSpeed ?? 0;
  const effectiveAttackSpeed = bonusMode === "equipment" && weaponSpeed > 0
    ? weaponSpeed + (stance.speedMod ?? 0)
    : attackSpeed;
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

  /* eslint-disable react-hooks/preserve-manual-memoization */
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
        defReductions,
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
      defReductions,
    ]
  );
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const toggleModifier = useCallback((id: string) => { // eslint-disable-line react-hooks/preserve-manual-memoization
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

  const saveLoadout = useCallback(() => { // eslint-disable-line react-hooks/preserve-manual-memoization
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
      bonusMode,
      gear: bonusMode === "equipment" ? { ...equippedGear } as Record<string, WikiEquipment> : undefined,
    };
    setLoadouts((prev) => {
      const next = prev.filter((l) => l.name !== name);
      next.push(loadout);
      saveJSON(LOADOUTS_KEY, next);
      return next;
    });
    setLoadoutName("");
    // eslint-disable-next-line react-hooks/preserve-manual-memoization, react-hooks/exhaustive-deps
  }, [loadoutName, combatStyle, stanceIdx, prayerIdx, attackBonus, strengthBonus, attackSpeed, activeModifiers]);

  const applyLoadout = useCallback((loadout: GearLoadout) => {
    const apply = () => {
      setStanceIdx(loadout.stanceIdx);
      setPrayerIdx(loadout.prayerIdx);
      setAttackBonus(loadout.attackBonus);
      setStrengthBonus(loadout.strengthBonus);
      setAttackSpeed(loadout.attackSpeed);
      setActiveModifiers(new Set(loadout.modifiers));
      if (loadout.bonusMode) setBonusMode(loadout.bonusMode);
      if (loadout.gear) setEquippedGear(loadout.gear as EquippedGear);
    };
    if (loadout.combatStyle === combatStyle) {
      apply();
    } else {
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

  // Inline until poisonDps is exported from formulas/dps.ts
  const poisonDpsValue = useMemo(() => {
    if (poisonType === "none") return 0;
    // Poison: starts at 6 damage, ticks every 18 seconds (30 ticks)
    // Venom: starts at 6, increases by 2 each tick, ticks every 18 seconds
    if (poisonType === "poison") return 6 / (18); // ~0.33 DPS
    return 8 / (18); // Venom starts at 6, averages higher ~0.44 DPS
  }, [poisonType]);

  const totalDps = result.dps + poisonDpsValue;

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
              aria-pressed={combatStyle === style}
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

        {/* Gear Presets + Loadouts */}
        <div className="space-y-3">
          {/* Preset templates */}
          <div>
            <div className="section-kicker mb-2">Gear Presets</div>
            <div className="flex gap-2">
              <select
                value=""
                onChange={(e) => {
                  const preset = GEAR_PRESETS.find((p) => p.name === e.target.value);
                  if (preset) applyPreset(preset);
                }}
                className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="">Load a preset...</option>
                <optgroup label="Melee">
                  {GEAR_PRESETS.filter((p) => p.style === "melee").map((p) => (
                    <option key={p.name} value={p.name}>{p.name} — {p.description}</option>
                  ))}
                </optgroup>
                <optgroup label="Ranged">
                  {GEAR_PRESETS.filter((p) => p.style === "ranged").map((p) => (
                    <option key={p.name} value={p.name}>{p.name} — {p.description}</option>
                  ))}
                </optgroup>
                <optgroup label="Magic">
                  {GEAR_PRESETS.filter((p) => p.style === "magic").map((p) => (
                    <option key={p.name} value={p.name}>{p.name} — {p.description}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Saved loadouts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="section-kicker">Saved Loadouts</div>
              <button
                onClick={() => {
                  setEquippedGear({});
                  setActiveModifiers(new Set());
                  setStanceIdx(0);
                  setPrayerIdx(0);
                  setAttackBonus(0);
                  setStrengthBonus(0);
                  setDefReductions(0);
                  setPoisonType("none");
                  setActiveLoadout(null);
                }}
                className="text-[10px] text-text-secondary/40 hover:text-danger transition-colors"
              >
                Clear
              </button>
            </div>
            {loadouts.length > 0 && (
              <div className="flex gap-2 mb-2">
                <select
                  value={activeLoadout ?? ""}
                  onChange={(e) => {
                    const l = loadouts.find((lo) => lo.name === e.target.value);
                    if (l) { applyLoadout(l); setActiveLoadout(l.name); }
                  }}
                  className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="">Select loadout...</option>
                  {loadouts.map((l) => (
                    <option key={l.name} value={l.name}>{l.name} ({l.combatStyle})</option>
                  ))}
                </select>
                {activeLoadout && (
                  <button
                    onClick={() => {
                      if (activeLoadout) deleteLoadout(activeLoadout);
                      setActiveLoadout(null);
                    }}
                    className="px-2 py-1.5 text-xs text-text-secondary/40 hover:text-danger transition-colors"
                    title="Delete selected loadout"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={loadoutName}
                onChange={(e) => setLoadoutName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveLoadout()}
                placeholder="Save as..."
                aria-label="Loadout name"
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("gear-compare")}
                  className="text-[11px] text-text-secondary/50 hover:text-accent transition-colors"
                >
                  Compare gear →
                </button>
                <div className="flex gap-1">
                  {(["equipment", "manual"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setBonusMode(m)}
                      aria-pressed={bonusMode === m}
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
            </div>

            {bonusMode === "equipment" ? (
              <div>
                {/* OSRS-style equipment grid */}
                {(() => {
                  function SlotButton({ slot, label }: { slot: EquipmentSlot | "2h"; label: string }) {
                    const equipped = equippedGear[slot];
                    return (
                      <button
                        onClick={() => setOpenSlot(slot)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (equipped) {
                            setEquippedGear((prev) => {
                              const next = { ...prev };
                              delete next[slot];
                              return next;
                            });
                          }
                        }}
                        title={equipped ? `${equipped.name} (right-click to clear)` : label}
                        className={`flex flex-col items-center justify-center gap-0.5 w-full aspect-square rounded-lg border transition-colors ${
                          equipped
                            ? "border-accent/40 bg-accent/8 hover:bg-accent/15"
                            : "border-border/40 bg-bg-tertiary/30 hover:bg-bg-tertiary/60"
                        }`}
                      >
                        {equipped ? (
                          <img
                            src={itemIcon(equipped.version ? `${equipped.name}_${equipped.version}` : equipped.name)}
                            alt={equipped.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = itemIcon(equipped.name);
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-text-secondary/30">{label}</span>
                        )}
                      </button>
                    );
                  }
                  return (
                    <div className="grid grid-cols-5 gap-1 mb-2 max-w-[220px] mx-auto">
                      {/* Row 1: Head */}
                      <div /><div /><SlotButton slot="head" label="Head" /><div /><div />
                      {/* Row 2: Cape, Neck, Ammo */}
                      <div /><SlotButton slot="cape" label="Cape" /><SlotButton slot="neck" label="Neck" /><SlotButton slot="ammo" label="Ammo" /><div />
                      {/* Row 3: Weapon, Body, Shield */}
                      <div /><SlotButton slot="weapon" label="Weapon" /><SlotButton slot="body" label="Body" /><SlotButton slot="shield" label="Shield" /><div />
                      {/* Row 4: Legs */}
                      <div /><div /><SlotButton slot="legs" label="Legs" /><div /><div />
                      {/* Row 5: Hands, Feet, Ring */}
                      <div /><SlotButton slot="hands" label="Hands" /><SlotButton slot="feet" label="Feet" /><SlotButton slot="ring" label="Ring" /><div />
                    </div>
                  );
                })()}

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
                {bonusMode === "equipment" && weaponSpeed > 0 ? (
                  <div className="flex justify-between text-xs text-text-secondary mt-2">
                    <span>Attack speed</span>
                    <span className="text-text-primary font-medium tabular-nums">{effectiveAttackSpeed} ticks ({(effectiveAttackSpeed * 0.6).toFixed(1)}s)</span>
                  </div>
                ) : (
                  <StatInput label="Atk speed" value={attackSpeed} onChange={setAttackSpeed} min={1} max={12} suffix="ticks" />
                )}
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
            <div className="section-kicker mb-2">Prayer</div>
            <div className="grid grid-cols-5 gap-1.5">
              {filteredPrayers.map((p, i) => {
                const isActive = prayerIdx === i;
                const WIKI_IMG_BASE = "https://oldschool.runescape.wiki/images";
                return (
                  <button
                    key={p.name}
                    onClick={() => setPrayerIdx(i)}
                    aria-pressed={isActive}
                    title={`${p.name}${p.level ? ` (Lvl ${p.level})` : ""}${p.attackMult > 1 ? ` +${Math.round((p.attackMult - 1) * 100)}% atk` : ""}${p.strengthMult > 1 ? ` +${Math.round((p.strengthMult - 1) * 100)}% str` : ""}`}
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? "bg-accent/20 ring-2 ring-accent scale-105"
                        : "bg-bg-tertiary/40 hover:bg-bg-tertiary border border-border/20"
                    }`}
                  >
                    {p.icon ? (
                      <img
                        src={`${WIKI_IMG_BASE}/${p.icon}`}
                        alt={p.name}
                        className={`w-7 h-7 ${isActive ? "" : "opacity-50 grayscale"}`}
                        onError={(e) => { e.currentTarget.style.display = "none"; const next = e.currentTarget.nextElementSibling; if (next instanceof HTMLElement) next.style.display = "flex"; }}
                      />
                    ) : null}
                    <span className={`w-7 h-7 items-center justify-center text-[10px] font-medium ${p.icon ? "hidden" : "flex"} ${isActive ? "text-accent" : "text-text-secondary/50"}`}>
                      {p.name === "None" ? "—" : p.name[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            {prayer.name !== "None" && (
              <div className="mt-1.5 text-[10px] text-text-secondary">
                <span className="text-text-primary font-medium">{prayer.name}</span>
                {prayer.level ? <span className="text-text-secondary/40"> Lvl {prayer.level}</span> : null}
                {prayer.attackMult > 1 && <span className="text-success"> +{Math.round((prayer.attackMult - 1) * 100)}% atk</span>}
                {prayer.strengthMult > 1 && <span className="text-success"> +{Math.round((prayer.strengthMult - 1) * 100)}% str</span>}
              </div>
            )}
          </div>

          <div>
            <div className="section-kicker mb-2">
              Stance
              {bonusMode === "equipment" && weaponCombatStyle && (
                <span className="ml-1.5 text-accent/60 normal-case tracking-normal">({weaponType.name})</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {stances.map((s, i) => {
                const isActive = stanceIdx === i;
                return (
                  <button
                    key={`${s.name}-${i}`}
                    onClick={() => setStanceIdx(i)}
                    aria-pressed={isActive}
                    className={`px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                      isActive
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary"
                    }`}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className={`text-[9px] mt-0.5 ${isActive ? "text-white/60" : "text-text-secondary/40"}`}>
                      {s.attackType}
                      {s.attackBonus > 0 && ` · +${s.attackBonus} atk`}
                      {s.strengthBonus > 0 && ` · +${s.strengthBonus} str`}
                      {s.defenceBonus > 0 && ` · +${s.defenceBonus} def`}
                      {s.speedMod !== 0 && ` · ${s.speedMod > 0 ? "+" : ""}${s.speedMod} speed`}
                    </div>
                  </button>
                );
              })}
            </div>
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

          <div className="mt-3 max-w-[120px]">
            <label className="text-[10px] uppercase tracking-wider text-text-secondary/50">DWH Specs</label>
            <input
              type="number"
              min={0}
              max={10}
              value={defReductions}
              onChange={(e) => setDefReductions(Math.min(10, Math.max(0, Number(e.target.value))))}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm mt-1"
            />
          </div>

          <div className="mt-3">
            <button
              onClick={() => setShowRaidScaling(!showRaidScaling)}
              className="text-[10px] uppercase tracking-wider text-text-secondary/50 hover:text-text-primary transition-colors"
            >
              Raid Scaling {showRaidScaling ? "▾" : "▸"}
            </button>
            {showRaidScaling && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-text-secondary/50">ToA Invocations</label>
                  <input type="number" min={0} max={600} value={toaInvocation} onChange={(e) => setToaInvocation(Number(e.target.value))} className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary/50">CoX Party Size</label>
                  <input type="number" min={1} max={100} value={coxPartySize} onChange={(e) => setCoxPartySize(Number(e.target.value))} className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm mt-1" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-kicker">Results</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] uppercase tracking-wider text-text-secondary/50">Poison</label>
                <select
                  value={poisonType}
                  onChange={(e) => setPoisonType(e.target.value as "none" | "poison" | "venom")}
                  className="bg-bg-tertiary border border-border rounded px-2 py-1 text-xs"
                >
                  <option value="none">None</option>
                  <option value="poison">Poison (+)</option>
                  <option value="venom">Venom</option>
                </select>
              </div>
              <button
                onClick={() => setShowBreakdown((p) => !p)}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                {showBreakdown ? "Hide" : "Show"} breakdown
              </button>
            </div>
          </div>
          <DpsBreakdown
            maxHit={result.maxHit}
            accuracy={result.accuracy}
            dps={result.dps}
            ttk={result.ttk}
            attackRoll={result.attackRoll}
            defenseRoll={result.defenseRoll}
          />
          {poisonType !== "none" && (
            <div className="mt-3 flex gap-6 items-start">
              <div className="text-center">
                <div className="text-sm font-bold text-success">+{poisonDpsValue.toFixed(2)}</div>
                <div className="text-[10px] text-text-secondary capitalize">{poisonType} DPS</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-accent">{totalDps.toFixed(2)}</div>
                <div className="text-[10px] text-text-secondary">Total DPS</div>
              </div>
            </div>
          )}
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
