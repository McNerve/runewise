/**
 * Detect set/weapon passives from equipped gear names so the DPS calc can
 * auto-apply modifiers without requiring manual toggles for obvious kits.
 *
 * Situational modifiers (on-task, undead/salve) stay user-controlled unless
 * the amulet itself is equipped (salve is "always on" when worn vs undead —
 * we still only auto-on salve from the neck slot, not slayer helm).
 */
import type { WikiEquipment } from "../../lib/api/equipment";
import type { EquippedGear } from "./dpsTypes";

function nameOf(item: WikiEquipment | null | undefined): string {
  return (item?.name ?? "").toLowerCase();
}

/** Crystal armour piece weight: helm=1, legs=2, body=3 (full set 6). */
export function countCrystalPieces(gear: EquippedGear): number {
  let w = 0;
  const head = nameOf(gear.head);
  const body = nameOf(gear.body);
  const legs = nameOf(gear.legs);
  if (head.includes("crystal helm")) w += 1;
  if (body.includes("crystal body") || body.includes("crystal platebody")) w += 3;
  if (legs.includes("crystal legs") || legs.includes("crystal platelegs")) w += 2;
  return w;
}

/** Inquisitor crush bonus points: helm +1, hauberk +2, plateskirt +2. */
export function countInquisitorBonus(gear: EquippedGear): number {
  let b = 0;
  const head = nameOf(gear.head);
  const body = nameOf(gear.body);
  const legs = nameOf(gear.legs);
  if (head.includes("inquisitor") && head.includes("helm")) b += 1;
  if (body.includes("inquisitor") && body.includes("hauberk")) b += 2;
  if (legs.includes("inquisitor") && (legs.includes("plateskirt") || legs.includes("skirt"))) b += 2;
  return b;
}

/** Virtus piece count (0–3) for future per-piece scaling. */
export function countVirtusPieces(gear: EquippedGear): number {
  let n = 0;
  if (nameOf(gear.head).includes("virtus")) n += 1;
  if (nameOf(gear.body).includes("virtus")) n += 1;
  if (nameOf(gear.legs).includes("virtus")) n += 1;
  return n;
}

export function hasSmokeStaff(gear: EquippedGear): boolean {
  const w = nameOf(gear.weapon ?? gear["2h"]);
  return w.includes("smoke battlestaff") || w.includes("mystic smoke staff") || w.includes("smoke staff");
}

export function hasChaosGauntlets(gear: EquippedGear): boolean {
  return nameOf(gear.hands).includes("chaos gauntlet");
}

/**
 * Returns modifier ids that should be auto-enabled from the current loadout.
 * Does not remove user situational toggles (slayer_helm).
 */
export function detectGearPassives(
  gear: EquippedGear,
  combatStyle: "melee" | "ranged" | "magic"
): string[] {
  const pieces = Object.values(gear).filter(Boolean) as WikiEquipment[];
  const names = pieces.map((p) => nameOf(p));
  const weapon = nameOf(gear.weapon ?? gear["2h"]);
  const neck = nameOf(gear.neck);
  const head = nameOf(gear.head);
  const body = nameOf(gear.body);
  const legs = nameOf(gear.legs);
  const hands = nameOf(gear.hands);
  const shield = nameOf(gear.shield);

  const out: string[] = [];

  // --- Weapon passives (unconditional when wielded) ---
  if (weapon.includes("twisted bow")) out.push("twisted_bow");
  if (weapon.includes("tumeken's shadow") || weapon.includes("tumekens shadow")) {
    out.push("tumekens_shadow");
  }
  if (weapon.includes("dragon hunter lance")) out.push("dhl");
  if (weapon.includes("dragon hunter crossbow")) out.push("dhcb");
  if (weapon.includes("arclight") || weapon.includes("emberlight")) out.push("arclight");
  if (weapon.includes("keris partisan")) out.push("keris_partisan");
  if (weapon.includes("leaf-bladed") || weapon.includes("leaf bladed")) {
    out.push("leaf_bladed");
  }

  // Tome of fire: only auto when equipped as shield and magic style
  if (combatStyle === "magic" && shield.includes("tome of fire")) {
    out.push("tome_of_fire");
  }

  // Salve: auto when worn (user still needs undead target for real effect)
  if (neck.includes("salve amulet (ei)") || neck.includes("salve amulet(ei)")) {
    out.push("salve_ei");
  } else if (
    neck.includes("salve amulet (e)") ||
    neck.includes("salve amulet(e)") ||
    neck.includes("salve amulet (i)") ||
    neck.includes("salve amulet(i)")
  ) {
    // (e) and (i) — map (e) to salve_e; imbued non-ei still uses salve_e for melee/ranged
    if (neck.includes("(ei)")) out.push("salve_ei");
    else out.push("salve_e");
  }

  // --- Set bonuses ---
  const voidHelm =
    head.includes("void melee") ||
    head.includes("void ranger") ||
    head.includes("void mage") ||
    head.includes("void knight");
  const voidCore =
    (body.includes("void") && body.includes("top")) ||
    body.includes("elite void top");
  const voidLegs =
    (legs.includes("void") && legs.includes("robe")) ||
    legs.includes("elite void robe");
  const voidGloves = hands.includes("void knight gloves") || hands.includes("void gloves");
  const fullVoid = voidHelm && voidCore && voidLegs && voidGloves;
  const eliteVoid =
    fullVoid &&
    (body.includes("elite void") || legs.includes("elite void"));

  if (fullVoid) {
    if (head.includes("void melee") || (combatStyle === "melee" && voidHelm)) {
      out.push("void_melee");
    } else if (head.includes("void ranger") || head.includes("void range")) {
      out.push(eliteVoid ? "elite_void_ranged" : "void_ranged");
    } else if (head.includes("void mage") || head.includes("void magic")) {
      out.push(eliteVoid ? "elite_void_magic" : "void_magic");
    } else if (combatStyle === "melee") {
      out.push("void_melee");
    } else if (combatStyle === "ranged") {
      out.push(eliteVoid ? "elite_void_ranged" : "void_ranged");
    } else if (combatStyle === "magic") {
      out.push(eliteVoid ? "elite_void_magic" : "void_magic");
    }
  }

  // Crystal armour: any crystal piece with crystal bow / Bofa
  const crystalW = countCrystalPieces(gear);
  if (
    crystalW > 0 &&
    (weapon.includes("crystal bow") ||
      weapon.includes("bow of faerdhinen") ||
      weapon.includes("bow of faerdhrinen"))
  ) {
    out.push("crystal_armour");
  }

  // Inquisitor pieces (any armour piece; crush gate is formula-side)
  if (countInquisitorBonus(gear) > 0 && combatStyle === "melee") {
    out.push("inquisitor");
  }

  // Obsidian armour + weapon
  const obbyArmour =
    names.some((n) => n.includes("obsidian helmet") || n.includes("obsidian helm")) &&
    names.some((n) => n.includes("obsidian platebody")) &&
    names.some((n) => n.includes("obsidian platelegs"));
  const obbyWeapon =
    weapon.includes("obsidian") ||
    weapon.includes("toktz-xil") ||
    weapon.includes("tzhaar-ket");
  if (obbyArmour && obbyWeapon) out.push("obsidian");

  if (neck.includes("berserker necklace") && obbyWeapon) {
    out.push("berserker_necklace");
  }

  // Virtus robes (any piece) + Dinh's when wielded
  if (
    names.some(
      (n) =>
        n.includes("virtus mask") ||
        n.includes("virtus robe top") ||
        n.includes("virtus robe bottom") ||
        n.includes("virtus")
    ) &&
    combatStyle === "magic"
  ) {
    out.push("virtus");
  }
  if (weapon.includes("dinh") && weapon.includes("bulwark")) {
    out.push("dinhs_bulwark");
  }

  return out;
}

/**
 * Merge auto-detected passives into the active modifier set.
 * Keeps user situational mods (slayer_helm) and removes auto-mods no longer
 * supported by gear when `pruneStale` is true.
 */
export const AUTO_PASSIVE_IDS = new Set([
  "twisted_bow",
  "tumekens_shadow",
  "dhl",
  "dhcb",
  "arclight",
  "keris_partisan",
  "leaf_bladed",
  "tome_of_fire",
  "salve_e",
  "salve_ei",
  "void_melee",
  "void_ranged",
  "void_magic",
  "elite_void_ranged",
  "elite_void_magic",
  "crystal_armour",
  "inquisitor",
  "obsidian",
  "berserker_necklace",
  "virtus",
  "dinhs_bulwark",
]);
