import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { xpForLevel, levelForXp } from "../../lib/formulas/xp";
import { getSkillXp, type HiscoreData } from "../../lib/api/hiscores";
import { useGEData } from "../../hooks/useGEData";
import { formatGp } from "../../lib/format";
import { WIKI_IMG, SKILL_ICONS, itemIcon } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import { TRAINING_METHODS } from "../../lib/data/training-methods";
import { HERBLORE_RECIPES } from "../../lib/data/herblore-recipes";
import { CRAFTING_RECIPES } from "../../lib/data/crafting-recipes";
import { fetchRecipesForSkill, type WikiRecipe } from "../../lib/api/recipes";
import RecipeCostTable from "./components/RecipeCostTable";
import WikiRecipeTable from "./components/WikiRecipeTable";
import ConstructionPlanner from "./components/ConstructionPlanner";
import { useSettings } from "../../hooks/useSettings";

const TrainingPlan = lazy(() => import("../training-plan/TrainingPlan"));
const XpTable = lazy(() => import("../xp-table/XpTable"));

type SkillTab = "calculator" | "plan" | "xp-table";

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
  const { settings } = useSettings();
  const { params, navigate } = useNavigation();
  const { mapping, prices, fetchIfNeeded } = useGEData();
  const [skillTab, setSkillTab] = useState<SkillTab>(() => params.tab === "plan" ? "plan" : "calculator");
  const normalizeSkill = (name: string | undefined): string | null => {
    if (!name) return null;
    const match = SKILLS.find((s) => s.toLowerCase() === name.toLowerCase());
    return match ?? null;
  };
  const [selectedSkill, setSelectedSkill] = useState<string | null>(normalizeSkill(params.skill));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from nav params
    setSkillTab(params.tab === "plan" ? "plan" : "calculator");
  }, [params.tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync skill from nav params
    if (params.skill) setSelectedSkill(normalizeSkill(params.skill));
  }, [params.skill]);
  const [currentXp, setCurrentXp] = useState(0);
  const [targetLevel, setTargetLevel] = useState(99);
  const [wikiRecipes, setWikiRecipes] = useState<WikiRecipe[]>([]);
  // Remember custom targets per skill
  const customTargets = useRef<Map<string, number>>(new Map());

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const itemMap = useMemo(() => {
    const nameToId = new Map<string, number>();
    for (const item of mapping) nameToId.set(item.name.toLowerCase(), item.id);
    return nameToId;
  }, [mapping]);

  const getLevel = (skill: string) =>
    hiscores?.skills.find(
      (s) => s.name.toLowerCase() === skill.toLowerCase()
    )?.level ?? null;

  const currentLevel = selectedSkill ? getLevel(selectedSkill) : null;

  // When skill changes: load XP from hiscores + restore or default target
  useEffect(() => {
    if (!selectedSkill) return;
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

  // Load wiki recipes for selected skill
  useEffect(() => {
    if (!selectedSkill) {
      setWikiRecipes([]);
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale recipes when skill changes
    setWikiRecipes([]);
    fetchRecipesForSkill(selectedSkill).then((recipes) => {
      if (!cancelled) setWikiRecipes(recipes);
    });
    return () => { cancelled = true; };
  }, [selectedSkill]);

  const handleTargetChange = (value: number) => {
    const clamped = Math.max(2, Math.min(99, value));
    setTargetLevel(clamped);
    if (selectedSkill) customTargets.current.set(selectedSkill, clamped);
  };

  const [intensityFilter, setIntensityFilter] = useState<string>("All");

  const targetXp = xpForLevel(targetLevel);
  const xpNeeded = Math.max(0, targetXp - currentXp);
  const allMethods = selectedSkill ? (TRAINING_METHODS[selectedSkill] ?? []) : [];
  const methods = intensityFilter === "All"
    ? allMethods
    : allMethods.filter((m) => m.intensity?.toLowerCase() === intensityFilter.toLowerCase());

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Skills</h2>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5">
        {([
          { id: "calculator" as const, label: "Skill Calculator", icon: `${WIKI_IMG}/Stats_icon.png` },
          { id: "plan" as const, label: "Training Plan", icon: `${WIKI_IMG}/Max_cape.png` },
          { id: "xp-table" as const, label: "XP Table", icon: `${WIKI_IMG}/Book_of_knowledge.png` },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSkillTab(tab.id)}
            aria-pressed={skillTab === tab.id}
            title={`Switch to ${tab.label}`}
            className={`home-tile flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              skillTab === tab.id
                ? "bg-accent text-on-accent border-accent"
                : "text-text-secondary border-transparent"
            }`}
          >
            <img src={tab.icon} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Training Plan tab */}
      {skillTab === "plan" && (
        <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
          <TrainingPlan hiscores={hiscores} />
        </Suspense>
      )}

      {/* XP Table tab */}
      {skillTab === "xp-table" && (
        <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
          <XpTable />
        </Suspense>
      )}

      {/* Skill Calculator tab */}
      {skillTab === "calculator" && (
      <>


      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-6">
        {SKILLS.map((skill) => {
          const level = getLevel(skill);
          return (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              aria-pressed={selectedSkill === skill}
              title={`Calculate ${skill} (level ${level ?? "?"})`}
              className={`home-tile px-2 py-1.5 rounded text-xs relative flex items-center gap-1.5 border ${
                selectedSkill === skill
                  ? "bg-accent text-on-accent border-accent"
                  : "bg-bg-tertiary text-text-secondary border-transparent"
              }`}
            >
              <img src={SKILL_ICONS[skill]} alt="" className="w-4 h-4" />
              {skill}
              {level !== null && (
                <span
                  className={`block text-[10px] ${
                    selectedSkill === skill
                      ? "text-on-accent/70"
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

      {!selectedSkill ? (
        <div className="bg-bg-tertiary rounded-lg p-8 text-center text-sm text-text-secondary">
          Pick a skill above to start calculating.
        </div>
      ) : (
      <div className="bg-bg-tertiary rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3 -mx-4 px-4 -mt-4 pt-4 mb-1">
          <div className="flex items-center gap-2">
            <img src={SKILL_ICONS[selectedSkill]} alt="" className="w-6 h-6" />
            <div>
              <div className="text-sm font-semibold text-text-primary">{selectedSkill}</div>
              {currentLevel !== null && (
                <div className="text-[11px] text-text-secondary">Level {currentLevel}</div>
              )}
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
            Editing
          </span>
        </div>
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
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
            />
            <p className="text-xs text-text-secondary mt-1">
              Level {Math.min(99, levelForXp(currentXp))}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-text-secondary">
                Target Level
              </label>
              <button
                type="button"
                onClick={() => navigate("training-plan")}
                className="text-[11px] text-text-secondary/50 hover:text-accent transition-colors"
              >
                Build training plan →
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={2}
                max={99}
                value={targetLevel}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
              />
              {currentLevel !== null && currentLevel < 99 && (
                <button
                  onClick={() => handleTargetChange(currentLevel + 1)}
                  aria-pressed={targetLevel === currentLevel + 1}
                  title="Set target to next level"
                  className={`home-tile px-2 py-1 rounded text-xs border ${
                    targetLevel === currentLevel + 1
                      ? "bg-accent text-on-accent border-accent"
                      : "bg-bg-tertiary text-text-secondary border-transparent"
                  }`}
                >
                  +1
                </button>
              )}
              <button
                onClick={() => handleTargetChange(99)}
                aria-pressed={targetLevel === 99}
                title="Set target to 99"
                className={`home-tile px-2 py-1 rounded text-xs border ${
                  targetLevel === 99
                    ? "bg-accent text-on-accent border-accent"
                    : "bg-bg-tertiary text-text-secondary border-transparent"
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
      )}

      {/* Training Methods */}
      {allMethods.length > 0 && xpNeeded > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
              Training Methods
            </h3>
            <div className="flex gap-1 ml-auto flex-wrap">
              {(["All", "AFK", "Low", "Medium", "High"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setIntensityFilter(f)}
                  aria-pressed={intensityFilter === f}
                  title={f === "All" ? "Show all training methods" : `Filter to ${f}-attention methods`}
                  className={`home-tile px-2.5 py-1 rounded-full text-xs border ${
                    intensityFilter === f
                      ? "bg-accent text-on-accent border-accent"
                      : "bg-bg-tertiary text-text-secondary border-transparent"
                  }`}
                >
                  {f}
                </button>
              ))}
              {intensityFilter !== "All" && (
                <button
                  onClick={() => setIntensityFilter("All")}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors px-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          {methods.length === 0 ? (
            <p className="text-sm text-text-secondary py-4">
              No {intensityFilter.toLowerCase()} intensity methods for {selectedSkill}.
            </p>
          ) : (
          <div className="bg-bg-tertiary rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-left px-4 py-2">Method</th>
                  <th scope="col" className="text-right px-4 py-2">Lvl</th>
                  <th scope="col" className="text-right px-4 py-2">XP Each</th>
                  <th scope="col" className="text-right px-4 py-2">XP/hr</th>
                  <th scope="col" className="text-right px-4 py-2">Actions</th>
                  <th scope="col" className="text-right px-4 py-2">Time</th>
                  <th scope="col" className="text-right px-4 py-2">GP/XP</th>
                  <th scope="col" className="text-right px-4 py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {[...methods]
                  .sort((a, b) => (b.xpPerHour ?? 0) - (a.xpPerHour ?? 0))
                  .map((method) => {
                    const maxXpHr = methods.reduce((m, x) => Math.max(m, x.xpPerHour ?? 0), 1);
                    const actions = Math.ceil(xpNeeded / method.xp);
                    const hours = method.xpPerHour ? xpNeeded / method.xpPerHour : null;
                    const meetsLevel = !method.levelReq || !currentLevel || currentLevel >= method.levelReq;
                    const itemPrice = method.itemId ? (prices[String(method.itemId)]?.high ?? prices[String(method.itemId)]?.low ?? null) : null;
                    const totalCost = itemPrice != null ? actions * (method.itemsPerAction ?? 1) * itemPrice : null;
                    return (
                      <tr
                        key={method.name}
                        className={`border-b border-border/50 even:bg-bg-primary/25 hover:bg-bg-secondary transition-colors ${!meetsLevel ? "opacity-40" : ""} ${settings.ironmanMode && method.ironmanViable === false ? "opacity-30" : ""}`}
                      >
                        <td className="px-4 py-1.5 font-medium">
                          <span className="flex items-center gap-2">
                            <img
                              src={method.itemName ? itemIcon(method.itemName) : (selectedSkill ? SKILL_ICONS[selectedSkill] : "")}
                              alt=""
                              className="w-4 h-4 shrink-0"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                            {method.name}
                            {settings.ironmanMode && method.ironmanViable === false && (
                              <span className="text-[8px] text-warning/60 border border-warning/20 rounded px-1 py-0.5">GE</span>
                            )}
                          </span>
                          {method.intensity && (
                            <span className={`ml-1.5 px-1 py-0.5 rounded text-[9px] font-normal ${
                              method.intensity === "afk" ? "bg-success/10 text-success" :
                              method.intensity === "low" ? "bg-accent/10 text-accent" :
                              method.intensity === "medium" ? "bg-warning/10 text-warning" :
                              "bg-danger/10 text-danger"
                            }`}>
                              {method.intensity.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-1.5 text-right text-text-secondary text-xs">
                          {method.levelReq ?? "—"}
                        </td>
                        <td className="px-4 py-1.5 text-right text-text-secondary">
                          {method.xp.toLocaleString()}
                        </td>
                        <td className={`px-4 py-1.5 text-right font-medium tabular-nums ${
                          method.xpPerHour
                            ? (method.xpPerHour / maxXpHr) >= 0.7 ? "text-success"
                              : (method.xpPerHour / maxXpHr) >= 0.35 ? "text-warning"
                              : "text-danger"
                            : "text-text-secondary"
                        }`}>
                          {method.xpPerHour
                            ? method.xpPerHour >= 1_000_000
                              ? `${(method.xpPerHour / 1_000_000).toFixed(1)}M`
                              : `${(method.xpPerHour / 1_000).toFixed(0)}K`
                            : "—"}
                        </td>
                        <td className="px-4 py-1.5 text-right text-accent font-medium">
                          {actions.toLocaleString()}
                        </td>
                        <td className="px-4 py-1.5 text-right text-text-secondary">
                          {hours != null
                            ? hours < 1
                              ? `${Math.ceil(hours * 60)}m`
                              : hours < 100
                                ? `${hours.toFixed(1)}h`
                                : `${Math.round(hours)}h`
                            : "—"}
                        </td>
                        <td className="px-4 py-1.5 text-right text-text-secondary text-xs tabular-nums">
                          {itemPrice != null
                            ? `${((itemPrice * (method.itemsPerAction ?? 1)) / method.xp).toFixed(1)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-1.5 text-right text-warning">
                          {totalCost != null ? formatGp(totalCost) : "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          )}

          {wikiRecipes.length > 0 && xpNeeded > 0 && (
            <WikiRecipeTable
              recipes={wikiRecipes}
              prices={prices}
              itemMap={itemMap}
              currentLevel={currentLevel ?? 1}
              xpNeeded={xpNeeded}
            />
          )}

          {wikiRecipes.length === 0 && selectedSkill === "Herblore" && xpNeeded > 0 && (
            <RecipeCostTable
              recipes={HERBLORE_RECIPES}
              prices={prices}
              currentLevel={currentLevel ?? 1}
              xpNeeded={xpNeeded}
            />
          )}

          {wikiRecipes.length === 0 && selectedSkill === "Crafting" && xpNeeded > 0 && (
            <RecipeCostTable
              recipes={CRAFTING_RECIPES}
              prices={prices}
              currentLevel={currentLevel ?? 1}
              xpNeeded={xpNeeded}
            />
          )}

          {selectedSkill === "Construction" && xpNeeded > 0 && (
            <ConstructionPlanner
              prices={prices}
              xpNeeded={xpNeeded}
              currentLevel={currentLevel ?? 1}
            />
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
