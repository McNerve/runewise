import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  calculateDps,
  calculateSpecDps,
  DPS_MODIFIERS,
  toaDefenseScale,
  toaHpScale,
  coxHpScale,
  compareDps,
  type DpsModifier,
  type DpsInput,
} from "../../../lib/formulas/dps";
import { PRAYERS, type Prayer } from "../../../lib/data/prayers";
import { MONSTERS } from "../../../lib/data/monsters";
import { fetchAllMonsters, type WikiMonster } from "../../../lib/api/monsters";
import { fetchAllEquipment } from "../../../lib/api/equipment";
import { type HiscoreData } from "../../../lib/api/hiscores";
import { type WikiEquipment, type EquipmentSlot } from "../../../lib/api/equipment";
import { loadJSON, saveJSON } from "../../../lib/localStorage";
import { useNavigation } from "../../../lib/NavigationContext";
import { getWeaponType, type WeaponStance } from "../../../lib/data/weapon-stances";
import { GEAR_PRESETS, type GearPreset } from "../../../lib/data/gear-presets";
import { getPhaseBoss, type BossPhase } from "../../../lib/data/boss-phases";
import { getSpecWeaponsForStyle, type SpecWeapon } from "../../../lib/data/spec-weapons";
import {
  COMBAT_SPELLS,
  spellMaxHit,
  magicDartBaseMaxHit,
  type CombatSpell,
} from "../../../lib/data/combat-spells";

export type CombatStyle = "melee" | "ranged" | "magic";
export type BonusMode = "equipment" | "manual";
export type EquippedGear = Partial<Record<EquipmentSlot | "2h", WikiEquipment>>;

export interface GearLoadout {
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

export function sumGearBonuses(gear: EquippedGear): {
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
    attackSpeed: 0,
    rangedBonus: items.reduce((s, i) => s + i.attackRanged, 0),
    rangedStrength: items.reduce((s, i) => s + i.rangedStrength, 0),
    magicBonus: items.reduce((s, i) => s + i.attackMagic, 0),
    magicDamage: items.reduce((s, i) => s + i.magicDamage, 0),
    prayer: items.reduce((s, i) => s + i.prayerBonus, 0),
  };
}

const LOADOUTS_KEY = "runewise_dps_loadouts";

export const GENERIC_STANCES: Record<CombatStyle, WeaponStance[]> = {
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

export function useDpsState({ hiscores }: Props) {
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
  const [selectedSpec, setSelectedSpec] = useState<SpecWeapon | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<CombatSpell | null>(null);
  const [compareLoadout, setCompareLoadout] = useState<GearLoadout | null>(null);
  const pendingLoadout = useRef<GearLoadout | null>(null);

  // Gear selector state
  const [bonusMode, setBonusMode] = useState<BonusMode>("equipment");
  const [equippedGear, setEquippedGear] = useState<EquippedGear>({});
  const [openSlot, setOpenSlot] = useState<EquipmentSlot | "2h" | null>(null);

  const [allEquipment, setAllEquipment] = useState<WikiEquipment[]>([]);
  const [monstersLoaded, setMonstersLoaded] = useState(false);

  // Lazy-load monsters on first interaction or cross-nav
  const ensureMonsters = useCallback(() => {
    if (monstersLoaded) return;
    setMonstersLoaded(true);
    fetchAllMonsters().then(setWikiMonsters);
  }, [monstersLoaded]);

  // Load monsters if cross-nav param is present
  useEffect(() => {
    if (params.monster) ensureMonsters();
  }, [params.monster, ensureMonsters]);

  const applyPreset = useCallback(async (preset: GearPreset) => {
    setCombatStyle(preset.style);
    setBonusMode("equipment");
    setActiveLoadout(preset.name);
    const equipment = allEquipment.length > 0 ? allEquipment : await fetchAllEquipment();
    if (allEquipment.length === 0) setAllEquipment(equipment);
    const gear: EquippedGear = {};
    for (const [slot, itemName] of Object.entries(preset.slots)) {
      if (!itemName) continue;
      const match = equipment.find(
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
      setAttackLevel(getSkillLevel(hiscores, "Attack"));
      setStrengthLevel(getSkillLevel(hiscores, "Strength"));
      setRangedLevel(getSkillLevel(hiscores, "Ranged"));
      setMagicLevel(getSkillLevel(hiscores, "Magic"));
    }
  }, [hiscores]);

  // Handle style param from cross-nav (e.g. from boss guide weakness chip)
  useEffect(() => {
    const s = params.style;
    if (!s) return;
    if (s === "melee" || s === "ranged" || s === "magic") {
      setCombatStyle(s);
    }
  }, [params.style]);

  // Handle monster param from cross-nav
  useEffect(() => {
    if (!params.monster || wikiMonsters.length === 0) return;
    const match = wikiMonsters.find(
      (m) => m.name.toLowerCase() === params.monster?.toLowerCase()
    );
    if (match) setSelectedMonster(match);
    else {
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
      setSelectedSpec(null);
      setSelectedSpell(null);
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

  // Weapon attack speed
  const weaponSpeed = weaponItem?.attackSpeed ?? 0;
  const effectiveAttackSpeed = bonusMode === "equipment" && weaponSpeed > 0
    ? weaponSpeed + (stance.speedMod ?? 0)
    : attackSpeed;

  const filteredPrayers = useMemo(
    () => PRAYERS.filter((p) => p.style === combatStyle),
    [combatStyle]
  );
  const prayer: Prayer = filteredPrayers[prayerIdx] ?? filteredPrayers[0];

  // Phase boss detection
  const bossPhases = useMemo<BossPhase[] | null>(
    () => selectedMonster ? getPhaseBoss(selectedMonster.name) : null,
    [selectedMonster]
  );
  const phaseMonsters = useMemo(() => {
    if (!bossPhases || !selectedMonster) return [];
    return bossPhases.map((phase) => {
      const match = wikiMonsters.find(
        (m) => m.name === selectedMonster.name && m.version === phase.version
      );
      return { phase, monster: match ?? null };
    }).filter((p) => p.monster !== null) as Array<{ phase: BossPhase; monster: WikiMonster }>;
  }, [bossPhases, selectedMonster, wikiMonsters]);

  const isCustom = !selectedMonster;
  const baseDefLevel = isCustom ? customDef.defLevel : selectedMonster.defenceLevel;
  const targetDefBonus = isCustom ? customDef.defBonus : getDefBonus(selectedMonster, combatStyle);
  const baseHp = isCustom ? customDef.hp : selectedMonster.hitpoints;

  // Apply raid scaling
  const targetDefLevel = toaInvocation > 0
    ? toaDefenseScale(baseDefLevel, toaInvocation)
    : baseDefLevel;
  const targetHp = coxPartySize > 1
    ? coxHpScale(baseHp, coxPartySize)
    : toaInvocation > 0
      ? toaHpScale(baseHp, toaInvocation)
      : baseHp;

  const modifierList = useMemo<DpsModifier[]>(
    () =>
      [...activeModifiers]
        .map((id) => DPS_MODIFIERS[id])
        .filter((m): m is DpsModifier => m != null),
    [activeModifiers]
  );

  // Spell-based max hit for magic combat style
  const activeSpellBase = useMemo(() => {
    if (combatStyle !== "magic" || !selectedSpell) return undefined;
    if (selectedSpell.id === "magic_dart") return magicDartBaseMaxHit(magicLevel);
    if (selectedSpell.levelScaling) return selectedSpell.levelScaling(magicLevel);
    return selectedSpell.baseMaxHit;
  }, [combatStyle, selectedSpell, magicLevel]);

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
        spellBaseMaxHit: activeSpellBase,
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
      activeSpellBase,
    ]
  );

  const stanceAttackBonus = stance.attackBonus;
  const stanceStrengthBonus = stance.strengthBonus;
  const prayerAttackMult = prayer.attackMult;
  const prayerStrengthMult = prayer.strengthMult;

  const phaseResults = useMemo(() => {
    if (phaseMonsters.length === 0) return [];
    return phaseMonsters.map(({ phase, monster }) => ({
      phase,
      monster,
      result: calculateDps({
        attackLevel,
        strengthLevel,
        rangedLevel,
        magicLevel,
        attackBonus: effectiveAttackBonus,
        strengthBonus: effectiveStrengthBonus,
        prayerAttackMult,
        prayerStrengthMult,
        stanceAttackBonus,
        stanceStrengthBonus,
        attackSpeed: effectiveAttackSpeed,
        combatStyle,
        targetDefLevel: monster.defenceLevel,
        targetDefBonus: getDefBonus(monster, combatStyle),
        targetHp: monster.hitpoints,
        targetMagicLevel: monster.magicLevel,
        modifiers: modifierList,
        defReductions,
      }),
    }));
  }, [phaseMonsters, attackLevel, strengthLevel, rangedLevel, magicLevel, effectiveAttackBonus, effectiveStrengthBonus, prayerAttackMult, prayerStrengthMult, stanceAttackBonus, stanceStrengthBonus, effectiveAttackSpeed, combatStyle, modifierList, defReductions]);

  // Loadout comparison
  const comparisonResult = useMemo(() => {
    if (!compareLoadout) return null;
    const compareStances = GENERIC_STANCES[compareLoadout.combatStyle];
    const cmpStance = compareStances[compareLoadout.stanceIdx] ?? compareStances[0];
    const cmpPrayer = PRAYERS.filter((p) => p.style === compareLoadout.combatStyle)[compareLoadout.prayerIdx] ?? PRAYERS[0];

    let cmpAttackBonus = compareLoadout.attackBonus;
    let cmpStrengthBonus = compareLoadout.attackBonus;
    if (compareLoadout.gear) {
      const bonuses = sumGearBonuses(compareLoadout.gear as EquippedGear);
      if (compareLoadout.combatStyle === "melee") {
        cmpAttackBonus = bonuses.attackBonus;
        cmpStrengthBonus = bonuses.strengthBonus;
      } else if (compareLoadout.combatStyle === "ranged") {
        cmpAttackBonus = bonuses.rangedBonus;
        cmpStrengthBonus = bonuses.rangedStrength;
      } else {
        cmpAttackBonus = bonuses.magicBonus;
        cmpStrengthBonus = bonuses.magicDamage;
      }
    }

    const cmpInput: DpsInput = {
      attackLevel,
      strengthLevel,
      rangedLevel,
      magicLevel,
      attackBonus: cmpAttackBonus,
      strengthBonus: cmpStrengthBonus,
      prayerAttackMult: cmpPrayer.attackMult,
      prayerStrengthMult: cmpPrayer.strengthMult,
      stanceAttackBonus: cmpStance.attackBonus,
      stanceStrengthBonus: cmpStance.strengthBonus,
      attackSpeed: compareLoadout.attackSpeed,
      combatStyle: compareLoadout.combatStyle,
      targetDefLevel,
      targetDefBonus,
      targetHp,
      targetMagicLevel: selectedMonster?.magicLevel,
      modifiers: [...compareLoadout.modifiers].map((id) => DPS_MODIFIERS[id]).filter((m): m is DpsModifier => m != null),
      defReductions,
    };
    const currentInput: DpsInput = {
      attackLevel,
      strengthLevel,
      rangedLevel,
      magicLevel,
      attackBonus: effectiveAttackBonus,
      strengthBonus: effectiveStrengthBonus,
      prayerAttackMult,
      prayerStrengthMult,
      stanceAttackBonus,
      stanceStrengthBonus,
      attackSpeed: effectiveAttackSpeed,
      combatStyle,
      targetDefLevel,
      targetDefBonus,
      targetHp,
      targetMagicLevel: selectedMonster?.magicLevel,
      modifiers: modifierList,
      defReductions,
      spellBaseMaxHit: activeSpellBase,
    };
    return compareDps(cmpInput, currentInput);
  }, [compareLoadout, attackLevel, strengthLevel, rangedLevel, magicLevel, effectiveAttackBonus, effectiveStrengthBonus, prayerAttackMult, prayerStrengthMult, stanceAttackBonus, stanceStrengthBonus, effectiveAttackSpeed, combatStyle, targetDefLevel, targetDefBonus, targetHp, selectedMonster?.magicLevel, modifierList, defReductions, activeSpellBase]);

  const specWeapons = useMemo(
    () => getSpecWeaponsForStyle(combatStyle),
    [combatStyle]
  );

  const specResult = useMemo(() => {
    if (!selectedSpec) return null;
    return calculateSpecDps({
      attackLevel,
      strengthLevel,
      rangedLevel,
      magicLevel,
      attackBonus: effectiveAttackBonus,
      strengthBonus: effectiveStrengthBonus,
      prayerAttackMult,
      prayerStrengthMult,
      stanceAttackBonus,
      stanceStrengthBonus,
      attackSpeed: effectiveAttackSpeed,
      combatStyle,
      targetDefLevel,
      targetDefBonus,
      targetHp,
      targetMagicLevel: selectedMonster?.magicLevel,
      modifiers: modifierList,
      defReductions,
      specAccuracyMult: selectedSpec.accuracyMult,
      specDamageMult: selectedSpec.damageMult,
      specHits: selectedSpec.hits,
      specGuaranteedHit: selectedSpec.guaranteedHit,
      specSpeed: effectiveAttackSpeed,
    });
  }, [selectedSpec, attackLevel, strengthLevel, rangedLevel, magicLevel, effectiveAttackBonus, effectiveStrengthBonus, prayerAttackMult, prayerStrengthMult, stanceAttackBonus, stanceStrengthBonus, effectiveAttackSpeed, combatStyle, targetDefLevel, targetDefBonus, targetHp, selectedMonster?.magicLevel, modifierList, defReductions]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (poisonType === "poison") return 6 / (18);
    return 8 / (18);
  }, [poisonType]);

  const totalDps = result.dps + poisonDpsValue;

  const clearGear = useCallback(() => {
    setEquippedGear({});
    setActiveModifiers(new Set());
    setStanceIdx(0);
    setPrayerIdx(0);
    setAttackBonus(0);
    setStrengthBonus(0);
    setDefReductions(0);
    setPoisonType("none");
    setActiveLoadout(null);
  }, []);

  return {
    // Navigation
    navigate,
    // Combat style
    combatStyle,
    setCombatStyle,
    // Levels
    attackLevel,
    setAttackLevel,
    strengthLevel,
    setStrengthLevel,
    rangedLevel,
    setRangedLevel,
    magicLevel,
    setMagicLevel,
    // Bonuses
    attackBonus,
    setAttackBonus,
    strengthBonus,
    setStrengthBonus,
    attackSpeed,
    setAttackSpeed,
    effectiveAttackBonus,
    effectiveStrengthBonus,
    effectiveAttackSpeed,
    // Bonus mode + gear
    bonusMode,
    setBonusMode,
    equippedGear,
    setEquippedGear,
    openSlot,
    setOpenSlot,
    gearBonuses,
    // Weapon
    weaponItem,
    weaponCombatStyle,
    weaponType,
    weaponSpeed,
    // Stances
    stances,
    stance,
    stanceIdx,
    setStanceIdx,
    // Prayers
    filteredPrayers,
    prayer,
    prayerIdx,
    setPrayerIdx,
    // Monster + target
    selectedMonster,
    setSelectedMonster,
    wikiMonsters,
    ensureMonsters,
    isCustom,
    customDef,
    setCustomDef,
    defReductions,
    setDefReductions,
    // Raid scaling
    showRaidScaling,
    setShowRaidScaling,
    toaInvocation,
    setToaInvocation,
    coxPartySize,
    setCoxPartySize,
    baseDefLevel,
    baseHp,
    targetDefLevel,
    targetHp,
    // Boss phases
    phaseMonsters,
    phaseResults,
    // Modifiers
    activeModifiers,
    toggleModifier,
    modifierList,
    // Spells
    selectedSpell,
    setSelectedSpell,
    activeSpellBase,
    // DPS result
    result,
    totalDps,
    // Poison
    poisonType,
    setPoisonType,
    poisonDpsValue,
    // Breakdown
    showBreakdown,
    setShowBreakdown,
    // Spec weapons
    specWeapons,
    selectedSpec,
    setSelectedSpec,
    specResult,
    // Loadouts
    loadouts,
    loadoutName,
    setLoadoutName,
    activeLoadout,
    setActiveLoadout,
    saveLoadout,
    applyLoadout,
    deleteLoadout,
    compareLoadout,
    setCompareLoadout,
    comparisonResult,
    // Presets
    applyPreset,
    // Clear
    clearGear,
    // Hiscores
    hiscores,
    // Re-exports for sub-components
    COMBAT_SPELLS,
    magicDartBaseMaxHit,
    spellMaxHit,
    GEAR_PRESETS,
  };
}

export type DpsState = ReturnType<typeof useDpsState>;
