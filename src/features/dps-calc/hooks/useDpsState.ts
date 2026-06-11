/* eslint-disable react-hooks/set-state-in-effect -- hook syncs state from external URL params + hiscores; effects are the correct integration point */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  addModifierExclusive,
  sanitizeModifierSet,
  calculateDps,
  calculateSpecDps,
  DPS_MODIFIERS,
  toaDefenseScale,
  toaHpScale,
  coxHpScale,
  coxScale,
  poisonDps,
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
import { knownWeaponSpeed } from "../../../lib/data/weapon-speeds";
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
  // v2 snapshot fields
  contentTag?: string;
  note?: string;
  savedAt?: string;
  dps?: number;
  maxHit?: number;
  // v3: spell + spec selections persist with the loadout
  spellId?: string | null;
  specId?: string | null;
}

/** Complete calculator configuration — what a setup tab stores and what
 * loading a saved loadout applies. */
export interface SetupSnapshot {
  combatStyle: CombatStyle;
  stanceIdx: number;
  prayerIdx: number;
  bonusMode: BonusMode;
  attackBonus: number;
  strengthBonus: number;
  attackSpeed: number;
  gear: EquippedGear;
  modifiers: string[];
  spellId: string | null;
  specId: string | null;
}

export function loadoutToSnapshot(loadout: GearLoadout): SetupSnapshot {
  return {
    combatStyle: loadout.combatStyle,
    stanceIdx: loadout.stanceIdx,
    prayerIdx: loadout.prayerIdx,
    bonusMode: loadout.bonusMode ?? (loadout.gear ? "equipment" : "manual"),
    attackBonus: loadout.attackBonus,
    strengthBonus: loadout.strengthBonus,
    attackSpeed: loadout.attackSpeed,
    gear: (loadout.gear as EquippedGear) ?? {},
    modifiers: [...loadout.modifiers],
    spellId: loadout.spellId ?? null,
    specId: loadout.specId ?? null,
  };
}

export function sumGearBonuses(gear: EquippedGear): {
  attackStab: number;
  attackSlash: number;
  attackCrush: number;
  strengthBonus: number;
  attackSpeed: number;
  rangedBonus: number;
  rangedStrength: number;
  magicBonus: number;
  magicDamage: number;
  prayer: number;
  defenceStab: number;
  defenceSlash: number;
  defenceCrush: number;
  defenceMagic: number;
  defenceRanged: number;
} {
  const items = Object.values(gear).filter(Boolean) as WikiEquipment[];
  const totals = {
    attackStab: 0,
    attackSlash: 0,
    attackCrush: 0,
    strengthBonus: 0,
    attackSpeed: 0,
    rangedBonus: 0,
    rangedStrength: 0,
    magicBonus: 0,
    magicDamage: 0,
    prayer: 0,
    defenceStab: 0,
    defenceSlash: 0,
    defenceCrush: 0,
    defenceMagic: 0,
    defenceRanged: 0,
  };
  for (const i of items) {
    totals.attackStab += i.attackStab;
    totals.attackSlash += i.attackSlash;
    totals.attackCrush += i.attackCrush;
    totals.strengthBonus += i.strengthBonus;
    totals.rangedBonus += i.attackRanged;
    totals.rangedStrength += i.rangedStrength;
    totals.magicBonus += i.attackMagic;
    totals.magicDamage += i.magicDamage;
    totals.prayer += i.prayerBonus;
    totals.defenceStab += i.defenceStab;
    totals.defenceSlash += i.defenceSlash;
    totals.defenceCrush += i.defenceCrush;
    totals.defenceMagic += i.defenceMagic;
    totals.defenceRanged += i.defenceRanged;
  }
  return totals;
}

// OSRS uses only the attack bonus matching the weapon's current attack type
// (stab/slash/crush), never the sum of all three.
export function meleeAttackBonus(
  b: { attackStab: number; attackSlash: number; attackCrush: number },
  attackType: string
): number {
  if (attackType === "stab") return b.attackStab;
  if (attackType === "crush") return b.attackCrush;
  return b.attackSlash;
}

const LOADOUTS_KEY = "runewise_dps_loadouts";
const LOADOUTS_V2_KEY = "runewise_loadouts_v2";
const SETUPS_KEY = "runewise_dps_setups_v1";
const SETUP_SLOTS = 3;

interface StoredSetups {
  setups: (SetupSnapshot | null)[];
  activeSetup: number;
}

function loadStoredSetups(): StoredSetups {
  const stored = loadJSON<StoredSetups>(SETUPS_KEY, {
    setups: new Array<SetupSnapshot | null>(SETUP_SLOTS).fill(null),
    activeSetup: 0,
  });
  const setups = Array.from({ length: SETUP_SLOTS }, (_, i) => stored.setups?.[i] ?? null);
  const activeSetup =
    Number.isInteger(stored.activeSetup) && stored.activeSetup >= 0 && stored.activeSetup < SETUP_SLOTS
      ? stored.activeSetup
      : 0;
  return { setups, activeSetup };
}

/** Builds the DPS input for a stored setup snapshot, mirroring the live
 * derivations (gear bonuses, weapon stances, verified speeds, spells). */
export function snapshotDpsInput(
  snap: SetupSnapshot,
  ctx: {
    attackLevel: number;
    strengthLevel: number;
    rangedLevel: number;
    magicLevel: number;
    targetDefLevel: number;
    targetHp: number;
    targetMagicLevel?: number;
    targetDefBonusFor: (style: CombatStyle, attackType: string) => number;
    defReductions: number;
    tbowRaidCap: boolean;
  }
): DpsInput {
  const weapon = snap.gear["weapon"] ?? snap.gear["2h"] ?? null;
  const useEquipment = snap.bonusMode === "equipment";
  const stances = useEquipment && weapon?.combatStyle
    ? getWeaponType(weapon.combatStyle).stances
    : GENERIC_STANCES[snap.combatStyle];
  const stance = stances[snap.stanceIdx] ?? stances[0];
  const stylePrayers = PRAYERS.filter((p) => p.style === snap.combatStyle);
  const prayer = stylePrayers[snap.prayerIdx] ?? stylePrayers[0];

  const bonuses = sumGearBonuses(snap.gear);
  const attackBonus = useEquipment
    ? snap.combatStyle === "ranged"
      ? bonuses.rangedBonus
      : snap.combatStyle === "magic"
        ? bonuses.magicBonus
        : meleeAttackBonus(bonuses, stance.attackType)
    : snap.attackBonus;
  const strengthBonus = useEquipment
    ? snap.combatStyle === "ranged"
      ? bonuses.rangedStrength
      : snap.combatStyle === "magic"
        ? bonuses.magicDamage
        : bonuses.strengthBonus
    : snap.strengthBonus;

  const weaponSpeed = weapon ? weapon.attackSpeed || knownWeaponSpeed(weapon.name) || 0 : 0;
  const attackSpeed = useEquipment && weaponSpeed > 0
    ? weaponSpeed + (stance.speedMod ?? 0)
    : snap.attackSpeed;

  const spell = snap.combatStyle === "magic" && snap.spellId
    ? COMBAT_SPELLS.find((s) => s.id === snap.spellId) ?? null
    : null;
  const spellBaseMaxHit = spell
    ? spell.id === "magic_dart"
      ? magicDartBaseMaxHit(ctx.magicLevel)
      : spell.levelScaling
        ? spell.levelScaling(ctx.magicLevel)
        : spell.baseMaxHit
    : undefined;

  return {
    attackLevel: ctx.attackLevel,
    strengthLevel: ctx.strengthLevel,
    rangedLevel: ctx.rangedLevel,
    magicLevel: ctx.magicLevel,
    attackBonus,
    strengthBonus,
    prayerAttackMult: prayer.attackMult,
    prayerStrengthMult: prayer.strengthMult,
    stanceAttackBonus: stance.attackBonus,
    stanceStrengthBonus: stance.strengthBonus,
    attackSpeed,
    combatStyle: snap.combatStyle,
    targetDefLevel: ctx.targetDefLevel,
    targetDefBonus: ctx.targetDefBonusFor(snap.combatStyle, stance.attackType),
    targetHp: ctx.targetHp,
    targetMagicLevel: ctx.targetMagicLevel,
    modifiers: [...snap.modifiers]
      .map((id) => DPS_MODIFIERS[id])
      .filter((m): m is DpsModifier => m != null),
    defReductions: ctx.defReductions,
    spellBaseMaxHit,
    tbowRaidCap: ctx.tbowRaidCap,
  };
}

function migrateLoadouts(): GearLoadout[] {
  const v2 = loadJSON<GearLoadout[]>(LOADOUTS_V2_KEY, []);
  if (v2.length > 0) return v2;
  // Migrate from legacy key
  const legacy = loadJSON<GearLoadout[]>(LOADOUTS_KEY, []);
  if (legacy.length > 0) {
    saveJSON(LOADOUTS_V2_KEY, legacy);
  }
  return legacy;
}

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

export function getDefBonus(m: WikiMonster, style: CombatStyle, meleeType?: string): number {
  if (style === "ranged") return m.defRanged;
  if (style === "magic") return m.defMagic;
  // Melee uses the defence bonus matching the attacker's attack type;
  // default to slash (the most common melee type) when unspecified.
  if (meleeType === "stab") return m.defStab;
  if (meleeType === "crush") return m.defCrush;
  return m.defSlash;
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
  const [defenceLevel, setDefenceLevel] = useState(99);
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
  const [loadouts, setLoadouts] = useState<GearLoadout[]>(() => migrateLoadouts());
  const [loadoutName, setLoadoutName] = useState("");
  const [selectedSpec, setSelectedSpec] = useState<SpecWeapon | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<CombatSpell | null>(null);
  const pendingSnapshot = useRef<SetupSnapshot | null>(null);

  // Setup tabs: full configurations switched in place, persisted across runs.
  const [setups, setSetups] = useState<(SetupSnapshot | null)[]>(() => loadStoredSetups().setups);
  const [activeSetup, setActiveSetup] = useState(() => loadStoredSetups().activeSetup);

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
      setDefenceLevel(getSkillLevel(hiscores, "Defence"));
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

  // Handle monster param from cross-nav. Syncing state from an external URL
  // param is a legitimate effect use. An optional `version` param selects a
  // specific phase (e.g. Verzik P2) directly.
  useEffect(() => {
    if (!params.monster || wikiMonsters.length === 0) return;
    const byName = wikiMonsters.filter(
      (m) => m.name.toLowerCase() === params.monster?.toLowerCase()
    );
    const match = params.version
      ? byName.find((m) => m.version?.toLowerCase() === params.version?.toLowerCase()) ?? byName[0]
      : byName[0];
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
  }, [params.monster, params.version, wikiMonsters]);

  // Handle onTask param from Slayer cross-nav — activate slayer_helm modifier.
  useEffect(() => {
    if (params.onTask !== "1") return;
    setActiveModifiers((prev) => {
      const next = new Set(prev);
      addModifierExclusive(next, "slayer_helm");
      return next;
    });
  }, [params.onTask]);

  // Applies every field of a snapshot to the live state. Only valid when the
  // snapshot's combat style is already active — cross-style application goes
  // through pendingSnapshot + setCombatStyle so style-derived state resolves.
  const applySnapshotNow = useCallback((snap: SetupSnapshot) => {
    setStanceIdx(snap.stanceIdx);
    setPrayerIdx(snap.prayerIdx);
    setAttackBonus(snap.attackBonus);
    setStrengthBonus(snap.strengthBonus);
    setAttackSpeed(snap.attackSpeed);
    setActiveModifiers(sanitizeModifierSet(snap.modifiers));
    setBonusMode(snap.bonusMode);
    setEquippedGear(snap.gear);
    setSelectedSpell(
      snap.spellId ? COMBAT_SPELLS.find((s) => s.id === snap.spellId) ?? null : null
    );
    setSelectedSpec(
      snap.specId
        ? getSpecWeaponsForStyle(snap.combatStyle).find((s) => s.id === snap.specId) ?? null
        : null
    );
  }, []);

  // Reset stance and prayer when combat style changes, or apply the pending
  // snapshot (loadout load / setup-tab switch across styles).
  useEffect(() => {
    const snap = pendingSnapshot.current;
    if (snap && snap.combatStyle === combatStyle) {
      pendingSnapshot.current = null;
      applySnapshotNow(snap);
    } else {
      setStanceIdx(0);
      setPrayerIdx(0);
      setAttackSpeed(DEFAULT_SPEED[combatStyle]);
      setActiveModifiers(new Set());
      setSelectedSpec(null);
      setSelectedSpell(null);
    }
  }, [combatStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  const gearBonuses = useMemo(() => sumGearBonuses(equippedGear), [equippedGear]);

  // Get weapon-specific stances from equipped weapon's combat_style
  const weaponItem = equippedGear["weapon"] ?? equippedGear["2h"] ?? null;
  const weaponCombatStyle = weaponItem?.combatStyle ?? undefined;
  const weaponType = getWeaponType(weaponCombatStyle);
  const stances = bonusMode === "equipment" && weaponCombatStyle
    ? weaponType.stances
    : GENERIC_STANCES[combatStyle];
  const stance = stances[stanceIdx] ?? stances[0];

  // Compute effective bonuses depending on mode
  const effectiveAttackBonus = bonusMode === "equipment"
    ? (combatStyle === "ranged" ? gearBonuses.rangedBonus : combatStyle === "magic" ? gearBonuses.magicBonus : meleeAttackBonus(gearBonuses, stance.attackType))
    : attackBonus;
  const effectiveStrengthBonus = bonusMode === "equipment"
    ? (combatStyle === "ranged" ? gearBonuses.rangedStrength : combatStyle === "magic" ? gearBonuses.magicDamage : gearBonuses.strengthBonus)
    : strengthBonus;

  // Weapon attack speed: the bucket field when present (currently always 0),
  // else the curated verified-speed table, else 0 → manual speed input.
  const weaponSpeed = weaponItem
    ? weaponItem.attackSpeed || knownWeaponSpeed(weaponItem.name) || 0
    : 0;
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
  const targetDefBonus = isCustom ? customDef.defBonus : getDefBonus(selectedMonster, combatStyle, stance.attackType);
  const baseHp = isCustom ? customDef.hp : selectedMonster.hitpoints;

  // Apply raid scaling
  const targetDefLevel = coxPartySize > 1
    ? coxScale(baseDefLevel, coxPartySize, false)
    : toaInvocation > 0
      ? toaDefenseScale(baseDefLevel, toaInvocation)
      : baseDefLevel;
  const targetHp = coxPartySize > 1
    ? coxHpScale(baseHp, coxPartySize)
    : toaInvocation > 0
      ? toaHpScale(baseHp, toaInvocation)
      : baseHp;
  // Both CoX and ToA raise the twisted bow's target-magic clamp to 350.
  const tbowRaidCap = coxPartySize > 1 || toaInvocation > 0;

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

  const dpsInput = useMemo<DpsInput>(
    () => ({
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
      tbowRaidCap,
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
      tbowRaidCap,
    ]
  );

  const result = useMemo(() => calculateDps(dpsInput), [dpsInput]);

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
        targetDefBonus: getDefBonus(monster, combatStyle, stance.attackType),
        targetHp: monster.hitpoints,
        targetMagicLevel: monster.magicLevel,
        modifiers: modifierList,
        defReductions,
      }),
    }));
  }, [phaseMonsters, attackLevel, strengthLevel, rangedLevel, magicLevel, effectiveAttackBonus, effectiveStrengthBonus, prayerAttackMult, prayerStrengthMult, stanceAttackBonus, stanceStrengthBonus, stance.attackType, effectiveAttackSpeed, combatStyle, modifierList, defReductions]);

  // Arsenal: every saved loadout computed against the current target at once.
  // Each loadout rolls against the defence bonus matching its own combat style
  // and stance — not the current setup's — so cross-style rows stay honest.
  const arsenalResults = useMemo(() => {
    if (loadouts.length === 0) return [];
    return loadouts
      .map((loadout) => {
        const loadoutStances = GENERIC_STANCES[loadout.combatStyle];
        const loadoutStance = loadoutStances[loadout.stanceIdx] ?? loadoutStances[0];
        const loadoutPrayer =
          PRAYERS.filter((p) => p.style === loadout.combatStyle)[loadout.prayerIdx] ?? PRAYERS[0];

        let loadoutAttackBonus = loadout.attackBonus;
        let loadoutStrengthBonus = loadout.strengthBonus;
        if (loadout.gear) {
          const bonuses = sumGearBonuses(loadout.gear as EquippedGear);
          if (loadout.combatStyle === "melee") {
            loadoutAttackBonus = meleeAttackBonus(bonuses, loadoutStance.attackType);
            loadoutStrengthBonus = bonuses.strengthBonus;
          } else if (loadout.combatStyle === "ranged") {
            loadoutAttackBonus = bonuses.rangedBonus;
            loadoutStrengthBonus = bonuses.rangedStrength;
          } else {
            loadoutAttackBonus = bonuses.magicBonus;
            loadoutStrengthBonus = bonuses.magicDamage;
          }
        }

        const loadoutDefBonus = isCustom
          ? customDef.defBonus
          : getDefBonus(selectedMonster, loadout.combatStyle, loadoutStance.attackType);

        const input: DpsInput = {
          attackLevel,
          strengthLevel,
          rangedLevel,
          magicLevel,
          attackBonus: loadoutAttackBonus,
          strengthBonus: loadoutStrengthBonus,
          prayerAttackMult: loadoutPrayer.attackMult,
          prayerStrengthMult: loadoutPrayer.strengthMult,
          stanceAttackBonus: loadoutStance.attackBonus,
          stanceStrengthBonus: loadoutStance.strengthBonus,
          attackSpeed: loadout.attackSpeed,
          combatStyle: loadout.combatStyle,
          targetDefLevel,
          targetDefBonus: loadoutDefBonus,
          targetHp,
          targetMagicLevel: selectedMonster?.magicLevel,
          modifiers: [...loadout.modifiers]
            .map((id) => DPS_MODIFIERS[id])
            .filter((m): m is DpsModifier => m != null),
          defReductions,
          tbowRaidCap,
        };
        return { loadout, result: calculateDps(input) };
      })
      .sort((a, b) => b.result.dps - a.result.dps);
  }, [loadouts, attackLevel, strengthLevel, rangedLevel, magicLevel, isCustom, customDef.defBonus, selectedMonster, targetDefLevel, targetHp, defReductions, tbowRaidCap]);

  // Live DPS per non-active setup tab against the current target.
  const setupResults = useMemo(() => {
    return setups.map((snap, idx) => {
      if (!snap || idx === activeSetup) return null;
      const input = snapshotDpsInput(snap, {
        attackLevel,
        strengthLevel,
        rangedLevel,
        magicLevel,
        targetDefLevel,
        targetHp,
        targetMagicLevel: selectedMonster?.magicLevel,
        targetDefBonusFor: (style, attackType) =>
          isCustom ? customDef.defBonus : getDefBonus(selectedMonster, style, attackType),
        defReductions,
        tbowRaidCap,
      });
      return calculateDps(input);
    });
  }, [setups, activeSetup, attackLevel, strengthLevel, rangedLevel, magicLevel, targetDefLevel, targetHp, selectedMonster, isCustom, customDef.defBonus, defReductions, tbowRaidCap]);

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
      tbowRaidCap,
      specAccuracyMult: selectedSpec.accuracyMult,
      specDamageMult: selectedSpec.damageMult,
      specHits: selectedSpec.hits,
      specGuaranteedHit: selectedSpec.guaranteedHit,
      specSpeed: effectiveAttackSpeed,
      specCascadeType: selectedSpec.cascadeType,
    });
  }, [selectedSpec, attackLevel, strengthLevel, rangedLevel, magicLevel, effectiveAttackBonus, effectiveStrengthBonus, prayerAttackMult, prayerStrengthMult, stanceAttackBonus, stanceStrengthBonus, effectiveAttackSpeed, combatStyle, targetDefLevel, targetDefBonus, targetHp, selectedMonster?.magicLevel, modifierList, defReductions, tbowRaidCap]);

  const toggleModifier = useCallback((id: string) => {
    setActiveModifiers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        addModifierExclusive(next, id);
      }
      return next;
    });
  }, []);

  const saveLoadout = useCallback((opts?: { contentTag?: string; note?: string }) => {
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
      contentTag: opts?.contentTag,
      note: opts?.note,
      savedAt: new Date().toISOString(),
      dps: result.dps,
      maxHit: result.maxHit,
      spellId: selectedSpell?.id ?? null,
      specId: selectedSpec?.id ?? null,
    };
    setLoadouts((prev) => {
      const next = prev.filter((l) => l.name !== name);
      next.push(loadout);
      saveJSON(LOADOUTS_V2_KEY, next);
      return next;
    });
    setLoadoutName("");
  }, [loadoutName, combatStyle, stanceIdx, prayerIdx, attackBonus, strengthBonus, attackSpeed, activeModifiers, bonusMode, equippedGear, result.dps, result.maxHit, selectedSpell, selectedSpec]);

  // Applies a full snapshot, routing through the combat-style effect when the
  // styles differ so style-derived state (stances, prayers) resolves first.
  const applySnapshot = useCallback((snap: SetupSnapshot) => {
    if (snap.combatStyle === combatStyle) {
      applySnapshotNow(snap);
    } else {
      pendingSnapshot.current = snap;
      setCombatStyle(snap.combatStyle);
    }
  }, [combatStyle, applySnapshotNow]);

  const applyLoadout = useCallback((loadout: GearLoadout) => {
    applySnapshot(loadoutToSnapshot(loadout));
  }, [applySnapshot]);

  const captureSnapshot = useCallback((): SetupSnapshot => ({
    combatStyle,
    stanceIdx,
    prayerIdx,
    bonusMode,
    attackBonus,
    strengthBonus,
    attackSpeed,
    gear: { ...equippedGear },
    modifiers: [...activeModifiers],
    spellId: selectedSpell?.id ?? null,
    specId: selectedSpec?.id ?? null,
  }), [combatStyle, stanceIdx, prayerIdx, bonusMode, attackBonus, strengthBonus, attackSpeed, equippedGear, activeModifiers, selectedSpell, selectedSpec]);

  // Switch setup tabs: stash the live configuration into the old slot, then
  // restore the target slot. An empty slot inherits the current configuration.
  const switchSetup = useCallback((idx: number) => {
    if (idx === activeSetup || idx < 0 || idx >= SETUP_SLOTS) return;
    const current = captureSnapshot();
    const target = setups[idx];
    setSetups((prev) => {
      const next = [...prev];
      next[activeSetup] = current;
      return next;
    });
    setActiveSetup(idx);
    if (target) applySnapshot(target);
  }, [activeSetup, setups, captureSnapshot, applySnapshot]);

  useEffect(() => {
    saveJSON(SETUPS_KEY, { setups, activeSetup } satisfies StoredSetups);
  }, [setups, activeSetup]);

  // Restore the active setup once on mount — unless a cross-nav param is
  // steering the calculator, in which case the deep link wins.
  const mountRestoreDone = useRef(false);
  useEffect(() => {
    if (mountRestoreDone.current) return;
    mountRestoreDone.current = true;
    if (params.style || params.monster || params.onTask) return;
    const snap = setups[activeSetup];
    if (snap) applySnapshot(snap);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteLoadout = useCallback((name: string) => {
    setLoadouts((prev) => {
      const next = prev.filter((l) => l.name !== name);
      saveJSON(LOADOUTS_V2_KEY, next);
      return next;
    });
  }, []);

  const duplicateLoadout = useCallback((name: string) => {
    setLoadouts((prev) => {
      const src = prev.find((l) => l.name === name);
      if (!src) return prev;
      const copy: GearLoadout = { ...src, name: `${src.name} (copy)`, savedAt: new Date().toISOString() };
      const next = [...prev.filter((l) => l.name !== copy.name), copy];
      saveJSON(LOADOUTS_V2_KEY, next);
      return next;
    });
  }, []);

  const importLoadouts = useCallback((incoming: GearLoadout[]) => {
    setLoadouts((prev) => {
      const nameSet = new Set(prev.map((l) => l.name));
      const merged = [...prev, ...incoming.filter((l) => !nameSet.has(l.name))];
      saveJSON(LOADOUTS_V2_KEY, merged);
      return merged;
    });
  }, []);

  const poisonDpsValue = useMemo(() => poisonDps(poisonType), [poisonType]);

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
    defenceLevel,
    setDefenceLevel,
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
    dpsInput,
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
    duplicateLoadout,
    importLoadouts,
    arsenalResults,
    // Setup tabs
    setups,
    activeSetup,
    switchSetup,
    setupResults,
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
