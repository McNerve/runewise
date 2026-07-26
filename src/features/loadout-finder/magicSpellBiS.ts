/**
 * Pick the best magic spell / powered-staff attack for Loadout Finder BiS.
 */
import {
  COMBAT_SPELLS,
  type CombatSpell,
  type SpellElement,
} from "../../lib/data/combat-spells";

export interface ResolvedMagicSpell {
  spellId: string;
  spellName: string;
  spellBaseMaxHit: number;
  spellElement?: SpellElement;
  isBoltSpell?: boolean;
  isGodSpell?: boolean;
  isDemonbaneSpell?: boolean;
  /** Powered staff attack (not a cast spell). */
  poweredStaff?: boolean;
}

/**
 * Infer powered-staff spell entry from weapon name, if any.
 */
export function poweredStaffSpell(weaponName?: string | null): CombatSpell | null {
  const n = (weaponName ?? "").toLowerCase();
  if (!n) return null;
  if (n.includes("tumeken") && n.includes("shadow")) {
    return COMBAT_SPELLS.find((s) => s.id === "tumekens_shadow") ?? null;
  }
  if (n.includes("sanguinesti")) {
    return COMBAT_SPELLS.find((s) => s.id === "sanguinesti_staff") ?? null;
  }
  if (n.includes("trident") && (n.includes("swamp") || n.includes("toxic"))) {
    return COMBAT_SPELLS.find((s) => s.id === "trident_swamp") ?? null;
  }
  if (n.includes("trident")) {
    return COMBAT_SPELLS.find((s) => s.id === "trident_seas") ?? null;
  }
  if (n.includes("dawnbringer")) {
    // Dawnbringer is ToB-only; treat as swamp-tier powered if present
    return COMBAT_SPELLS.find((s) => s.id === "trident_swamp") ?? null;
  }
  if (n.includes("warped sceptre")) {
    // Warped sceptre: floor(magic/3)-1-ish; approximate with swamp scaling
    return COMBAT_SPELLS.find((s) => s.id === "trident_swamp") ?? null;
  }
  if (n.includes("accursed sceptre")) {
    return COMBAT_SPELLS.find((s) => s.id === "trident_seas") ?? null;
  }
  return null;
}

function spellFlags(spell: CombatSpell): Pick<
  ResolvedMagicSpell,
  "isBoltSpell" | "isGodSpell" | "isDemonbaneSpell"
> {
  const name = spell.name.toLowerCase();
  const id = spell.id;
  return {
    isBoltSpell: name.includes("bolt") || id.includes("bolt") || undefined,
    isGodSpell:
      name.includes("saradomin") ||
      name.includes("guthix") ||
      name.includes("zamorak") ||
      id.includes("saradomin") ||
      id.includes("guthix") ||
      id.includes("zamorak") ||
      undefined,
    isDemonbaneSpell:
      name.includes("demonbane") || id.includes("demonbane") || undefined,
  };
}

/** Weapon-locked autocasts (Iban, magic dart, god spells) need matching gear. */
function weaponAllowsSpell(spell: CombatSpell, weaponName?: string | null): boolean {
  const w = (weaponName ?? "").toLowerCase();
  const id = spell.id;
  const name = spell.name.toLowerCase();

  if (id === "ibans_blast" || name.includes("iban")) {
    return w.includes("iban");
  }
  if (id === "magic_dart") {
    return w.includes("slayer") && w.includes("staff");
  }
  if (name.includes("flames of zamorak") || id.includes("zamorak")) {
    return w.includes("zamorak") || w.includes("staff of the dead") || w.includes("toxic staff");
  }
  if (name.includes("claws of guthix") || id.includes("guthix")) {
    return w.includes("guthix") || w.includes("void knight mace");
  }
  if (name.includes("saradomin strike") || id.includes("saradomin")) {
    return w.includes("saradomin");
  }
  return true;
}

/**
 * Resolve spell base max hit for magic loadout scoring.
 *
 * - Powered staff weapon → always that staff's level scaling
 * - Otherwise → best general autocast the magic level unlocks
 *   (prefer fire when tome of fire may apply)
 */
export function resolveMagicSpell(opts: {
  magicLevel: number;
  weaponName?: string | null;
  /** Prefer this spell id if unlocked (e.g. preset). */
  preferredSpellId?: string;
  /** When true, slightly prefer fire spells (tome of fire equipped). */
  preferFire?: boolean;
}): ResolvedMagicSpell | null {
  const { magicLevel, weaponName, preferredSpellId, preferFire } = opts;

  const powered = poweredStaffSpell(weaponName);
  if (powered) {
    const base =
      powered.levelScaling != null
        ? powered.levelScaling(magicLevel)
        : powered.baseMaxHit;
    return {
      spellId: powered.id,
      spellName: powered.name,
      spellBaseMaxHit: Math.max(1, base),
      spellElement: powered.element !== "none" ? powered.element : undefined,
      poweredStaff: true,
      ...spellFlags(powered),
    };
  }

  const unlocked = COMBAT_SPELLS.filter(
    (s) =>
      s.autocasting &&
      s.magicLevel <= magicLevel &&
      s.levelScaling == null && // not powered
      weaponAllowsSpell(s, weaponName)
  );

  if (unlocked.length === 0) return null;

  let pool = unlocked;
  if (preferredSpellId) {
    const pref = unlocked.find((s) => s.id === preferredSpellId);
    if (pref) pool = [pref];
  }

  // Score: base max hit; +0.5 fire when preferFire (tome synergy)
  let best = pool[0]!;
  let bestScore = -1;
  for (const s of pool) {
    let score = s.baseMaxHit;
    if (preferFire && s.element === "fire") score += 0.5;
    // Slight preference for higher-level spells at equal max (usually same series)
    score += s.magicLevel * 0.001;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }

  return {
    spellId: best.id,
    spellName: best.name,
    spellBaseMaxHit: best.baseMaxHit,
    spellElement: best.element !== "none" ? best.element : undefined,
    poweredStaff: false,
    ...spellFlags(best),
  };
}
