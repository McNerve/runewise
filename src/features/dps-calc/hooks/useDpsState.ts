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
  inferMonsterSize,
  isXericianMonster,
  isP2Wardens,
  inferBoltEnchant,
  type DpsModifier,
  type DpsInput,
} from "../../../lib/formulas/dps";
import { lookupMonsterMeta } from "../../../lib/data/monster-attributes";
import { PRAYERS, type Prayer } from "../../../lib/data/prayers";
import { MONSTERS } from "../../../lib/data/monsters";
import { fetchAllMonsters, type WikiMonster } from "../../../lib/api/monsters";
import { fetchAllEquipment } from "../../../lib/api/equipment";
import { type HiscoreData } from "../../../lib/api/hiscores";
import { type WikiEquipment, type EquipmentSlot } from "../../../lib/api/equipment";
import { loadJSON, saveJSON } from "../../../lib/localStorage";
import { useNavigation } from "../../../lib/NavigationContext";
import { getWeaponType } from "../../../lib/data/weapon-stances";
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
import type {
  BonusMode,
  CombatStyle,
  EquippedGear,
  GearLoadout,
  SetupSnapshot,
} from "../dpsTypes";
import {
  DEFAULT_SPEED,
  GENERIC_STANCES,
  getDefBonus,
  loadoutToSnapshot,
  meleeAttackBonus,
  snapshotDpsInput,
  sumGearBonuses,
} from "../dpsGearMath";
import {
  detectGearPassives,
  countCrystalPieces,
  countInquisitorBonus,
  hasSmokeStaff,
  hasChaosGauntlets,
} from "../gearPassives";

// Re-export pure types/helpers so existing import paths keep working.
export type {
  BonusMode,
  CombatStyle,
  EquippedGear,
  GearLoadout,
  SetupSnapshot,
} from "../dpsTypes";
export {
  DEFAULT_SPEED,
  GENERIC_STANCES,
  getDefBonus,
  loadoutToSnapshot,
  meleeAttackBonus,
  snapshotDpsInput,
  sumGearBonuses,
} from "../dpsGearMath";

const LOADOUTS_KEY = "runewise_dps_loadouts";
const LOADOUTS_V2_KEY = "runewise_loadouts_v2";
const SETUPS_KEY = "runewise_dps_setups_v1";
const SETUP_SLOTS = 3;

/** Spec weapon attack speeds (ticks) — not the main loadout speed. */
const SPEC_WEAPON_SPEEDS: Record<string, number> = {
  dragon_claws: 4,
  dragon_dagger: 4,
  dragon_warhammer: 6,
  bandos_godsword: 6,
  armadyl_godsword: 6,
  saradomin_godsword: 6,
  ancient_godsword: 6,
  voidwaker: 4,
  elder_maul: 6,
  dragon_halberd: 7,
  crystal_halberd: 7,
  toxic_blowpipe: 3,
  webweaver_bow: 4,
  zaryte_crossbow: 6,
  dark_bow: 9,
  magic_shortbow: 3,
  magic_longbow: 5,
  seercull: 5,
};

const SPEC_AMMO_ONLY = new Set(["magic_shortbow", "magic_longbow", "seercull"]);

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
  /** Zaryte crossbow special — next hit guaranteed + bolt proc guaranteed. */
  const [zcbSpec, setZcbSpec] = useState(false);
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

  // Handle preset param from Budget Loadout Finder / deep links
  useEffect(() => {
    const name = params.preset;
    if (!name) return;
    const preset = GEAR_PRESETS.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (preset) void applyPreset(preset);
  }, [params.preset, applyPreset]);

  // Apply gear deep-link from Loadout Finder:
  // - params.gear = JSON { slot: itemName, ... } (preferred, full optimized sets)
  // - params.upgradePath / upgradeItem (leftover path + legacy)
  const upgradePathApplied = useRef<string | null>(null);
  useEffect(() => {
    const single = params.upgradeItem;
    const slot = params.upgradeSlot;
    const path = params.upgradePath;
    const gearJson = params.gear;
    if (!single && !path && !gearJson) return;
    const key = `${params.preset ?? ""}|${gearJson ?? ""}|${path ?? ""}|${slot ?? ""}|${single ?? ""}`;
    if (upgradePathApplied.current === key) return;
    // Wait until preset gear has landed when a preset is also requested
    if (params.preset && Object.keys(equippedGear).length === 0) return;

    let cancelled = false;
    (async () => {
      const equipment = allEquipment.length > 0 ? allEquipment : await fetchAllEquipment();
      if (cancelled) return;
      if (allEquipment.length === 0) setAllEquipment(equipment);

      const resolveItem = (itemName: string) => {
        const lower = itemName.toLowerCase();
        return (
          equipment.find((e) => e.name.toLowerCase() === lower) ??
          // Soft match: ignore trailing "(uncharged)" / "(i)" noise
          equipment.find((e) => e.name.toLowerCase().startsWith(lower)) ??
          equipment.find((e) => lower.startsWith(e.name.toLowerCase()))
        );
      };

      const applyOne = (slotName: string, itemName: string, gear: EquippedGear): EquippedGear => {
        const match = resolveItem(itemName);
        if (!match) return gear;
        const next = { ...gear };
        if (slotName === "2h") {
          delete next.weapon;
          delete next.shield;
          next["2h"] = match;
        } else if (slotName === "weapon") {
          delete next["2h"];
          next.weapon = match;
        } else {
          next[slotName as EquipmentSlot] = match;
        }
        return next;
      };

      setEquippedGear((prev) => {
        // Full gear JSON replaces; path merges onto prev/preset
        let gear: EquippedGear = gearJson ? {} : { ...prev };
        if (gearJson) {
          try {
            const slots = JSON.parse(gearJson) as Record<string, string>;
            for (const [s, itemName] of Object.entries(slots)) {
              if (s && itemName) gear = applyOne(s, itemName, gear);
            }
          } catch {
            /* ignore bad JSON */
          }
        }
        if (path) {
          for (const part of path.split("|")) {
            const [s, ...rest] = part.split(":");
            const itemName = rest.join(":");
            if (s && itemName) gear = applyOne(s, itemName, gear);
          }
        } else if (single && slot) {
          gear = applyOne(slot, single, gear);
        }
        return gear;
      });
      setBonusMode("equipment");
      // Mark applied only after equipment catalog was available
      upgradePathApplied.current = key;
    })();

    return () => {
      cancelled = true;
    };
  }, [
    params.upgradeItem,
    params.upgradeSlot,
    params.upgradePath,
    params.gear,
    params.preset,
    allEquipment,
    equippedGear,
  ]);

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

  // Auto-enable set/weapon passives from equipped gear (void, crystal, tbow, shadow, …).
  // Only ADDS — never strips user/loadout toggles (slayer helm stays fully manual).
  useEffect(() => {
    if (bonusMode !== "equipment") return;
    const detected = detectGearPassives(equippedGear, combatStyle);
    if (detected.length === 0) return;
    setActiveModifiers((prev) => {
      const missing = detected.filter((id) => !prev.has(id));
      if (missing.length === 0) return prev;
      const next = new Set(prev);
      for (const id of detected) {
        addModifierExclusive(next, id);
      }
      // If user had slayer helm and we just auto-enabled salve, exclusivity already wins.
      return next;
    });
  }, [equippedGear, combatStyle, bonusMode]);

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
  // Curated wiki attributes (size, Xerician, demon vuln) with name heuristics as fallback.
  const monsterMeta = useMemo(
    () => lookupMonsterMeta(selectedMonster?.name, selectedMonster?.version),
    [selectedMonster?.name, selectedMonster?.version]
  );

  // TBow magic cap 350 only for Xerician (CoX) targets — ToA is NOT Xerician (wiki).
  const tbowRaidCap = useMemo(() => {
    if (coxPartySize > 1) return true;
    if (monsterMeta.attributes.includes("xerician")) return true;
    return isXericianMonster(selectedMonster?.name);
  }, [coxPartySize, selectedMonster?.name, monsterMeta.attributes]);

  const monsterSize = useMemo(() => {
    if (monsterMeta.size > 1) return monsterMeta.size;
    return inferMonsterSize(selectedMonster?.name);
  }, [monsterMeta.size, selectedMonster?.name]);

  const p2Wardens = useMemo(
    () => isP2Wardens(selectedMonster?.name) || isP2Wardens(selectedMonster?.version ?? undefined),
    [selectedMonster?.name, selectedMonster?.version]
  );

  // Demonbane vulnerability from curated meta (default 100).
  const demonbaneVulnerability = useMemo(() => {
    if (monsterMeta.demonbaneVulnerability != null) return monsterMeta.demonbaneVulnerability;
    if (monsterMeta.attributes.includes("demon")) return 100;
    return 100;
  }, [monsterMeta]);

  const weaponName = weaponItem?.name;
  const crystalPieces = useMemo(
    () => (bonusMode === "equipment" ? countCrystalPieces(equippedGear) : undefined),
    [bonusMode, equippedGear]
  );
  const inquisitorBonus = useMemo(
    () => (bonusMode === "equipment" ? countInquisitorBonus(equippedGear) : undefined),
    [bonusMode, equippedGear]
  );
  const smokeStaff = bonusMode === "equipment" && hasSmokeStaff(equippedGear);
  const chaosGauntlets = bonusMode === "equipment" && hasChaosGauntlets(equippedGear);
  const ammoName = bonusMode === "equipment" ? equippedGear.ammo?.name : undefined;
  // Wiki equipment may use slot "ammo" — EquippedGear keys vary; also check common names.
  const boltEnchant = useMemo(() => {
    if (combatStyle !== "ranged") return undefined;
    const fromAmmo = inferBoltEnchant(ammoName);
    if (fromAmmo !== "none") return fromAmmo;
    // Fallback: scan any equipped piece named *bolts*
    if (bonusMode === "equipment") {
      for (const piece of Object.values(equippedGear)) {
        if (piece?.name && piece.name.toLowerCase().includes("bolt")) {
          const e = inferBoltEnchant(piece.name);
          if (e !== "none") return e;
        }
      }
    }
    return undefined;
  }, [combatStyle, ammoName, bonusMode, equippedGear]);

  const scorcherVsDemon = useMemo(() => {
    const w = (weaponName ?? "").toLowerCase();
    if (!w.includes("scorching bow")) return false;
    const n = (selectedMonster?.name ?? "").toLowerCase();
    return (
      n.includes("demon") ||
      n.includes("k'ril") ||
      n.includes("skotizo") ||
      n.includes("abyssal sire") ||
      n.includes("duke sucellus") ||
      n.includes("yama")
    );
  }, [weaponName, selectedMonster?.name]);

  // Inside ToA — Tumeken's shadow gear mult is 4×.
  const inToA = toaInvocation > 0;

  // Wiki: tbow magic input = min(cap, max(skills.magic, offensive.magic)).
  const targetMagicForTbow = useMemo(() => {
    if (!selectedMonster) return undefined;
    return Math.max(selectedMonster.magicLevel, selectedMonster.magicAttackBonus ?? 0);
  }, [selectedMonster]);

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

  const spellFlags = useMemo(() => {
    const name = (selectedSpell?.name ?? "").toLowerCase();
    const id = selectedSpell?.id ?? "";
    return {
      isBoltSpell: name.includes("bolt") || id.includes("bolt"),
      isGodSpell:
        name.includes("saradomin") ||
        name.includes("guthix") ||
        name.includes("zamorak") ||
        id.includes("saradomin") ||
        id.includes("guthix") ||
        id.includes("zamorak"),
      isDemonbaneSpell:
        name.includes("demonbane") ||
        name.includes("inferior demonbane") ||
        name.includes("superior demonbane") ||
        name.includes("dark demonbane") ||
        id.includes("demonbane"),
    };
  }, [selectedSpell]);

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
      targetMagicLevel: targetMagicForTbow ?? selectedMonster?.magicLevel,
      modifiers: modifierList,
      defReductions,
      spellBaseMaxHit: activeSpellBase,
      tbowRaidCap,
      inToA,
      prayerMagicDamagePct: prayer.magicDamagePct ?? 0,
      spellElement: selectedSpell?.element,
      attackType: stance.attackType,
      weaponName,
      monsterSize,
      p2Wardens,
      demonbaneVulnerability,
      crystalPieces: crystalPieces && crystalPieces > 0 ? crystalPieces : undefined,
      inquisitorBonus: inquisitorBonus && inquisitorBonus > 0 ? inquisitorBonus : undefined,
      smokeStaff: smokeStaff || undefined,
      chaosGauntlets: chaosGauntlets || undefined,
      isBoltSpell: spellFlags.isBoltSpell || undefined,
      isGodSpell: spellFlags.isGodSpell || undefined,
      isDemonbaneSpell: spellFlags.isDemonbaneSpell || undefined,
      boltEnchant,
      zcbSpec: zcbSpec || undefined,
      kandarinHardDiary: activeModifiers.has("kandarin_hard") || undefined,
      scorcherVsDemon: scorcherVsDemon || undefined,
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
      targetMagicForTbow,
      selectedMonster?.magicLevel,
      modifierList,
      defReductions,
      activeSpellBase,
      tbowRaidCap,
      inToA,
      selectedSpell?.element,
      weaponName,
      monsterSize,
      p2Wardens,
      demonbaneVulnerability,
      crystalPieces,
      inquisitorBonus,
      smokeStaff,
      chaosGauntlets,
      spellFlags,
      boltEnchant,
      zcbSpec,
      activeModifiers,
      scorcherVsDemon,
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
        targetMagicLevel: Math.max(monster.magicLevel, monster.magicAttackBonus ?? 0),
        modifiers: modifierList,
        defReductions,
        spellBaseMaxHit: activeSpellBase,
        tbowRaidCap,
        inToA,
        prayerMagicDamagePct: prayer.magicDamagePct ?? 0,
        spellElement: selectedSpell?.element,
        attackType: stance.attackType,
        weaponName,
        monsterSize: inferMonsterSize(monster.name),
        p2Wardens: isP2Wardens(monster.name) || isP2Wardens(monster.version ?? undefined),
        demonbaneVulnerability,
        crystalPieces: crystalPieces && crystalPieces > 0 ? crystalPieces : undefined,
        inquisitorBonus: inquisitorBonus && inquisitorBonus > 0 ? inquisitorBonus : undefined,
        smokeStaff: smokeStaff || undefined,
        chaosGauntlets: chaosGauntlets || undefined,
        isBoltSpell: spellFlags.isBoltSpell || undefined,
        isGodSpell: spellFlags.isGodSpell || undefined,
        isDemonbaneSpell: spellFlags.isDemonbaneSpell || undefined,
      }),
    }));
  }, [phaseMonsters, attackLevel, strengthLevel, rangedLevel, magicLevel, effectiveAttackBonus, effectiveStrengthBonus, prayerAttackMult, prayerStrengthMult, stanceAttackBonus, stanceStrengthBonus, stance.attackType, effectiveAttackSpeed, combatStyle, modifierList, defReductions, activeSpellBase, tbowRaidCap, inToA, prayer.magicDamagePct, selectedSpell?.element, weaponName, demonbaneVulnerability, crystalPieces, inquisitorBonus, smokeStaff, chaosGauntlets, spellFlags]);

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
          targetMagicLevel: targetMagicForTbow ?? selectedMonster?.magicLevel,
          modifiers: [...loadout.modifiers]
            .map((id) => DPS_MODIFIERS[id])
            .filter((m): m is DpsModifier => m != null),
          defReductions,
          tbowRaidCap,
          inToA,
          prayerMagicDamagePct: loadoutPrayer.magicDamagePct ?? 0,
          attackType: loadoutStance.attackType,
        };
        return { loadout, result: calculateDps(input) };
      })
      .sort((a, b) => b.result.dps - a.result.dps);
  }, [loadouts, attackLevel, strengthLevel, rangedLevel, magicLevel, isCustom, customDef.defBonus, selectedMonster, targetDefLevel, targetHp, defReductions, tbowRaidCap, targetMagicForTbow, inToA]);

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
        targetMagicLevel: targetMagicForTbow ?? selectedMonster?.magicLevel,
        targetDefBonusFor: (style, attackType) =>
          isCustom ? customDef.defBonus : getDefBonus(selectedMonster, style, attackType),
        defReductions,
        tbowRaidCap,
        inToA,
      });
      return calculateDps(input);
    });
  }, [setups, activeSetup, attackLevel, strengthLevel, rangedLevel, magicLevel, targetDefLevel, targetHp, selectedMonster, isCustom, customDef.defBonus, defReductions, tbowRaidCap, targetMagicForTbow, inToA]);

  const specWeapons = useMemo(
    () => getSpecWeaponsForStyle(combatStyle),
    [combatStyle]
  );

  // Spec weapons: use the selected weapon's attack speed when known, not the
  // main loadout speed (e.g. claws are 4t while a scythe loadout is 5t).
  const specResult = useMemo(() => {
    if (!selectedSpec) return null;
    const specSpeed =
      SPEC_WEAPON_SPEEDS[selectedSpec.id] ??
      knownWeaponSpeed(selectedSpec.name) ??
      effectiveAttackSpeed;
    // Prefer equipped gear if the user is already wielding the same spec weapon.
    const wieldingSpec =
      weaponName &&
      weaponName.toLowerCase().includes(selectedSpec.name.toLowerCase().split(" (")[0]);
    const ammoOnly = SPEC_AMMO_ONLY.has(selectedSpec.id);
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
      targetMagicLevel: targetMagicForTbow ?? selectedMonster?.magicLevel,
      modifiers: wieldingSpec ? modifierList : [],
      defReductions,
      spellBaseMaxHit: activeSpellBase,
      inToA,
      prayerMagicDamagePct: prayer.magicDamagePct ?? 0,
      spellElement: selectedSpell?.element,
      attackType: stance.attackType,
      tbowRaidCap,
      weaponName: selectedSpec.name,
      monsterSize,
      demonbaneVulnerability,
      specAccuracyMult: selectedSpec.accuracyMult,
      specDamageMult: selectedSpec.damageMult,
      specHits: selectedSpec.hits,
      specGuaranteedHit: selectedSpec.guaranteedHit,
      specSpeed,
      specWeaponSpeed: specSpeed,
      specWeaponName: selectedSpec.name,
      // When not wielding the spec weapon, still use main offensive bonuses as a
      // reasonable proxy (full BiS import would require a second gear set).
      specAttackBonus: wieldingSpec ? effectiveAttackBonus : effectiveAttackBonus,
      specStrengthBonus: wieldingSpec ? effectiveStrengthBonus : effectiveStrengthBonus,
      specCascadeType: selectedSpec.cascadeType,
      specSecondHitAccuracyMult: selectedSpec.secondHitAccuracyMult,
      specAmmoOnly: ammoOnly || undefined,
      // Ammo-only specials: use current ranged strength as ammo proxy when equipped.
      specAmmoRangedStr: ammoOnly ? effectiveStrengthBonus : undefined,
    });
  }, [selectedSpec, attackLevel, strengthLevel, rangedLevel, magicLevel, effectiveAttackBonus, effectiveStrengthBonus, prayerAttackMult, prayerStrengthMult, stanceAttackBonus, stanceStrengthBonus, effectiveAttackSpeed, combatStyle, targetDefLevel, targetDefBonus, targetHp, targetMagicForTbow, selectedMonster, modifierList, defReductions, tbowRaidCap, activeSpellBase, inToA, prayer, selectedSpell, stance, weaponName, monsterSize, demonbaneVulnerability]);

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
    if (params.style || params.monster || params.onTask || params.preset) return;
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
    zcbSpec,
    setZcbSpec,
    boltEnchant,
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
