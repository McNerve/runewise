import { useState, useEffect } from "react";
import { xpForLevel } from "../../lib/formulas/xp";
import { getSkillXp, type HiscoreData } from "../../lib/api/hiscores";
import { SKILL_ICONS } from "../../lib/sprites";

const SKILLS = [
  "Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic",
  "Runecraft", "Hitpoints", "Crafting", "Mining", "Smithing",
  "Fishing", "Cooking", "Firemaking", "Woodcutting", "Agility",
  "Herblore", "Thieving", "Fletching", "Slayer", "Farming",
  "Construction", "Hunter", "Sailing",
] as const;

interface Props {
  hiscores: HiscoreData | null;
}

export default function SkillCalculator({ hiscores }: Props) {
  const [selectedSkill, setSelectedSkill] = useState<string>("Attack");
  const [currentXp, setCurrentXp] = useState(0);
  const [targetLevel, setTargetLevel] = useState(99);

  useEffect(() => {
    if (hiscores) {
      const xp = getSkillXp(hiscores, selectedSkill);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external hiscores data, user can override
      setCurrentXp(xp);
    }
  }, [hiscores, selectedSkill]);

  const targetXp = xpForLevel(targetLevel);
  const xpNeeded = Math.max(0, targetXp - currentXp);

  const getLevel = (skill: string) =>
    hiscores?.skills.find(
      (s) => s.name.toLowerCase() === skill.toLowerCase()
    )?.level ?? null;

  const currentLevel = getLevel(selectedSkill);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Skill Calculator</h2>

      <div className="grid grid-cols-6 gap-1.5 mb-6">
        {SKILLS.map((skill) => {
          const level = getLevel(skill);
          return (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={`px-2 py-1.5 rounded text-xs transition-colors relative flex items-center gap-1.5 ${
                selectedSkill === skill
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              <img src={SKILL_ICONS[skill]} alt="" className="w-4 h-4" />
              {skill}
              {level !== null && (
                <span
                  className={`block text-[10px] ${
                    selectedSkill === skill
                      ? "text-white/70"
                      : level >= 99
                        ? "text-success/70"
                        : "text-text-secondary/50"
                  }`}
                >
                  {level}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-bg-secondary rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Current XP {hiscores && "(from Hiscores)"}
            </label>
            <input
              type="number"
              min={0}
              value={currentXp}
              onChange={(e) => setCurrentXp(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            />
            {currentLevel !== null && (
              <p className="text-xs text-text-secondary mt-1">
                Level {currentLevel}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Target Level
            </label>
            <input
              type="number"
              min={2}
              max={99}
              value={targetLevel}
              onChange={(e) => setTargetLevel(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Current XP</span>
            <span>{currentXp.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Target XP</span>
            <span>{targetXp.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-accent">XP Remaining</span>
            <span className="text-accent">{xpNeeded.toLocaleString()}</span>
          </div>
          {currentXp > 0 && (
            <div className="w-full bg-bg-tertiary rounded-full h-2 mt-2">
              <div
                className="bg-accent rounded-full h-2 transition-all"
                style={{
                  width: `${Math.min(100, (currentXp / targetXp) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
