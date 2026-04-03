import { useState, useMemo } from "react";
import type { HiscoreData } from "../../lib/api/hiscores";
import { generatePlan, type TrainingPreference } from "../../lib/formulas/trainingPlan";
import { formatGp } from "../../lib/format";
import { SKILL_ICONS } from "../../lib/sprites";

const SKILLS = [
  "Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic",
  "Runecraft", "Hitpoints", "Crafting", "Mining", "Smithing",
  "Fishing", "Cooking", "Firemaking", "Woodcutting", "Agility",
  "Herblore", "Thieving", "Fletching", "Slayer", "Farming",
  "Construction", "Hunter",
];

function getSkillLevel(hiscores: HiscoreData | null, name: string): number {
  if (!hiscores) return 1;
  return hiscores.skills.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  )?.level ?? 1;
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 100) return `${h.toFixed(1)}h`;
  return `${Math.round(h)}h`;
}

function hourColor(h: number): string {
  if (h < 10) return "text-success";
  if (h < 50) return "text-warning";
  return "text-danger";
}

interface Props {
  hiscores: HiscoreData | null;
}

const PREFERENCES: { id: TrainingPreference; label: string; desc: string }[] = [
  { id: "fastest", label: "Fastest XP", desc: "Maximizes XP/hr regardless of effort" },
  { id: "afk", label: "AFK Priority", desc: "Prefers low-intensity methods" },
  { id: "cheapest", label: "Cheapest", desc: "Avoids expensive consumables" },
];

export default function TrainingPlan({ hiscores }: Props) {
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [preference, setPreference] = useState<TrainingPreference>("fastest");
  const [methodOverrides, setMethodOverrides] = useState<Record<string, string>>({});
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const currentLevels = useMemo(() => {
    const levels: Record<string, number> = {};
    for (const skill of SKILLS) {
      levels[skill] = getSkillLevel(hiscores, skill);
    }
    return levels;
  }, [hiscores]);

  const plan = useMemo(
    () => generatePlan(currentLevels, targets, preference),
    [currentLevels, targets, preference]
  );

  function setTarget(skill: string, level: number) {
    setTargets((prev) => ({ ...prev, [skill]: level }));
  }

  function setAllTo(level: number) {
    const next: Record<string, number> = {};
    for (const skill of SKILLS) next[skill] = level;
    setTargets(next);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-5">Training Plan</h2>

      {/* Quick presets */}
      <div className="section-kicker mb-2">Quick Presets</div>
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setAllTo(99)}
          className="px-3 py-1.5 rounded text-xs bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors"
        >
          All 99
        </button>
        <button
          onClick={() => {
            setTarget("Attack", 99);
            setTarget("Strength", 99);
            setTarget("Defence", 99);
            setTarget("Ranged", 99);
            setTarget("Prayer", 99);
            setTarget("Magic", 99);
            setTarget("Hitpoints", 99);
          }}
          className="px-3 py-1.5 rounded text-xs bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors"
        >
          Max Combat
        </button>
        <button
          onClick={() => setTargets({})}
          className="px-3 py-1.5 rounded text-xs bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Training preference */}
      <div className="section-kicker mb-2">Training Preference</div>
      <div className="flex gap-2 mb-5">
        {PREFERENCES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreference(p.id)}
            title={p.desc}
            aria-pressed={preference === p.id}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              preference === p.id
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Skill grid */}
      <div className="section-kicker mb-3">Set target levels</div>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {SKILLS.map((skill) => {
          const current = currentLevels[skill] ?? 1;
          const target = targets[skill] ?? current;
          const hasGap = target > current;

          return (
            <div
              key={skill}
              className={`flex items-center gap-2 px-2.5 py-2 rounded transition-colors border ${
                hasGap
                  ? "bg-accent/8 border-accent/20"
                  : "bg-bg-secondary/50 border-transparent"
              }`}
            >
              <img
                src={SKILL_ICONS[skill]}
                alt=""
                className="w-4 h-4 shrink-0"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <span className={`text-xs truncate flex-1 ${hasGap ? "text-text-primary" : "text-text-secondary"}`}>{skill}</span>
              <span className="text-xs text-text-secondary/50 tabular-nums w-5 text-right">
                {current}
              </span>
              <span className="text-text-secondary/30 text-xs">→</span>
              <input
                type="number"
                min={current}
                max={126}
                value={target}
                onChange={(e) => setTarget(skill, Math.max(current, Number(e.target.value)))}
                className={`w-10 bg-bg-tertiary border rounded px-1 py-0.5 text-xs text-center tabular-nums ${
                  hasGap ? "border-accent/30" : "border-border"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Plan output */}
      {plan.steps.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-kicker">
              Plan ({plan.steps.length} skill{plan.steps.length !== 1 ? "s" : ""})
            </div>
            <div className={`text-sm font-medium tabular-nums ${hourColor(plan.totalHours)}`}>
              ~{formatHours(plan.totalHours)} total
            </div>
          </div>

          <div className="space-y-2">
            {plan.steps.map((step) => {
              const activeMethodName = methodOverrides[step.skill] ?? step.method.name;
              const activeMethod = step.alternatives.find((a) => a.name === activeMethodName) ?? step.method;
              const displayHours = activeMethod.xpPerHour && activeMethod.xpPerHour > 0
                ? step.xpNeeded / activeMethod.xpPerHour
                : step.hours;
              return (
                <div key={step.skill} className="border-b border-border/15 pb-1">
                  <button
                    onClick={() => setExpandedSkill(expandedSkill === step.skill ? null : step.skill)}
                    className="text-left w-full flex items-center gap-3 py-2"
                  >
                    <img
                      src={SKILL_ICONS[step.skill]}
                      alt=""
                      className="w-5 h-5 shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{step.skill}</span>
                        <span className="text-xs text-text-secondary tabular-nums">
                          {step.fromLevel} → {step.toLevel}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {activeMethod.name}
                        {activeMethod.intensity && (
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                            activeMethod.intensity === "afk" ? "bg-success/10 text-success" :
                            activeMethod.intensity === "low" ? "bg-accent/10 text-accent" :
                            activeMethod.intensity === "medium" ? "bg-warning/10 text-warning" :
                            "bg-danger/10 text-danger"
                          }`}>
                            {activeMethod.intensity.toUpperCase()}
                          </span>
                        )}
                        <span className="text-[10px] text-text-secondary/40 ml-1">
                          {step.alternatives.length > 1 ? `${step.alternatives.length} methods ▾` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-medium tabular-nums ${hourColor(displayHours)}`}>
                        {formatHours(displayHours)}
                      </div>
                      <div className="text-[10px] text-text-secondary/50 tabular-nums">
                        {formatGp(step.xpNeeded)} XP
                      </div>
                    </div>
                  </button>
                  {expandedSkill === step.skill && step.alternatives.length > 1 && (
                    <div className="ml-8 mt-1 mb-2 space-y-1">
                      {step.alternatives.map((alt) => (
                        <button
                          key={alt.name}
                          onClick={() => {
                            setMethodOverrides((prev) => ({ ...prev, [step.skill]: alt.name }));
                            setExpandedSkill(null);
                          }}
                          className={`block w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                            activeMethodName === alt.name
                              ? "bg-accent/20 text-accent"
                              : "hover:bg-bg-tertiary text-text-secondary"
                          }`}
                        >
                          <span className="font-medium">{alt.name}</span>
                          <span className="ml-2 text-text-secondary/60">
                            {alt.xpPerHour ? `${(alt.xpPerHour / 1000).toFixed(0)}K xp/hr` : ""}
                            {alt.intensity ? ` · ${alt.intensity}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-text-secondary">
          {hiscores
            ? "Set target levels above to generate a training plan."
            : "Look up your RSN above, then set target levels to generate a plan."}
        </div>
      )}
    </div>
  );
}
