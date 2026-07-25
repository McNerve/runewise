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
      "virtus",
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
      "tumekens_shadow",
      "tome_of_fire",
      "berserker_necklace",
      "keris_partisan",
      "leaf_bladed",
      "dinhs_bulwark",
    ],
  },
  {
    label: "Magic buffs",
    ids: ["mark_of_darkness", "charge"],
  },
];

/** Diary / account flags stored in the modifier set but not float mults. */
const DIARY_TOGGLES: { id: string; name: string; styles: CombatStyle[]; description: string }[] = [
  {
    id: "kandarin_hard",
    name: "Kandarin hard diary",
    styles: ["ranged"],
    description: "×1.1 enchanted bolt special proc chance (PvM). Wiki diary reward.",
  },
];

// Short 1-2 line descriptions shown on hover. Effect summary + when it applies.
const MODIFIER_DESCRIPTIONS: Record<string, string> = {
  void_melee: "+10% effective Attack and Strength levels (×11/10 before max hit/roll). Full Void with melee helm.",
  void_ranged: "+10% effective Ranged level for accuracy and damage. Full Void with ranged helm.",
  elite_void_ranged: "+10% effective Ranged for accuracy; +12.5% (×9/8) for damage. Elite Void with ranged helm.",
  void_magic: "+45% effective Magic level for accuracy (×29/20). Full Void with mage helm.",
  elite_void_magic: "+45% magic accuracy; +5% magic damage (primary stage, not tripled by Shadow). Elite Void with mage helm.",
  obsidian: "+10% of base attack roll and max hit (additive). Full obsidian armour with a Tzhaar melee weapon.",
  crystal_armour: "Per-piece: acc ×(20+pieces)/20, dmg ×(40+pieces)/40 (helm 1, legs 2, body 3). Crystal bow / Bowfa.",
  inquisitor: "Crush only: +0.5%/1%/1% per piece (full set +2.5%). Applied as (200+bonus)/200.",
  virtus: "+5% magic damage on Ancient Magicks (full-set approximation).",
  slayer_helm: "+16.67% accuracy and damage while on a Slayer task (melee 7/6; ranged/magic 15%).",
  salve_ei: "+20% accuracy and damage vs. undead. Always-on replacement for Salve (e).",
  salve_e: "+20% accuracy and damage vs. undead (melee/ranged). Requires the enhanced salve amulet.",
  arclight: "Demonbane add-factor trunc(70×vuln/100)% (default +70%). Scales with demonbane vulnerability.",
  dhcb: "+30% accuracy, +25% damage vs. dragons. Requires the Dragon hunter crossbow.",
  dhl: "+20% accuracy and damage vs. dragons. Requires the Dragon hunter lance.",
  twisted_bow: "Scales with target Magic (wiki tbowScaling). Cap 250, or 350 vs Xerician (CoX) only. Double-scales at P2 Wardens.",
  tumekens_shadow: "×3 gear magic attack and magic damage % (×4 in ToA). Gear magic dmg contribution capped at 100%.",
  tome_of_fire: "+10% damage on standard fire spells (PvM). Requires charged Tome of fire.",
  berserker_necklace: "+20% damage with obsidian melee weapons (sword, maul, dagger).",
  keris_partisan: "+33% damage vs. kalphites (and in ToA). Partisan family only.",
  leaf_bladed: "+17.5% damage (47/40) vs. leafy/kurask-style monsters. No accuracy bonus.",
  dinhs_bulwark: "+20% damage with Dinh's bulwark.",
  mark_of_darkness: "Doubles demonbane spell accuracy/damage bonus (20%→40%). Arceuus Mark of Darkness.",
  charge: "+10 base max hit on god spells (Saradomin/Guthix/Zamorak Strike/Wave/Surge).",
};

function isRelevant(mod: DpsModifier, style: CombatStyle): boolean {
  return !mod.condition || mod.condition === style;
}

function ToggleChip({
  id,
  name,
  active,
  description,
  onToggle,
}: {
  id: string;
  name: string;
  active: boolean;
  description?: string;
  onToggle: (id: string) => void;
}) {
  const button = (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className={`px-2.5 py-1 rounded text-xs transition-colors ${
        active
          ? "bg-accent/20 text-accent border border-accent/30"
          : "bg-bg-tertiary text-text-secondary border border-transparent hover:border-border"
      }`}
    >
      {name}
    </button>
  );
  if (!description) return <span key={id}>{button}</span>;
  return (
    <Tooltip.Root key={id} delayDuration={200}>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Content
        className="item-tooltip-content"
        sideOffset={6}
        side="top"
        collisionPadding={8}
      >
        <div className="max-w-[240px]">
          <div className="font-semibold text-text-primary text-xs">{name}</div>
          <div className="text-[11px] text-text-secondary/80 mt-0.5 leading-snug">{description}</div>
        </div>
        <Tooltip.Arrow className="fill-[var(--color-bg-tertiary)]" />
      </Tooltip.Content>
    </Tooltip.Root>
  );
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

  const diaries = DIARY_TOGGLES.filter((d) => d.styles.includes(combatStyle));

  if (relevantGroups.length === 0 && diaries.length === 0) return null;

  return (
    <div className="space-y-3">
      {relevantGroups.map((group) => (
        <div key={group.label}>
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/40 mb-1.5">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.mods.map((mod) => (
              <ToggleChip
                key={mod.id}
                id={mod.id}
                name={mod.name}
                active={activeIds.has(mod.id)}
                description={MODIFIER_DESCRIPTIONS[mod.id]}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      ))}
      {diaries.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/40 mb-1.5">
            Diaries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {diaries.map((d) => (
              <ToggleChip
                key={d.id}
                id={d.id}
                name={d.name}
                active={activeIds.has(d.id)}
                description={d.description}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
