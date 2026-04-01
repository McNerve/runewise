import { type HiscoreData } from "../../lib/api/hiscores";
import { xpForLevel } from "../../lib/formulas/xp";
import { combatLevel } from "../../lib/formulas/combat";
import { SKILL_ICONS } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";

interface Props {
  hiscores: HiscoreData;
  rsn: string;
}

const SKILL_ORDER = [
  "Attack", "Hitpoints", "Mining",
  "Strength", "Agility", "Smithing",
  "Defence", "Herblore", "Fishing",
  "Ranged", "Thieving", "Cooking",
  "Prayer", "Crafting", "Firemaking",
  "Magic", "Fletching", "Woodcutting",
  "Runecraft", "Slayer", "Farming",
  "Construction", "Hunter", "Sailing",
];

export default function Overview({ hiscores, rsn }: Props) {
  const { navigate } = useNavigation();
  const totalLevel = hiscores.skills
    .filter((s) => s.name !== "Overall")
    .reduce((sum, s) => sum + s.level, 0);
  const totalXp = hiscores.skills.find((s) => s.name === "Overall")?.xp ?? 0;
  const overallRank = hiscores.skills.find((s) => s.name === "Overall")?.rank ?? 0;

  const get = (name: string) =>
    hiscores.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());

  const cmb = combatLevel({
    attack: get("Attack")?.level ?? 1,
    strength: get("Strength")?.level ?? 1,
    defence: get("Defence")?.level ?? 1,
    hitpoints: get("Hitpoints")?.level ?? 1,
    prayer: get("Prayer")?.level ?? 1,
    ranged: get("Ranged")?.level ?? 1,
    magic: get("Magic")?.level ?? 1,
  });

  const maxedSkills = hiscores.skills.filter(
    (s) => s.name !== "Overall" && s.level >= 99
  ).length;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">{rsn}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-accent">
            {cmb.toFixed(0)}
          </div>
          <div className="text-xs text-text-secondary">Combat</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{totalLevel.toLocaleString()}</div>
          <div className="text-xs text-text-secondary">Total Level</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">
            {totalXp >= 1_000_000_000
              ? `${(totalXp / 1_000_000_000).toFixed(1)}B`
              : `${(totalXp / 1_000_000).toFixed(0)}M`}
          </div>
          <div className="text-xs text-text-secondary">Total XP</div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-success">
            {maxedSkills}/24
          </div>
          <div className="text-xs text-text-secondary">Maxed Skills</div>
        </div>
      </div>

      {overallRank > 0 && (
        <p className="text-xs text-text-secondary mb-4">
          Overall rank #{overallRank.toLocaleString()}
        </p>
      )}

      {/* Skill grid — 3 columns, OSRS layout */}
      <div className="grid grid-cols-3 gap-1.5">
        {SKILL_ORDER.map((skillName) => {
          const skill = get(skillName);
          if (!skill) return null;
          const progress =
            skill.level < 99
              ? ((skill.xp - xpForLevel(skill.level)) /
                  (xpForLevel(skill.level + 1) - xpForLevel(skill.level))) *
                100
              : 100;

          return (
            <button
              key={skillName}
              onClick={() => navigate("skill-calc", { skill: skillName })}
              className="bg-bg-secondary rounded px-3 py-2 flex items-center justify-between hover:bg-bg-tertiary transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <img src={SKILL_ICONS[skillName]} alt="" className="w-4 h-4" />
                <span
                  className={`text-sm font-medium ${
                    skill.level >= 99 ? "text-success" : ""
                  }`}
                >
                  {skill.level}
                </span>
                <span className="text-xs text-text-secondary">{skillName}</span>
              </div>
              <div className="flex items-center gap-2">
                {skill.level < 99 ? (
                  <div className="w-16 bg-bg-tertiary rounded-full h-1.5">
                    <div
                      className="bg-accent rounded-full h-1.5"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                ) : (
                  <span className="text-[10px] text-success">MAX</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
