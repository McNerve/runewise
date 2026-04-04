import { memo } from "react";
import { DPS_MODIFIERS, type DpsModifier } from "../../../lib/formulas/dps";

type CombatStyle = "melee" | "ranged" | "magic";

interface ModifierTogglesProps {
  activeIds: Set<string>;
  onToggle: (id: string) => void;
  combatStyle: CombatStyle;
}

const MODIFIER_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: "Set bonuses",
    ids: [
      "void_melee",
      "void_ranged",
      "elite_void_ranged",
      "void_magic",
      "elite_void_magic",
      "obsidian",
      "crystal_armour",
      "inquisitor",
    ],
  },
  {
    label: "On-task / Undead",
    ids: ["slayer_helm", "salve_ei", "salve_e"],
  },
  {
    label: "Special weapons",
    ids: [
      "arclight",
      "dhcb",
      "dhl",
      "twisted_bow",
      "tome_of_fire",
      "berserker_necklace",
      "keris_partisan",
      "leaf_bladed",
    ],
  },
];

function isRelevant(mod: DpsModifier, style: CombatStyle): boolean {
  return !mod.condition || mod.condition === style;
}

export default memo(function ModifierToggles({
  activeIds,
  onToggle,
  combatStyle,
}: ModifierTogglesProps) {
  const relevantGroups = MODIFIER_GROUPS.map((group) => ({
    ...group,
    mods: group.ids
      .map((id) => DPS_MODIFIERS[id])
      .filter((m): m is DpsModifier => m != null && isRelevant(m, combatStyle)),
  })).filter((g) => g.mods.length > 0);

  if (relevantGroups.length === 0) return null;

  return (
    <div className="space-y-3">
      {relevantGroups.map((group) => (
        <div key={group.label}>
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/40 mb-1.5">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.mods.map((mod) => (
              <button
                key={mod.id}
                onClick={() => onToggle(mod.id)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeIds.has(mod.id)
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-bg-tertiary text-text-secondary border border-transparent hover:border-border"
                }`}
              >
                {mod.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
