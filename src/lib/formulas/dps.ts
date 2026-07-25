import {
  type BoltEnchant,
  BOLT_PROC_CHANCE,
  inferBoltEnchant,
  boltEnchantExpectedFromPmf,
  boltEnchantHitDistribution,
} from "./boltDist";

export type { BoltEnchant };
export {
  BOLT_PROC_CHANCE,
  inferBoltEnchant,
  boltEnchantHitDistribution,
  boltEnchantExpectedFromPmf as boltEnchantExpectedHit,
};

export type AttackShape = "standard" | "fang" | "scythe";

export interface DpsInput {
  attackLevel: number;
  strengthLevel: number;
  rangedLevel: number;
  magicLevel: number;
  attackBonus: number;
  strengthBonus: number;
  prayerAttackMult: number;
  prayerStrengthMult: number;
  stanceAttackBonus: number;
  stanceStrengthBonus: number;
  attackSpeed: number;
  combatStyle: "melee" | "ranged" | "magic";
  targetDefLevel: number;
  targetDefBonus: number;
  targetHp: number;
  targetMagicLevel?: number;
  modifiers?: DpsModifier[];
  /** Successful DWH / Elder maul specs (each −30% current Defence). */
  defReductions?: number;
  /** Absolute Defence level drained (e.g. BGS Warstrike damage dealt). Applied after % reductions. */
  defLevelDrain?: number;
  spellBaseMaxHit?: number; // when set, overrides level-based max hit with spell-based formula
  /** True when target is Xerician (CoX). Cap tbow magic at 350; ToA is NOT Xerician. */
  tbowRaidCap?: boolean;
  /** Inside Tombs of Amascut — Tumeken's shadow gear mult is 4× instead of 3×. */
  inToA?: boolean;
  /**
   * Prayer magic-damage contribution in percentage points (Mystic Lore +1, Might +2,
   * Vigour +3, Augury +4). Applied in the primary magic-damage stage, not as a level mult.
   */
  prayerMagicDamagePct?: number;
  /** Spell element for tome gating (fire/water/earth). */
  spellElement?: "fire" | "water" | "earth" | "air" | "none";
  /** Melee attack type for inquisitor crush gate. */
  attackType?: string;
  /**
   * Inquisitor piece bonus points: great helm +1, hauberk +2, plateskirt +2.
   * When the inquisitor modifier is active and this is omitted, assumes full set (5).
   */
  inquisitorBonus?: number;
  /**
   * Crystal armour piece weight for Bofa/crystal bow: helm=1, legs=2, body=3 (full=6).
   * When crystal_armour modifier is active and omitted, assumes full set (6).
   */
  crystalPieces?: number;
  /**
   * Demonbane vulnerability percent (default 100). Arclight uses trunc(70 * vuln / 100).
   * Duke = 70, Yama = 120, etc.
   */
  demonbaneVulnerability?: number;
  /**
   * NPC size in tiles (1–5). Scythe hitsplats = min(3, size). Default 1.
   */
  monsterSize?: number;
  /**
   * Weapon attack shape. Auto-detected from weaponName when omitted.
   * fang: double acc + 15–85% band; scythe: multi-hitsplat by size.
   */
  attackShape?: AttackShape;
  /** Weapon display name for auto shape / passive detection. */
  weaponName?: string;
  /** P2 Wardens: tbow accuracy scaling applied twice (2023-06-21 game behaviour). */
  p2Wardens?: boolean;
  /** Elemental weakness severity % (wiki adds baseRoll * severity/100 to magic acc roll). */
  elementalWeaknessSeverity?: number;
  /** Element the NPC is weak to (must match spellElement for the bonus). */
  elementalWeaknessElement?: "fire" | "water" | "earth" | "air";
  /** Smoke battlestaff / mystic smoke staff: +10% magic accuracy on standard spells. */
  smokeStaff?: boolean;
  /** Mark of Darkness: doubles demonbane % for demonbane spells. */
  markOfDarkness?: boolean;
  /** Chaos gauntlets: +3 max hit on bolt spells. */
  chaosGauntlets?: boolean;
  /** Charge prayer: +10 max hit on god spells (Saradomin/Guthix/Zamorak strike/wave/surge). */
  chargeActive?: boolean;
  /** Spell is a bolt spell (for chaos gauntlets). */
  isBoltSpell?: boolean;
  /** Spell is a god spell (for Charge). */
  isGodSpell?: boolean;
  /** Spell is a demonbane spell (for Mark of Darkness). */
  isDemonbaneSpell?: boolean;
  /** Chinchompa distance tiles 1–7 for accuracy fuse tables. */
  chinchompaDistance?: number;
  /** Chinchompa fuse: short | medium | long (default medium). */
  chinchompaFuse?: "short" | "medium" | "long";
  /**
   * Enchanted bolt special (ammo name inferred in UI). Applied as expected-value
   * blend with normal hits — matches wiki EV approach for continuous DPS.
   */
  boltEnchant?: BoltEnchant;
  /**
   * Zaryte crossbow special: next attack is a guaranteed hit and the bolt enchant
   * effect is guaranteed (100% proc). Models the "ZCB guarantee" for that hit's EV.
   */
  zcbSpec?: boolean;
  /**
   * Kandarin hard diary: ×1.1 enchanted bolt special proc chance (wiki).
   * Soft-capped at 100% when combined with base rates.
   */
  kandarinHardDiary?: boolean;
  /** Scorching bow vs demon: add-factor demonbane + burn DoT EV (simplified). */
  scorcherVsDemon?: boolean;
}

function boltEnchantExpectedHit(
  opts: Parameters<typeof boltEnchantExpectedFromPmf>[0]
): number {
  return boltEnchantExpectedFromPmf(opts);
}

export interface DpsModifier {
  id: string;
  name: string;
  accuracyMult: number;
  damageMult: number;
  condition?: string;
  // Per-combat-style multiplier overrides, e.g. the salve amulet boosts melee
  // and ranged more than magic. Falls back to accuracyMult/damageMult.
  styleOverrides?: Partial<Record<"melee" | "ranged" | "magic", { accuracyMult: number; damageMult: number }>>;
}

export const DPS_MODIFIERS: Record<string, DpsModifier> = {
  void_melee: {
    id: "void_melee",
    name: "Void Knight (melee)",
    // Applied as trunc(eff * 11/10) on effective levels — not as a post-roll product.
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "melee",
  },
  void_ranged: {
    id: "void_ranged",
    name: "Void Knight (ranged)",
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "ranged",
  },
  elite_void_ranged: {
    id: "elite_void_ranged",
    name: "Elite Void (ranged)",
    // Acc 11/10, dmg 9/8 on effective levels.
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "ranged",
  },
  void_magic: {
    id: "void_magic",
    name: "Void Knight (magic)",
    // Acc 29/20 on effective magic level.
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "magic",
  },
  elite_void_magic: {
    id: "elite_void_magic",
    name: "Elite Void (magic)",
    // Acc 29/20 on eff level; +5% magic damage in primary stage (outside Shadow triple).
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "magic",
  },
  slayer_helm: {
    id: "slayer_helm",
    name: "Slayer helm (i)",
    // On task: melee gets 7/6 (16.67%), ranged and magic get a flat 15%.
    accuracyMult: 7 / 6,
    damageMult: 7 / 6,
    styleOverrides: {
      ranged: { accuracyMult: 1.15, damageMult: 1.15 },
      magic: { accuracyMult: 1.15, damageMult: 1.15 },
    },
  },
  salve_e: {
    id: "salve_e",
    name: "Salve amulet (e)",
    accuracyMult: 1.20,
    damageMult: 1.20,
    // Only works for melee and ranged — no effect on magic.
    styleOverrides: { magic: { accuracyMult: 1.0, damageMult: 1.0 } },
  },
  salve_ei: {
    id: "salve_ei",
    name: "Salve amulet (ei)",
    // Flat +20% in every style, magic included — the 15% figure belongs to
    // salve (i), not the enchanted-imbued variant.
    accuracyMult: 1.20,
    damageMult: 1.20,
  },
  arclight: {
    id: "arclight",
    name: "Arclight",
    accuracyMult: 1.70,
    damageMult: 1.70,
    condition: "melee",
  },
  dhcb: {
    id: "dhcb",
    name: "Dragon hunter crossbow",
    accuracyMult: 1.30,
    damageMult: 1.25,
    condition: "ranged",
  },
  dhl: {
    id: "dhl",
    name: "Dragon hunter lance",
    accuracyMult: 1.20,
    damageMult: 1.20,
    condition: "melee",
  },
  twisted_bow: {
    id: "twisted_bow",
    name: "Twisted bow",
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "ranged",
  },
  tome_of_fire: {
    id: "tome_of_fire",
    name: "Tome of fire",
    // PvM: +10% on standard fire spells only (wiki); PvP +50% not modelled here.
    accuracyMult: 1.0,
    damageMult: 1.10,
    condition: "magic",
  },
  inquisitor: {
    id: "inquisitor",
    name: "Inquisitor's armour",
    // Crush-only; factor = (200 + pieceBonus)/200 applied in melee pipeline.
    accuracyMult: 1.025,
    damageMult: 1.025,
    condition: "melee",
  },
  crystal_armour: {
    id: "crystal_armour",
    name: "Crystal armour set",
    accuracyMult: 1.30,
    damageMult: 1.15,
    condition: "ranged",
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian armour set",
    // Additive trunc(base/10) from pre-gear-bonus base — not a product mult.
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "melee",
  },
  berserker_necklace: {
    id: "berserker_necklace",
    name: "Berserker necklace",
    accuracyMult: 1.0,
    damageMult: 1.20,
    condition: "melee",
  },
  keris_partisan: {
    id: "keris_partisan",
    name: "Keris partisan",
    accuracyMult: 1.0,
    damageMult: 1.33,
    condition: "melee",
  },
  leaf_bladed: {
    id: "leaf_bladed",
    name: "Leaf-bladed battleaxe",
    // Passive vs turoths/kurasks is damage-only (47/40).
    accuracyMult: 1.0,
    damageMult: 1.175,
    condition: "melee",
  },
  tumekens_shadow: {
    id: "tumekens_shadow",
    name: "Tumeken's shadow",
    // Shadow multiplies GEAR magic attack and magic damage % (3× / 4× in ToA),
    // capped at 100% gear magic dmg. Handled in calculateDps; generic mult is a no-op.
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "magic",
  },
  virtus: {
    id: "virtus",
    name: "Virtus robes",
    accuracyMult: 1.0,
    damageMult: 1.05,
    condition: "magic",
  },
  dinhs_bulwark: {
    id: "dinhs_bulwark",
    name: "Dinh's bulwark",
    accuracyMult: 1.0,
    damageMult: 1.20,
    condition: "melee",
  },
  mark_of_darkness: {
    id: "mark_of_darkness",
    name: "Mark of Darkness",
    // Doubles demonbane spell % (handled in calculateDps via flag from this mod).
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "magic",
  },
  charge: {
    id: "charge",
    name: "Charge",
    // +10 base max on god spells (handled in calculateDps).
    accuracyMult: 1.0,
    damageMult: 1.0,
    condition: "magic",
  },
};

// Modifiers that can't coexist in-game: slayer helm and salve never stack
// (salve takes priority), and only one void set can be worn at a time.
export const EXCLUSIVE_MODIFIER_GROUPS: (keyof typeof DPS_MODIFIERS)[][] = [
  ["slayer_helm", "salve_e", "salve_ei"],
  ["void_melee", "void_ranged", "void_magic", "elite_void_ranged", "elite_void_magic"],
];

/** Adds a modifier id to the set, evicting members of its exclusivity group. */
export function addModifierExclusive(set: Set<string>, id: string): void {
  EXCLUSIVE_MODIFIER_GROUPS.find((group) => group.includes(id))?.forEach((member) => {
    set.delete(member);
  });
  set.add(id);
}

/** Builds a modifier set that respects exclusivity — for restoring saved/imported loadouts. */
export function sanitizeModifierSet(ids: Iterable<string>): Set<string> {
  const set = new Set<string>();
  for (const id of ids) addModifierExclusive(set, id);
  return set;
}

/** Ids applied on effective levels (void), not as post-product mults. */
const VOID_LEVEL_MOD_IDS = new Set([
  "void_melee",
  "void_ranged",
  "elite_void_ranged",
  "void_magic",
  "elite_void_magic",
]);

/** Melee gear bonuses handled by the ordered trunc pipeline (not float product). */
const MELEE_PIPELINE_IDS = new Set([
  "slayer_helm",
  "salve_e",
  "salve_ei",
  "arclight",
  "obsidian",
  "dhl",
  "keris_partisan",
  "leaf_bladed",
  "inquisitor",
  "berserker_necklace",
  "dinhs_bulwark",
]);

/**
 * Wiki tbowScaling (weirdgloop PlayerVsNPCCalc).
 * bonus = clamp(base + trunc((3M-f)/100) - trunc((trunc(3M/10)-10f)^2/100))
 * returns trunc(current * bonus / 100).
 * Acc: base/clamp 140, f=10; Dmg: base/clamp 250, f=14.
 */
export function tbowScaling(current: number, magic: number, accuracyMode: boolean): number {
  const factor = accuracyMode ? 10 : 14;
  const base = accuracyMode ? 140 : 250;
  const clamp = accuracyMode ? 140 : 250;
  const t2 = Math.trunc((3 * magic - factor) / 100);
  const t3 = Math.trunc((Math.trunc((3 * magic) / 10) - 10 * factor) ** 2 / 100);
  const bonus = Math.max(0, Math.min(clamp, base + t2 - t3));
  return Math.trunc((current * bonus) / 100);
}

/** Relative mult for tests / applyModifiers: tbowScaling(100, M, mode) / 100. */
export function twistedBowAccuracyMult(targetMagicLevel: number, magicCap: number): number {
  const magic = Math.min(targetMagicLevel, magicCap);
  return tbowScaling(100, magic, true) / 100;
}

export function twistedBowDamageMult(targetMagicLevel: number, magicCap: number): number {
  const magic = Math.min(targetMagicLevel, magicCap);
  return tbowScaling(100, magic, false) / 100;
}

function styleMult(
  mod: DpsModifier,
  combatStyle: "melee" | "ranged" | "magic"
): { accuracyMult: number; damageMult: number } {
  const override = mod.styleOverrides?.[combatStyle];
  return {
    accuracyMult: override ? override.accuracyMult : mod.accuracyMult,
    damageMult: override ? override.damageMult : mod.damageMult,
  };
}

/**
 * Product-of-floats path for non-pipeline modifiers (ranged/magic leftovers, legacy).
 * Void and tbow are special-cased elsewhere; skip them here when flagged.
 */
export function applyModifiers(
  baseAccuracyMult: number,
  baseDamageMult: number,
  combatStyle: "melee" | "ranged" | "magic",
  modifiers: DpsModifier[],
  targetMagicLevel?: number,
  tbowMagicCap = 250
): { accuracyMult: number; damageMult: number } {
  let accuracyMult = baseAccuracyMult;
  let damageMult = baseDamageMult;

  for (const mod of modifiers) {
    if (mod.condition && mod.condition !== combatStyle) continue;
    // Void is an effective-level factor in calculateDps — leave product as 1×.
    if (VOID_LEVEL_MOD_IDS.has(mod.id)) continue;
    // Obsidian is additive from base in the melee pipeline.
    if (mod.id === "obsidian") continue;
    // Crystal armour uses per-piece trunc factors in calculateDps.
    if (mod.id === "crystal_armour") continue;

    if (mod.id === "twisted_bow" && targetMagicLevel != null) {
      accuracyMult *= twistedBowAccuracyMult(targetMagicLevel, tbowMagicCap);
      damageMult *= twistedBowDamageMult(targetMagicLevel, tbowMagicCap);
    } else {
      const m = styleMult(mod, combatStyle);
      accuracyMult *= m.accuracyMult;
      damageMult *= m.damageMult;
    }
  }

  return { accuracyMult, damageMult };
}

/**
 * Ordered melee gear-bonus pipeline matching wiki PlayerVsNPCCalc
 * getPlayerMaxMeleeHit / getPlayerMaxMeleeAttackRoll intermediate floors:
 * salve/slayer exclusive → demonbane add-factor → obsidian +base/10 → DHL →
 * keris/leafy → inquisitor (crush) → berserker necklace (dmg only).
 */
export function applyMeleeGearPipeline(
  baseAttackRoll: number,
  baseMaxHit: number,
  modifiers: DpsModifier[],
  opts: {
    attackType?: string;
    inquisitorBonus?: number;
    /** Demonbane vulnerability % (default 100). */
    demonbaneVulnerability?: number;
  } = {}
): { attackRoll: number; maxHit: number } {
  const ids = new Set(modifiers.map((m) => m.id));
  let attackRoll = baseAttackRoll;
  let maxHit = baseMaxHit;

  // Salve and slayer are exclusive — salve wins if both somehow present.
  if (ids.has("salve_ei") || ids.has("salve_e")) {
    // Both (e) and (ei) are 6/5 for melee.
    attackRoll = Math.trunc((attackRoll * 6) / 5);
    maxHit = Math.trunc((maxHit * 6) / 5);
  } else if (ids.has("slayer_helm")) {
    attackRoll = Math.trunc((attackRoll * 7) / 6);
    maxHit = Math.trunc((maxHit * 7) / 6);
  }

  // Arclight/Emberlight demonbane: add-factor percent = trunc(70 * vuln / 100).
  if (ids.has("arclight")) {
    const vuln = opts.demonbaneVulnerability ?? 100;
    const percent = Math.trunc((70 * vuln) / 100);
    attackRoll = attackRoll + Math.trunc((attackRoll * percent) / 100);
    maxHit = maxHit + Math.trunc((maxHit * percent) / 100);
  }

  // Obsidian: add trunc(base/10) from the pre-gear-bonus base (after salve/slayer in wiki
  // the base used is the pre-gear roll/max — we snapshot pre-pipeline base).
  if (ids.has("obsidian")) {
    attackRoll = attackRoll + Math.trunc(baseAttackRoll / 10);
    maxHit = maxHit + Math.trunc(baseMaxHit / 10);
  }

  // Dragon hunter lance: 6/5
  if (ids.has("dhl")) {
    attackRoll = Math.trunc((attackRoll * 6) / 5);
    maxHit = Math.trunc((maxHit * 6) / 5);
  }

  // Keris partisan: damage 133/100 (accuracy only on breaching variant — skip acc)
  if (ids.has("keris_partisan")) {
    maxHit = Math.trunc((maxHit * 133) / 100);
  }

  // Leaf-bladed battleaxe: damage 47/40
  if (ids.has("leaf_bladed")) {
    maxHit = Math.trunc((maxHit * 47) / 40);
  }

  // Inquisitor: crush only, factor (200+bonus)/200
  if (ids.has("inquisitor") && (opts.attackType == null || opts.attackType === "crush")) {
    const bonus = opts.inquisitorBonus ?? 5; // full set default
    if (bonus > 0) {
      attackRoll = Math.trunc((attackRoll * (200 + bonus)) / 200);
      maxHit = Math.trunc((maxHit * (200 + bonus)) / 200);
    }
  }

  // Dinh's bulwark set-ish passive (simplified as late dmg mult)
  if (ids.has("dinhs_bulwark")) {
    maxHit = Math.trunc((maxHit * 6) / 5);
  }

  // Berserker necklace: damage-only 6/5
  if (ids.has("berserker_necklace")) {
    maxHit = Math.trunc((maxHit * 6) / 5);
  }

  return { attackRoll, maxHit };
}

/**
 * Effective combat level.
 * Melee/ranged: +8 base (wiki). Magic: +9 base (wiki PlayerVsNPCCalc).
 * Prayer floors first, then stance, then style base.
 */
export function effectiveLevel(
  level: number,
  prayerMult: number,
  stanceBonus: number,
  /** 8 melee/ranged, 9 magic (wiki). */
  styleBase = 8
): number {
  return Math.floor(level * prayerMult) + stanceBonus + styleBase;
}

/** Wiki: trunc((effective * (bonus+64) + 320) / 640). */
export function maxHit(effectiveStr: number, strBonus: number): number {
  return Math.trunc((effectiveStr * (strBonus + 64) + 320) / 640);
}

export function attackRoll(effectiveAtk: number, atkBonus: number): number {
  return effectiveAtk * (atkBonus + 64);
}

export function defenseRoll(defLevel: number, defBonus: number): number {
  return (defLevel + 9) * (defBonus + 64);
}

/** Standard accuracy roll (wiki BaseCalc.getNormalAccuracyRoll, non-negative). */
export function hitChance(atkRoll: number, defRoll: number): number {
  if (atkRoll > defRoll) {
    return 1 - (defRoll + 2) / (2 * (atkRoll + 1));
  }
  return atkRoll / (2 * (defRoll + 1));
}

/**
 * Osmumten's fang accuracy (wiki BaseCalc.getFangAccuracyRoll).
 * NOT independent double-roll 1-(1-p)² — uses the closed-form double-roll formula.
 */
export function fangHitChance(atkRoll: number, defRoll: number): number {
  let atk = atkRoll;
  let def = defRoll;
  if (atk < 0) atk = Math.min(0, atk + 2);
  if (def < 0) def = Math.min(0, def + 2);

  const stdRoll = (attack: number, defence: number) =>
    attack > defence
      ? 1 - ((defence + 2) * (2 * defence + 3)) / (attack + 1) / (attack + 1) / 6
      : (attack * (4 * attack + 5)) / 6 / (attack + 1) / (defence + 1);

  const rvRoll = (attack: number, defence: number) =>
    attack < defence
      ? (attack * (defence * 6 - 2 * attack + 5)) / 6 / (defence + 1) / (defence + 1)
      : 1 - ((defence + 2) * (2 * defence + 3)) / 6 / (defence + 1) / (attack + 1);

  if (atk >= 0 && def >= 0) return stdRoll(atk, def);
  if (atk >= 0 && def < 0) return 1 - 1 / (-def + 1) / (atk + 1);
  if (atk < 0 && def >= 0) return 0;
  if (atk < 0 && def < 0) return rvRoll(-def, -atk);
  return 0;
}

export function dps(
  maxHitValue: number,
  accuracy: number,
  attackSpeed: number
): number {
  return (maxHitValue * accuracy) / (2 * attackSpeed * 0.6);
}

export function timeToKill(hp: number, dpsValue: number): number {
  return dpsValue > 0 ? hp / dpsValue : Infinity;
}

function hasMod(modifiers: DpsModifier[] | undefined, id: string): boolean {
  return modifiers?.some((m) => m.id === id) ?? false;
}

/** Infer attack shape from weapon name when not explicitly set. */
export function inferAttackShape(weaponName?: string, explicit?: AttackShape): AttackShape {
  if (explicit) return explicit;
  const n = (weaponName ?? "").toLowerCase();
  if (n.includes("osmumten") && n.includes("fang")) return "fang";
  if (n.includes("scythe") && n.includes("vitur")) return "scythe";
  if (n.includes("holy scythe")) return "scythe";
  return "standard";
}

/** Crystal armour piece weight from equipped names (helm 1, legs 2, body 3). */
export function crystalPieceWeight(itemNames: string[]): number {
  let w = 0;
  for (const raw of itemNames) {
    const n = raw.toLowerCase();
    if (n.includes("crystal helm")) w += 1;
    else if (n.includes("crystal body") || n.includes("crystal platebody")) w += 3;
    else if (n.includes("crystal legs") || n.includes("crystal platelegs")) w += 2;
  }
  return w;
}

/** Inquisitor piece bonus points from equipped names. */
export function inquisitorPieceBonus(itemNames: string[]): number {
  let b = 0;
  for (const raw of itemNames) {
    const n = raw.toLowerCase();
    if (n.includes("inquisitor's great helm") || n.includes("inquisitors great helm")) b += 1;
    if (n.includes("inquisitor's hauberk") || n.includes("inquisitors hauberk")) b += 2;
    if (n.includes("inquisitor's plateskirt") || n.includes("inquisitors plateskirt")) b += 2;
  }
  return b;
}

/**
 * Heuristic NPC size (tiles) when wiki size is unavailable.
 * Large bosses default to 3 so scythe multi-hit is honest for raid targets.
 */
export function inferMonsterSize(name?: string, explicit?: number): number {
  if (explicit != null && explicit > 0) return Math.min(5, Math.floor(explicit));
  const n = (name ?? "").toLowerCase();
  if (!n) return 1;
  const size3 = [
    "corporeal beast", "great olm", "general graardor", "kree'arra", "k'ril",
    "commander zilyana", "nex", "verzik", "warden", "zebak", "ba-ba", "kephri",
    "akkha", "duke sucellus", "vardorvis", "the leviathan", "whisperer",
    "kalphite queen", "king black dragon", "nightmare", "phosanis", "yama",
    "araxxor", "amoxliatl", "hueycoatl",
  ];
  if (size3.some((s) => n.includes(s))) return 3;
  const size2 = ["cerberus", "zulrah", "vorkath", "hydra", "sarachnis", "scurrius", "royal titans"];
  if (size2.some((s) => n.includes(s))) return 2;
  return 1;
}

/** Xerician (CoX) targets — tbow magic cap 350. */
export function isXericianMonster(name?: string): boolean {
  const n = (name ?? "").toLowerCase();
  if (!n) return false;
  const cox = [
    "great olm", "tekton", "vespula", "vasa nistirio", "guardian", "muttadile",
    "vanguard", "lizardman shaman", "skeletal mystic", "deathly mage", "deathly ranger",
    "ice demon", "tightrope", "rope", "scavenger", "jewelled crab",
  ];
  return cox.some((s) => n.includes(s));
}

/** P2 Wardens name check for double tbow apply. */
export function isP2Wardens(name?: string): boolean {
  const n = (name ?? "").toLowerCase();
  return n.includes("warden") && (n.includes("p2") || n.includes("phase 2") || n.includes("core"));
}

/** Chinchompa accuracy factor numerator (denom 4) from wiki fuse/distance table. */
export function chinchompaAccuracyNumer(
  distance: number,
  fuse: "short" | "medium" | "long" = "medium"
): number {
  const d = Math.min(7, Math.max(1, Math.floor(distance)));
  if (fuse === "short") {
    if (d >= 7) return 2;
    if (d >= 4) return 3;
    return 4;
  }
  if (fuse === "long") {
    if (d < 4) return 2;
    if (d < 7) return 3;
    return 4;
  }
  // medium
  if (d < 4 || d >= 7) return 3;
  return 4;
}

export function calculateDps(input: DpsInput) {
  const mods = input.modifiers ?? [];
  const shape = inferAttackShape(input.weaponName, input.attackShape);
  const monsterSize = inferMonsterSize(undefined, input.monsterSize ?? 1);

  // Magic uses +9 style base (wiki); melee/ranged use +8.
  const styleBase = input.combatStyle === "magic" ? 9 : 8;
  let effAtk = effectiveLevel(
    input.combatStyle === "melee"
      ? input.attackLevel
      : input.combatStyle === "ranged"
        ? input.rangedLevel
        : input.magicLevel,
    input.prayerAttackMult,
    input.stanceAttackBonus,
    styleBase
  );
  let effStr = effectiveLevel(
    input.combatStyle === "melee"
      ? input.strengthLevel
      : input.combatStyle === "ranged"
        ? input.rangedLevel
        : input.magicLevel,
    input.prayerStrengthMult,
    input.stanceStrengthBonus,
    styleBase
  );

  // ── Void: effective-level factors (wiki) before max hit / attack roll ──
  if (input.combatStyle === "melee" && hasMod(mods, "void_melee")) {
    effAtk = Math.trunc((effAtk * 11) / 10);
    effStr = Math.trunc((effStr * 11) / 10);
  }
  if (input.combatStyle === "ranged") {
    if (hasMod(mods, "elite_void_ranged") || hasMod(mods, "void_ranged")) {
      effAtk = Math.trunc((effAtk * 11) / 10);
    }
    if (hasMod(mods, "elite_void_ranged")) {
      effStr = Math.trunc((effStr * 9) / 8);
    } else if (hasMod(mods, "void_ranged")) {
      effStr = Math.trunc((effStr * 11) / 10);
    }
  }
  if (
    input.combatStyle === "magic" &&
    (hasMod(mods, "void_magic") || hasMod(mods, "elite_void_magic"))
  ) {
    // Wiki: trunc(eff * 29/20) after stance/+9. We use the same factor on our +8 form.
    effAtk = Math.trunc((effAtk * 29) / 20);
  }

  // ── Tumeken's shadow: 3× gear (4× in ToA); gear magic dmg contribution capped 100% ──
  const shadowMult =
    input.combatStyle === "magic" && hasMod(mods, "tumekens_shadow")
      ? input.inToA
        ? 4
        : 3
      : 1;
  const gearAttackBonus = input.attackBonus * shadowMult;
  const rawGearMagicDmg =
    input.combatStyle === "magic" ? input.strengthBonus * shadowMult : input.strengthBonus * shadowMult;
  const gearStrengthBonus =
    input.combatStyle === "magic" && shadowMult > 1
      ? Math.min(rawGearMagicDmg, 100)
      : rawGearMagicDmg;

  let mh: number;
  let ar: number;

  if (input.combatStyle === "magic" && input.spellBaseMaxHit != null) {
    let primaryPct = gearStrengthBonus;
    if (hasMod(mods, "elite_void_magic")) primaryPct += 5;
    if (input.prayerMagicDamagePct) primaryPct += input.prayerMagicDamagePct;
    if (hasMod(mods, "salve_ei")) primaryPct += 20;
    if (hasMod(mods, "virtus")) primaryPct += 5;

    let baseSpell = input.spellBaseMaxHit;
    // Chaos gauntlets: +3 on bolt spells before magic damage %.
    if (input.chaosGauntlets && input.isBoltSpell) baseSpell += 3;
    // Charge: +10 on god spells before magic damage %.
    if ((input.chargeActive || hasMod(mods, "charge")) && input.isGodSpell) baseSpell += 10;

    mh = Math.floor(baseSpell * (1 + primaryPct / 100));
    ar = attackRoll(effAtk, gearAttackBonus);

    // Elemental weakness: additive accuracy from base roll × severity/100.
    if (
      input.elementalWeaknessSeverity &&
      input.elementalWeaknessElement &&
      input.spellElement === input.elementalWeaknessElement
    ) {
      const baseRoll = attackRoll(effAtk, gearAttackBonus);
      const bonus = Math.trunc((baseRoll * input.elementalWeaknessSeverity) / 100);
      ar = ar + bonus;
    }

    // Smoke staff: +10% magic accuracy on standard spellbook casts.
    if (input.smokeStaff) {
      ar = Math.trunc((ar * 11) / 10);
    }

    if (hasMod(mods, "slayer_helm") && !hasMod(mods, "salve_ei") && !hasMod(mods, "salve_e")) {
      ar = Math.trunc((ar * 23) / 20);
      mh = Math.trunc((mh * 23) / 20);
    }
    if (hasMod(mods, "tome_of_fire")) {
      const element = input.spellElement;
      if (element == null || element === "fire") {
        mh = Math.trunc((mh * 11) / 10);
      }
    }
    // Demonbane spells: base 20% (40% with Mark of Darkness).
    if (input.isDemonbaneSpell) {
      const demonPct =
        input.markOfDarkness || hasMod(mods, "mark_of_darkness") ? 40 : 20;
      mh = mh + Math.trunc((mh * demonPct) / 100);
      ar = ar + Math.trunc((ar * demonPct) / 100);
    }
    if (hasMod(mods, "salve_ei")) {
      ar = Math.trunc((ar * 6) / 5);
    }
  } else if (input.combatStyle === "melee") {
    mh = maxHit(effStr, gearStrengthBonus);
    ar = attackRoll(effAtk, gearAttackBonus);
    const pipelineMods = mods.filter((m) => MELEE_PIPELINE_IDS.has(m.id));
    const applied = applyMeleeGearPipeline(ar, mh, pipelineMods, {
      attackType: input.attackType,
      inquisitorBonus: input.inquisitorBonus,
      demonbaneVulnerability: input.demonbaneVulnerability,
    });
    ar = applied.attackRoll;
    mh = applied.maxHit;
  } else {
    // Ranged (and magic without a spell base — powered-staff fallback via maxHit).
    mh = input.spellBaseMaxHit != null
      ? Math.floor(input.spellBaseMaxHit * (1 + gearStrengthBonus / 100))
      : maxHit(effStr, gearStrengthBonus);
    ar = attackRoll(effAtk, gearAttackBonus);

    // Crystal armour: piece-scaled trunc factors (wiki), not flat 1.30/1.15.
    if (hasMod(mods, "crystal_armour")) {
      const pieces = input.crystalPieces ?? 6;
      ar = Math.trunc((ar * (20 + pieces)) / 20);
      mh = Math.trunc((mh * (40 + pieces)) / 40);
    }

    const tbowCap = input.tbowRaidCap ? 350 : 250;
    const tbowMagic = input.targetMagicLevel != null
      ? Math.min(input.targetMagicLevel, tbowCap)
      : undefined;

    // Product mults excluding void, tbow, and crystal (crystal applied above).
    const productMods = mods.filter(
      (m) =>
        !VOID_LEVEL_MOD_IDS.has(m.id) &&
        m.id !== "twisted_bow" &&
        m.id !== "crystal_armour"
    );
    if (productMods.length > 0) {
      const { accuracyMult, damageMult } = applyModifiers(
        1,
        1,
        input.combatStyle,
        productMods,
        input.targetMagicLevel,
        tbowCap
      );
      ar = Math.floor(ar * accuracyMult);
      mh = Math.floor(mh * damageMult);
    }

    // Chinchompa distance/fuse accuracy factor.
    if (input.chinchompaDistance != null) {
      const numer = chinchompaAccuracyNumer(input.chinchompaDistance, input.chinchompaFuse);
      ar = Math.trunc((ar * numer) / 4);
    }

    // Twisted bow: wiki trunc scaling on roll and max hit.
    if (hasMod(mods, "twisted_bow") && tbowMagic != null) {
      ar = tbowScaling(ar, tbowMagic, true);
      mh = tbowScaling(mh, tbowMagic, false);
      // P2 Wardens: accuracy scaling applied twice (game update 2023-06-21).
      if (input.p2Wardens) {
        ar = tbowScaling(ar, tbowMagic, true);
      }
    }
  }

  // Defence reductions: DWH % stacks then absolute BGS-style drain.
  let reducedDefLevel = input.targetDefLevel;
  if (input.defReductions && input.defReductions > 0) {
    for (let i = 0; i < input.defReductions; i++) {
      reducedDefLevel = Math.floor(reducedDefLevel * 0.7);
    }
  }
  if (input.defLevelDrain && input.defLevelDrain > 0) {
    reducedDefLevel = Math.max(0, reducedDefLevel - Math.floor(input.defLevelDrain));
  }

  const effectiveDefLevel =
    input.combatStyle === "magic" && input.targetMagicLevel != null
      ? input.targetMagicLevel
      : reducedDefLevel;
  const dr = defenseRoll(effectiveDefLevel, input.targetDefBonus);
  // Fang uses wiki closed-form double-roll accuracy (not independent 1-(1-p)²).
  let acc = shape === "fang" ? fangHitChance(ar, dr) : hitChance(ar, dr);

  // Fang damage band [15%, 85%]; scythe multi-hitsplat; else uniform 0..max.
  const baseAccuracy = acc;
  let expectedHit = (acc * mh) / 2;
  let displayAccuracy = acc;
  if (shape === "fang") {
    displayAccuracy = acc;
    const lo = Math.trunc(mh * 0.15);
    const hi = Math.trunc(mh * 0.85);
    expectedHit = acc * ((lo + hi) / 2);
  } else if (shape === "scythe") {
    // Multi-hitsplat independent rolls: full + half + quarter max by size.
    const hits = Math.max(1, Math.min(3, monsterSize));
    const fracs = [1, 0.5, 0.25];
    expectedHit = 0;
    for (let i = 0; i < hits; i++) {
      const hitMax = Math.floor(mh * fracs[i]);
      expectedHit += (acc * hitMax) / 2;
    }
  }

  // Scorching bow vs demons: +30% demonbane-style add-factor on max (wiki ~30)
  // plus a small burn DoT EV (~1.5 dmg/attack average when applied).
  if (input.scorcherVsDemon && input.combatStyle === "ranged") {
    mh = mh + Math.trunc((mh * 30) / 100);
    ar = ar + Math.trunc((ar * 30) / 100);
    acc = hitChance(ar, dr);
    displayAccuracy = acc;
    expectedHit = (acc * mh) / 2 + 1.5;
  }

  // Enchanted bolts / ZCB special — EV blend after base hit math.
  // ZCB special: accuracy = 1 and enchant proc is guaranteed for that attack.
  // Kandarin hard diary multiplies PvM proc rates by 1.1 (wiki).
  const boltProcMult = input.kandarinHardDiary ? 1.1 : 1;
  if (input.combatStyle === "ranged" && input.boltEnchant && input.boltEnchant !== "none") {
    if (input.zcbSpec) {
      displayAccuracy = 1;
      acc = 1;
      expectedHit = boltEnchantExpectedHit({
        enchant: input.boltEnchant,
        maxHit: mh,
        accuracy: 1,
        targetHp: input.targetHp,
        rangedLevel: input.rangedLevel,
        guaranteedProc: true,
      });
    } else if (shape === "standard") {
      expectedHit = boltEnchantExpectedHit({
        enchant: input.boltEnchant,
        maxHit: mh,
        accuracy: baseAccuracy,
        targetHp: input.targetHp,
        rangedLevel: input.rangedLevel,
        procMult: boltProcMult,
      });
    }
  }

  const d = expectedHit / (input.attackSpeed * 0.6);
  const ttk = timeToKill(input.targetHp, d);

  return {
    maxHit: mh,
    /** Effective hit chance shown in UI (fang = double-rolled / ZCB = 1). */
    accuracy: displayAccuracy,
    /** Single-roll accuracy before fang double-roll (for HitDist / TTK). */
    baseAccuracy,
    dps: d,
    ttk,
    attackRoll: ar,
    defenseRoll: dr,
    attackShape: shape,
    monsterSize,
    expectedHit,
    boltEnchant: input.boltEnchant ?? "none",
    zcbSpec: !!input.zcbSpec,
  };
}

export interface SpecDpsInput extends DpsInput {
  specAccuracyMult: number;
  specDamageMult: number;
  specHits: number;
  specGuaranteedHit: boolean;
  specSpeed: number;
  specCascadeType?:
    | "dragon_claws"
    | "voidwaker"
    | "dark_bow"
    | "fang_spec"
    | "webweaver"
    | "burning_claws";
  /** Accuracy multiplier for the 2nd hit's roll (e.g. halberd sweep: 0.75). */
  specSecondHitAccuracyMult?: number;
  /** Dark bow with dragon arrows (min 8, ×1.5) vs other (min 5, ×1.3). */
  darkBowDragonArrows?: boolean;
  /** Override attack bonus with the selected spec weapon's gear (not main loadout). */
  specAttackBonus?: number;
  /** Override strength / ranged str / magic dmg % for the spec weapon. */
  specStrengthBonus?: number;
  /** Spec weapon attack speed in ticks (defaults to specSpeed). */
  specWeaponSpeed?: number;
  /** Spec weapon name for shape detection. */
  specWeaponName?: string;
  /** MSB/MLB/Seercull: ignore armour, use ammo ranged str only. */
  specAmmoOnly?: boolean;
  specAmmoRangedStr?: number;
}

// Dragon claws' Slice and Dice rolls accuracy four times. The first successful
// roll deals damage in [maxHit/2, maxHit-1]; any later rolls that connect take
// progressively smaller ranges ([maxHit/4..maxHit/2-1], [maxHit/8..maxHit/4-1],
// [maxHit/8+1..maxHit/4]). If all four miss, the spec deals 1 damage.
export function dragonClawsExpectedDamage(maxHit: number, accuracy: number): number {
  const m = maxHit;
  const ranges: [number, number][] = [
    [Math.floor(m / 2), m - 1],
    [Math.floor(m / 4), Math.floor(m / 2) - 1],
    [Math.floor(m / 8), Math.floor(m / 4) - 1],
    [Math.floor(m / 8) + 1, Math.floor(m / 4)],
  ];
  const expected = ([lo, hi]: [number, number]) => Math.max(0, (lo + hi) / 2);

  let total = 0;
  for (let k = 0; k < 4; k++) {
    // Probability the first connecting roll is attack k (rolls 0..k-1 missed).
    const pFirst = Math.pow(1 - accuracy, k) * accuracy;
    // Once a roll connects, the remaining hits are guaranteed: sum ranges[k..3].
    let conditional = 0;
    for (let i = k; i < 4; i++) {
      conditional += expected(ranges[i]);
    }
    total += pFirst * conditional;
  }
  total += Math.pow(1 - accuracy, 4) * 1;
  return total;
}

/** Voidwaker Disrupt: guaranteed hit, uniform roll in [floor(max/2), floor(max*1.5)]. */
export function voidwakerExpectedDamage(maxHit: number): number {
  const m = Math.max(0, Math.floor(maxHit));
  const lo = Math.floor(m / 2);
  const hi = Math.floor(m * 1.5);
  if (hi < lo) return m;
  return (lo + hi) / 2;
}

/** Dark bow Descent: two independent hits with min damage floor and mult. */
export function darkBowExpectedDamage(
  maxHit: number,
  accuracy: number,
  dragonArrows: boolean
): number {
  const mult = dragonArrows ? 1.5 : 1.3;
  const minDmg = dragonArrows ? 8 : 5;
  const hitMax = Math.max(minDmg, Math.floor(maxHit * mult));
  // Connecting hit uniform [minDmg, hitMax]; miss = 0
  const avgConnect = (minDmg + hitMax) / 2;
  return accuracy * avgConnect * 2;
}

/** Fang special: double accuracy, full 0..max band (no 15–85% clamp). */
export function fangSpecExpectedDamage(maxHit: number, accuracy: number): number {
  const a = 1 - (1 - Math.min(1, Math.max(0, accuracy))) ** 2;
  return (a * Math.max(0, maxHit)) / 2;
}

/** Webweaver: 4 hits at 2× acc path already applied; each ~40% max. */
export function webweaverExpectedDamage(maxHit: number, accuracy: number): number {
  const hitMax = Math.max(0, Math.floor(maxHit * 0.4));
  return 4 * ((accuracy * hitMax) / 2);
}

/**
 * Burning claws "Burning barrage" (wiki):
 * Up to 3 sequential accuracy rolls. First success uses a damage band that
 * shrinks each miss: 75–175%, then 50–150%, then 25–125% of max hit.
 * Damage is split across 3 hitsplats (25/25/50). Each hitsplat has 15% chance
 * to apply burn (≈10 total burn damage EV per proc → 1.5 expected burn per splat).
 * All three miss → 0.
 */
export function burningClawsExpectedDamage(maxHit: number, accuracy: number): number {
  const m = Math.max(0, Math.floor(maxHit));
  const a = Math.min(1, Math.max(0, accuracy));
  const bands: [number, number][] = [
    [Math.floor(m * 0.75), Math.floor(m * 1.75)],
    [Math.floor(m * 0.5), Math.floor(m * 1.5)],
    [Math.floor(m * 0.25), Math.floor(m * 1.25)],
  ];
  // Expected burn if the attack lands: 3 hitsplats × 15% × 10 burn dmg
  const burnEv = 3 * 0.15 * 10;
  let total = 0;
  for (let k = 0; k < 3; k++) {
    const pFirst = Math.pow(1 - a, k) * a;
    const [lo, hi] = bands[k]!;
    const loC = Math.max(0, lo);
    const hiC = Math.max(loC, hi);
    const avgDmg = (loC + hiC) / 2;
    total += pFirst * (avgDmg + burnEv);
  }
  return total;
}

export function calculateSpecDps(input: SpecDpsInput) {
  // When spec weapon overrides are provided, recompute the base roll/max from
  // those gear bonuses/speed rather than the main loadout.
  const baseInput: DpsInput = {
    ...input,
    attackBonus: input.specAttackBonus ?? input.attackBonus,
    strengthBonus: input.specStrengthBonus ?? input.strengthBonus,
    attackSpeed: input.specWeaponSpeed ?? input.attackSpeed,
    weaponName: input.specWeaponName ?? input.weaponName,
    attackShape: input.specWeaponName ? inferAttackShape(input.specWeaponName) : input.attackShape,
  };
  const base = calculateDps(baseInput);
  const specMaxHit = Math.floor(base.maxHit * input.specDamageMult);
  const specAttackRoll = Math.floor(base.attackRoll * input.specAccuracyMult);
  const specAccuracy = input.specGuaranteedHit
    ? 1.0
    : hitChance(specAttackRoll, base.defenseRoll);

  // Ammo-only specials (MSB/MLB/Seercull): ignore armour bonuses — model as
  // re-rolling max hit from ammo strength alone at +10 effective level bump.
  let effectiveSpecMax = specMaxHit;
  if (input.specAmmoOnly && input.specAmmoRangedStr != null) {
    const eff = (input.combatStyle === "ranged" ? input.rangedLevel : input.strengthLevel) + 10;
    effectiveSpecMax = Math.floor(
      Math.floor(0.5 + (eff * (input.specAmmoRangedStr + 64)) / 640) * input.specDamageMult
    );
  }

  let specTotalDamage: number;
  let specTotalMaxHit: number;
  if (input.specCascadeType === "dragon_claws") {
    specTotalDamage = dragonClawsExpectedDamage(effectiveSpecMax, specAccuracy);
    specTotalMaxHit = (effectiveSpecMax - 1)
      + Math.max(0, Math.floor(effectiveSpecMax / 2) - 1)
      + Math.max(0, Math.floor(effectiveSpecMax / 4) - 1)
      + Math.floor(effectiveSpecMax / 4);
  } else if (input.specCascadeType === "voidwaker") {
    // Guaranteed; band is relative to unboosted max (damageMult should be 1).
    const baseMax = base.maxHit;
    specTotalDamage = voidwakerExpectedDamage(baseMax);
    specTotalMaxHit = Math.floor(baseMax * 1.5);
  } else if (input.specCascadeType === "dark_bow") {
    specTotalDamage = darkBowExpectedDamage(
      base.maxHit,
      specAccuracy,
      input.darkBowDragonArrows ?? true
    );
    const mult = input.darkBowDragonArrows === false ? 1.3 : 1.5;
    specTotalMaxHit = Math.floor(base.maxHit * mult) * 2;
  } else if (input.specCascadeType === "fang_spec") {
    // Wiki fang accuracy on the (already 1.5×) attack roll; full 0..max band (no 15–85).
    const fangAcc = fangHitChance(specAttackRoll, base.defenseRoll);
    specTotalDamage = (fangAcc * effectiveSpecMax) / 2;
    specTotalMaxHit = effectiveSpecMax;
  } else if (input.specCascadeType === "webweaver") {
    specTotalDamage = webweaverExpectedDamage(base.maxHit, specAccuracy);
    specTotalMaxHit = Math.floor(base.maxHit * 0.4) * 4;
  } else if (input.specCascadeType === "burning_claws") {
    // Spec applies +5% acc/dmg on top of base before cascade (wiki passive on claws).
    const clawMax = Math.floor(base.maxHit * 1.05 * input.specDamageMult);
    const clawRoll = Math.floor(base.attackRoll * 1.05 * input.specAccuracyMult);
    const clawAcc = input.specGuaranteedHit ? 1 : hitChance(clawRoll, base.defenseRoll);
    specTotalDamage = burningClawsExpectedDamage(clawMax, clawAcc);
    specTotalMaxHit = Math.floor(clawMax * 1.75);
  } else if (input.specHits === 2 && input.specSecondHitAccuracyMult != null) {
    const secondRoll = Math.floor(specAttackRoll * input.specSecondHitAccuracyMult);
    const secondAccuracy = input.specGuaranteedHit ? 1 : hitChance(secondRoll, base.defenseRoll);
    specTotalDamage = (specAccuracy + secondAccuracy) * (effectiveSpecMax / 2);
    specTotalMaxHit = effectiveSpecMax * input.specHits;
  } else {
    specTotalDamage = specAccuracy * (effectiveSpecMax / 2) * input.specHits;
    specTotalMaxHit = effectiveSpecMax * input.specHits;
  }
  const specSpeed = input.specWeaponSpeed ?? input.specSpeed;
  const specTotalDps = specTotalDamage / (specSpeed * 0.6);

  return {
    ...base,
    specMaxHit: specTotalMaxHit,
    specAccuracy,
    specDps: specTotalDps,
    specTtk: input.targetHp > 0 && specTotalDps > 0 ? input.targetHp / specTotalDps : Infinity,
    specAttackRoll,
    specSpeed,
  };
}

export function poisonDps(type: "none" | "poison" | "venom"): number {
  if (type === "poison") return 4 / (30 * 0.6); // avg 4 dmg per 30 ticks
  if (type === "venom") return 12 / (30 * 0.6); // avg 12 dmg per 30 ticks (scales up)
  return 0;
}

export interface DpsComparison {
  setup1: ReturnType<typeof calculateDps>;
  setup2: ReturnType<typeof calculateDps>;
  dpsGain: number;
  dpsGainPct: number;
  ttkDiff: number;
}

export function compareDps(input1: DpsInput, input2: DpsInput): DpsComparison {
  const setup1 = calculateDps(input1);
  const setup2 = calculateDps(input2);
  return {
    setup1,
    setup2,
    dpsGain: setup2.dps - setup1.dps,
    dpsGainPct: setup1.dps > 0 ? ((setup2.dps - setup1.dps) / setup1.dps) * 100 : 0,
    ttkDiff: setup1.ttk - setup2.ttk,
  };
}

export function toaDefenseScale(baseDefLevel: number, invocationLevel: number): number {
  const scale = 1 + (invocationLevel / 100);
  return Math.floor(baseDefLevel * scale);
}

export function toaHpScale(baseHp: number, invocationLevel: number): number {
  const scale = 1 + (invocationLevel / 100);
  return Math.floor(baseHp * scale);
}

export function coxHpScale(baseHp: number, partySize: number): number {
  // CoX scales boss HP linearly: base × (1 + 0.5 × (party - 1)) for most bosses
  // Solo = 1×, duo = 1.5×, trio = 2×, etc.
  return Math.floor(baseHp * (1 + 0.5 * (partySize - 1)));
}

export function coxScale(baseDefLevel: number, partySize: number, challengeMode: boolean): number {
  // CoX scales with party size, CM adds ~50%
  const sizeScale = 1 + ((partySize - 1) * 0.5);
  return Math.floor(baseDefLevel * sizeScale * (challengeMode ? 1.5 : 1));
}

/**
 * Infer passive set/weapon modifiers from equipped item names.
 * Situational flags (on-task, undead-only intent) stay as explicit toggles;
 * salve still auto-enables when worn (wiki applies only vs undead at formula level).
 */
export function detectModifiersFromGearNames(itemNames: string[]): string[] {
  const names = itemNames.map((n) => n.toLowerCase());
  const has = (sub: string) => names.some((n) => n.includes(sub));
  const ids: string[] = [];

  const voidTop = has("void knight top") || has("elite void top");
  const voidRobe = has("void knight robe") || has("elite void robe");
  const voidGloves = has("void knight gloves");
  const eliteBody = has("elite void top");
  const eliteLegs = has("elite void robe");
  const elite = eliteBody && eliteLegs;
  if (voidTop && voidRobe && voidGloves) {
    if (has("void melee helm")) ids.push("void_melee");
    else if (has("void ranger helm")) ids.push(elite ? "elite_void_ranged" : "void_ranged");
    else if (has("void mage helm")) ids.push(elite ? "elite_void_magic" : "void_magic");
  }

  if (has("twisted bow")) ids.push("twisted_bow");
  if (has("tumeken") && has("shadow")) ids.push("tumekens_shadow");
  if (has("dragon hunter lance")) ids.push("dhl");
  if (has("dragon hunter crossbow")) ids.push("dhcb");
  if (has("arclight") || has("emberlight")) ids.push("arclight");
  if (has("tome of fire")) ids.push("tome_of_fire");
  if (has("leaf-bladed battleaxe") || has("leaf bladed battleaxe")) ids.push("leaf_bladed");
  if (has("keris partisan")) ids.push("keris_partisan");
  if (has("berserker necklace")) ids.push("berserker_necklace");
  if (has("dinh") && has("bulwark")) ids.push("dinhs_bulwark");

  // Salve: prefer ei over e.
  if (has("salve amulet(ei)") || has("salve amulet (ei)") || names.some((n) => n.includes("salve") && n.includes("ei"))) {
    ids.push("salve_ei");
  } else if (has("salve amulet (e)") || has("salve amulet(e)") || (has("salve amulet") && has("(e)"))) {
    ids.push("salve_e");
  }

  // Crystal armour + crystal bow / bowfa
  const crystalWeapon = has("crystal bow") || has("bow of faerdhinen");
  if (crystalWeapon && (has("crystal helm") || has("crystal body") || has("crystal legs"))) {
    ids.push("crystal_armour");
  }

  // Inquisitor pieces (any) — full-set default in pipeline unless piece count wired later
  if (has("inquisitor's great helm") || has("inquisitor's hauberk") || has("inquisitor's plateskirt")) {
    ids.push("inquisitor");
  }

  // Obsidian set + tzhaar weapon (wiki: helmet + platebody + platelegs)
  if (has("obsidian helmet") && has("obsidian platebody") && has("obsidian platelegs")) {
    const tzhaar =
      has("tzhaar-ket") || has("toktz-xil") || has("toktz-mej") || has("tzhaar");
    if (tzhaar) ids.push("obsidian");
  }

  // Virtus (any piece) — simplified full-set flag
  if (has("virtus mask") || has("virtus robe top") || has("virtus robe bottom")) {
    ids.push("virtus");
  }

  return ids;
}

/** Modifier ids that are auto-derived from gear (cleared/reapplied on gear change). */
export const GEAR_AUTO_MODIFIER_IDS = new Set([
  "void_melee",
  "void_ranged",
  "elite_void_ranged",
  "void_magic",
  "elite_void_magic",
  "obsidian",
  "crystal_armour",
  "inquisitor",
  "arclight",
  "dhcb",
  "dhl",
  "twisted_bow",
  "tome_of_fire",
  "berserker_necklace",
  "keris_partisan",
  "leaf_bladed",
  "tumekens_shadow",
  "virtus",
  "dinhs_bulwark",
  "salve_e",
  "salve_ei",
]);
