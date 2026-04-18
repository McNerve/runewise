import { memo } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
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

// Short 1-2 line descriptions shown on hover. Effect summary + when it applies.
const MODIFIER_DESCRIPTIONS: Record<string, string> = {
  void_melee: "+10% accuracy and damage. Full Void set with melee helm.",
  void_ranged: "+10% accuracy and damage. Full Void set with ranged helm.",
  elite_void_ranged: "+10% accuracy, +12.5% damage. Elite Void with ranged helm.",
  void_magic: "+45% accuracy. Full Void set with magic helm.",
  elite_void_magic: "+45% accuracy, +2.5% damage. Elite Void with magic helm.",
  obsidian: "+10% accuracy and damage. Full obsidian armour with an obsidian melee weapon.",
  crystal_armour: "+30% accuracy, +15% damage. Full crystal set with a crystal bow or Bow of Faerdhinen.",
  inquisitor: "+2.5% accuracy and damage with crush attacks. Scales up with more set pieces.",
  slayer_helm: "+16.67% accuracy and damage while on a Slayer task.",
  salve_ei: "+20% accuracy and damage vs. undead. Always-on replacement for Salve (e).",
  salve_e: "+20% accuracy and damage vs. undead. Requires the enhanced salve amulet.",
  arclight: "+70% accuracy and damage vs. demons. Requires Arclight wielded.",
  dhcb: "+30% accuracy, +25% damage vs. dragons. Requires the Dragon hunter crossbow.",
  dhl: "+20% accuracy and damage vs. dragons. Requires the Dragon hunter lance.",
  twisted_bow: "Scales with target Magic level (up to +140% acc, +250% dmg). Caps vs. CoX bosses.",
  tome_of_fire: "+50% damage on fire spells. Requires charged Tome of fire.",
  berserker_necklace: "+20% damage with obsidian melee weapons (sword, maul, dagger).",
  keris_partisan: "+33% damage vs. kalphites (and in ToA). Partisan family only.",
  leaf_bladed: "+17.5% accuracy and damage vs. leafy/kurask-style monsters.",
};

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
            {group.mods.map((mod) => {
              const description = MODIFIER_DESCRIPTIONS[mod.id];
              const button = (
                <button
                  onClick={() => onToggle(mod.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    activeIds.has(mod.id)
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-bg-tertiary text-text-secondary border border-transparent hover:border-border"
                  }`}
                >
                  {mod.name}
                </button>
              );
              if (!description) return <span key={mod.id}>{button}</span>;
              return (
                <Tooltip.Root key={mod.id} delayDuration={200}>
                  <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
                  <Tooltip.Content
                    className="item-tooltip-content"
                    sideOffset={6}
                    side="top"
                    collisionPadding={8}
                  >
                    <div className="max-w-[240px]">
                      <div className="font-semibold text-text-primary text-xs">{mod.name}</div>
                      <div className="text-[11px] text-text-secondary/80 mt-0.5 leading-snug">
                        {description}
                      </div>
                    </div>
                    <Tooltip.Arrow className="fill-[var(--color-bg-tertiary)]" />
                  </Tooltip.Content>
                </Tooltip.Root>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
