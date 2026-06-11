// Damage the target deals to the player — the defence side of the calculator.
// Uses the same accuracy formula as the offence path. Approximations: no
// protection or defence-boosting prayers, and a 4-tick attack speed when the
// wiki has none recorded (flagged in the result).

import { defenseRoll, hitChance } from "./dps";

export interface MonsterOffence {
  maxHit: number;
  attackSpeed: number;
  attackStyles: string[];
  attackLevel: number;
  magicLevel: number;
  rangedLevel: number;
  attackBonus: number;
  magicAttackBonus: number;
  rangedAttackBonus: number;
}

export interface PlayerDefence {
  defenceLevel: number;
  magicLevel: number;
  /** Gear defence bonuses by incoming attack type. */
  defStab: number;
  defSlash: number;
  defCrush: number;
  defMagic: number;
  defRanged: number;
  /** Invisible defence bonus from the current stance. */
  stanceDefenceBonus: number;
}

export type ProtectionPrayer = "none" | "melee" | "ranged" | "magic";

export interface StyleThreat {
  style: string;
  attackType: "stab" | "slash" | "crush" | "magic" | "ranged";
  accuracy: number;
  dps: number;
  /** True when an overhead prayer blocks this style entirely. */
  prayedOff: boolean;
}

export interface IncomingDpsResult {
  threats: StyleThreat[];
  /** Highest-DPS style — the planning figure for sustain. */
  worst: StyleThreat;
  assumedAttackSpeed: boolean;
}

const FALLBACK_ATTACK_SPEED = 4;

function classifyAttackStyle(
  raw: string
): "stab" | "slash" | "crush" | "magic" | "ranged" {
  const lower = raw.toLowerCase();
  if (lower.includes("magic")) return "magic";
  if (lower.includes("range")) return "ranged";
  if (lower.includes("stab")) return "stab";
  if (lower.includes("crush")) return "crush";
  // Bare "Melee" and "Slash" both land here.
  return "slash";
}

function isPrayedOff(
  attackType: StyleThreat["attackType"],
  protection: ProtectionPrayer
): boolean {
  if (protection === "magic") return attackType === "magic";
  if (protection === "ranged") return attackType === "ranged";
  if (protection === "melee") {
    return attackType === "stab" || attackType === "slash" || attackType === "crush";
  }
  return false;
}

export function incomingDps(
  monster: MonsterOffence,
  player: PlayerDefence,
  protection: ProtectionPrayer = "none"
): IncomingDpsResult | null {
  if (monster.maxHit <= 0) return null;
  const styles = monster.attackStyles.length > 0 ? monster.attackStyles : ["Melee"];
  const assumedAttackSpeed = monster.attackSpeed <= 0;
  const speed = assumedAttackSpeed ? FALLBACK_ATTACK_SPEED : monster.attackSpeed;

  const seen = new Set<string>();
  const threats: StyleThreat[] = [];
  for (const style of styles) {
    const attackType = classifyAttackStyle(style);
    if (seen.has(attackType)) continue;
    seen.add(attackType);

    let attackRoll: number;
    let playerDefRoll: number;
    if (attackType === "magic") {
      attackRoll = (monster.magicLevel + 9) * (monster.magicAttackBonus + 64);
      // Player magic defence blends 70% Magic level with 30% Defence level.
      const effMagicDef = Math.floor(player.magicLevel * 0.7) + Math.floor(player.defenceLevel * 0.3);
      playerDefRoll = defenseRoll(effMagicDef + player.stanceDefenceBonus, player.defMagic);
    } else if (attackType === "ranged") {
      attackRoll = (monster.rangedLevel + 9) * (monster.rangedAttackBonus + 64);
      playerDefRoll = defenseRoll(player.defenceLevel + player.stanceDefenceBonus, player.defRanged);
    } else {
      attackRoll = (monster.attackLevel + 9) * (monster.attackBonus + 64);
      const defBonus =
        attackType === "stab" ? player.defStab : attackType === "crush" ? player.defCrush : player.defSlash;
      playerDefRoll = defenseRoll(player.defenceLevel + player.stanceDefenceBonus, defBonus);
    }

    const accuracy = hitChance(attackRoll, playerDefRoll);
    const prayedOff = isPrayedOff(attackType, protection);
    threats.push({
      style,
      attackType,
      accuracy,
      // Overhead prayers block 100% of standard NPC attacks of that style.
      dps: prayedOff ? 0 : (accuracy * (monster.maxHit / 2)) / (speed * 0.6),
      prayedOff,
    });
  }

  threats.sort((a, b) => b.dps - a.dps);
  return { threats, worst: threats[0], assumedAttackSpeed };
}
