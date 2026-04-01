import { useState, useEffect, useRef } from "react";
import { xpForLevel } from "../../lib/formulas/xp";
import { getSkillXp, type HiscoreData } from "../../lib/api/hiscores";
import { SKILL_ICONS } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import { TRAINING_METHODS } from "../../lib/data/training-methods";

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
  const { params } = useNavigation();
  const [selectedSkill, setSelectedSkill] = useState<string>(params.skill ?? "Attack");
  const [currentXp, setCurrentXp] = useState(0);
  const [targetLevel, setTargetLevel] = useState(99);
  // Remember custom targets per skill
  const customTargets = useRef<Map<string, number>>(new Map());

  const getLevel = (skill: string) =>
    hiscores?.skills.find(
      (s) => s.name.toLowerCase() === skill.toLowerCase()
    )?.level ?? null;

  const currentLevel = getLevel(selectedSkill);

  // When skill changes: load XP from hiscores + restore or default target
  useEffect(() => {
    if (hiscores) {
      const xp = getSkillXp(hiscores, selectedSkill);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external hiscores data
      setCurrentXp(xp);
    }

    const saved = customTargets.current.get(selectedSkill);
    if (saved !== undefined) {
      setTargetLevel(saved);
    } else if (currentLevel !== null && currentLevel < 99) {
      setTargetLevel(currentLevel + 1);
    } else {
      setTargetLevel(99);
    }
  }, [hiscores, selectedSkill]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTargetChange = (value: number) => {
    setTargetLevel(value);
    customTargets.current.set(selectedSkill, value);
  };

  const targetXp = xpForLevel(targetLevel);
  const xpNeeded = Math.max(0, targetXp - currentXp);
  const methods = TRAINING_METHODS[selectedSkill] ?? [];

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
            <div className="flex gap-2">
              <input
                type="number"
                min={2}
                max={126}
                value={targetLevel}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="flex-1 bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
              />
              {currentLevel !== null && currentLevel < 99 && (
                <button
                  onClick={() => handleTargetChange(currentLevel + 1)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    targetLevel === currentLevel + 1
                      ? "bg-accent text-white"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                  }`}
                >
                  +1
                </button>
              )}
              <button
                onClick={() => handleTargetChange(99)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  targetLevel === 99
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80"
                }`}
              >
                99
              </button>
            </div>
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

      {/* Training Methods */}
      {methods.length > 0 && xpNeeded > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Training Methods
          </h3>
          <div className="bg-bg-secondary rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th className="text-left px-4 py-2">Method</th>
                  <th className="text-right px-4 py-2">XP Each</th>
                  <th className="text-right px-4 py-2">Actions Needed</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => {
                  const actions = Math.ceil(xpNeeded / method.xp);
                  return (
                    <tr
                      key={method.name}
                      className="border-b border-border/50 hover:bg-bg-tertiary transition-colors"
                    >
                      <td className="px-4 py-1.5 font-medium">{method.name}</td>
                      <td className="px-4 py-1.5 text-right text-text-secondary">
                        {method.xp.toLocaleString()}
                      </td>
                      <td className="px-4 py-1.5 text-right text-accent font-medium">
                        {actions.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
