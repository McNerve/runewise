import { useState, useMemo } from "react";
import { petChance, actionsForChance } from "../../lib/formulas/pet";
import { SKILL_PETS, BOSS_PETS, type SkillPet, type BossPet } from "../../lib/data/pets";
import { petIcon } from "../../lib/sprites";
import type { HiscoreData } from "../../lib/api/hiscores";

interface Props {
  hiscores: HiscoreData | null;
}

type PetCategory = "all" | "skilling" | "boss" | "raid" | "minigame" | "other";

interface UnifiedPet {
  name: string;
  icon: string;
  source: string;
  baseRate: number;
  category: PetCategory;
  type: "skilling" | "boss";
  skillPet?: SkillPet;
  bossPet?: BossPet;
}

const CATEGORIES: { id: PetCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "skilling", label: "Skilling" },
  { id: "boss", label: "Bosses" },
  { id: "raid", label: "Raids" },
  { id: "minigame", label: "Minigames" },
  { id: "other", label: "Other" },
];

// Build unified pet list
const ALL_PETS: UnifiedPet[] = [
  ...SKILL_PETS.map((p) => ({
    name: p.name,
    icon: p.icon,
    source: p.skill,
    baseRate: p.actions[0]?.baseRate ?? 0,
    category: "skilling" as PetCategory,
    type: "skilling" as const,
    skillPet: p,
  })),
  ...BOSS_PETS.map((p) => ({
    name: p.name,
    icon: p.icon,
    source: p.source,
    baseRate: p.baseRate,
    category: (p.category ?? "boss") as PetCategory,
    type: "boss" as const,
    bossPet: p,
  })),
];

export default function PetCalculator({ hiscores }: Props) {
  const [category, setCategory] = useState<PetCategory>("all");
  const [selected, setSelected] = useState<UnifiedPet>(ALL_PETS[0]);
  const [killCount, setKillCount] = useState(0);
  const [selectedAction, setSelectedAction] = useState(SKILL_PETS[0]?.actions[0]);
  const [inputMode, setInputMode] = useState<"actions" | "xp">("actions");
  const [actionCount, setActionCount] = useState(0);
  const [xpInput, setXpInput] = useState(0);

  const filtered = useMemo(() => {
    if (category === "all") return ALL_PETS;
    return ALL_PETS.filter((p) => p.category === category);
  }, [category]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_PETS.length };
    for (const p of ALL_PETS) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const selectPet = (pet: UnifiedPet) => {
    setSelected(pet);
    setKillCount(0);
    setActionCount(0);
    setXpInput(0);
    if (pet.skillPet) {
      setSelectedAction(pet.skillPet.actions[0]);
    }
  };

  // Calculate chance
  const isSkilling = selected.type === "skilling" && selected.skillPet;
  const actions = isSkilling && selectedAction
    ? inputMode === "xp" && selectedAction.xpPerAction > 0
      ? Math.floor(xpInput / selectedAction.xpPerAction)
      : actionCount
    : 0;
  const effectiveCount = isSkilling ? actions : killCount;
  const effectiveRate = isSkilling && selectedAction ? selectedAction.baseRate : selected.baseRate;
  const chance = effectiveCount > 0 && effectiveRate > 0
    ? petChance(effectiveCount, effectiveRate) * 100
    : 0;

  const milestones = useMemo(() => {
    if (effectiveRate <= 0) return { a50: 0, a75: 0, a90: 0, a99: 0 };
    return {
      a50: actionsForChance(effectiveRate, 0.50),
      a75: actionsForChance(effectiveRate, 0.75),
      a90: actionsForChance(effectiveRate, 0.90),
      a99: actionsForChance(effectiveRate, 0.99),
    };
  }, [effectiveRate]);

  const hiscoreKc = useMemo(() => {
    if (!hiscores || isSkilling) return null;
    const boss = hiscores.activities?.find(
      (a) => a.name.toLowerCase().includes(selected.source.toLowerCase())
    );
    return boss?.score ?? null;
  }, [hiscores, selected, isSkilling]);

  const hiscoreXp = useMemo(() => {
    if (!hiscores || !isSkilling || !selected.skillPet) return null;
    const skill = hiscores.skills.find(
      (s) => s.name.toLowerCase() === selected.skillPet!.skill.toLowerCase()
    );
    return skill?.xp ?? null;
  }, [hiscores, selected, isSkilling]);

  const countLabel = isSkilling ? "actions" : "kills";

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight">Pet Chance Calculator</h2>
      <p className="text-sm text-text-secondary mb-4">Calculate your odds of receiving a pet based on KC or actions completed.</p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1 mb-4">
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] ?? 0;
          if (cat.id !== "all" && count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              aria-pressed={category === cat.id}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                category === cat.id
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {cat.label}
              <span className={`ml-1 tabular-nums ${category === cat.id ? "text-white/70" : "text-text-secondary/40"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pet icon grid + calculator */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Icon grid */}
        <div>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
            {filtered.map((pet) => {
              const isActive = selected.name === pet.name;
              return (
                <button
                  key={pet.name}
                  onClick={() => selectPet(pet)}
                  title={`${pet.name} — ${pet.source} (1/${pet.baseRate.toLocaleString()})`}
                  className={`group flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-accent/15 ring-2 ring-accent scale-105"
                      : "hover:bg-bg-secondary/50 hover:scale-105"
                  }`}
                >
                  <img
                    src={petIcon(pet.icon)}
                    alt={pet.name}
                    className={`w-8 h-8 object-contain transition-all ${isActive ? "" : "opacity-60 group-hover:opacity-100"}`}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className={`text-[9px] text-center leading-tight truncate w-full ${
                    isActive ? "text-accent font-medium" : "text-text-secondary/60"
                  }`}>
                    {pet.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calculator panel */}
        <div className="bg-bg-secondary rounded-lg p-4 space-y-4 h-fit xl:sticky xl:top-4">
          {/* Selected pet header */}
          <div className="flex items-center gap-3">
            <img
              src={petIcon(selected.icon)}
              alt=""
              className="w-10 h-10"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div>
              <div className="text-sm font-semibold">{selected.name}</div>
              <div className="text-xs text-text-secondary">
                {selected.source} · 1/{effectiveRate.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Skilling-specific controls */}
          {isSkilling && selected.skillPet && (
            <>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Method</label>
                <select
                  value={selectedAction?.name ?? ""}
                  onChange={(e) => {
                    const action = selected.skillPet!.actions.find((a) => a.name === e.target.value);
                    if (action) setSelectedAction(action);
                  }}
                  className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                >
                  {selected.skillPet.actions.map((action) => (
                    <option key={action.name} value={action.name}>
                      {action.name} (1/{action.baseRate.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setInputMode("actions")}
                  aria-pressed={inputMode === "actions"}
                  className={`px-2.5 py-1 rounded text-xs ${
                    inputMode === "actions" ? "bg-accent text-white" : "bg-bg-tertiary text-text-secondary"
                  }`}
                >
                  Actions
                </button>
                {selectedAction?.xpPerAction > 0 && (
                  <button
                    onClick={() => setInputMode("xp")}
                    aria-pressed={inputMode === "xp"}
                    className={`px-2.5 py-1 rounded text-xs ${
                      inputMode === "xp" ? "bg-accent text-white" : "bg-bg-tertiary text-text-secondary"
                    }`}
                  >
                    XP
                  </button>
                )}
                {hiscoreXp != null && (
                  <button
                    onClick={() => { setInputMode("xp"); setXpInput(hiscoreXp); }}
                    className="px-2.5 py-1 rounded text-xs bg-bg-tertiary text-accent hover:bg-accent/15"
                  >
                    Hiscores
                  </button>
                )}
              </div>

              {inputMode === "actions" ? (
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Actions Completed</label>
                  <input type="number" min={0} value={actionCount || ""} onChange={(e) => setActionCount(Number(e.target.value) || 0)}
                    className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    XP Earned
                    {selectedAction && actions > 0 && <span className="text-text-secondary/40"> = {actions.toLocaleString()} actions</span>}
                  </label>
                  <input type="number" min={0} value={xpInput || ""} onChange={(e) => setXpInput(Number(e.target.value) || 0)}
                    className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm" />
                </div>
              )}
            </>
          )}

          {/* Boss-specific controls */}
          {!isSkilling && (
            <div>
              <div className="flex gap-1.5 mb-2">
                {hiscoreKc != null && hiscoreKc > 0 && (
                  <button
                    onClick={() => setKillCount(hiscoreKc)}
                    className="px-2.5 py-1 rounded text-xs bg-bg-tertiary text-accent hover:bg-accent/15"
                  >
                    Use Hiscores ({hiscoreKc.toLocaleString()} kc)
                  </button>
                )}
              </div>
              <label className="block text-xs text-text-secondary mb-1">Kill Count</label>
              <input type="number" min={0} value={killCount || ""} onChange={(e) => setKillCount(Number(e.target.value) || 0)}
                className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm" />
            </div>
          )}

          {/* Results */}
          <div className="border-t border-border pt-4">
            <div className="text-center mb-3">
              <span className={`text-4xl font-bold tabular-nums ${
                chance >= 90 ? "text-danger" : chance >= 50 ? "text-warning" : "text-success"
              }`}>
                {chance.toFixed(2)}%
              </span>
              <p className="text-xs text-text-secondary mt-1">
                chance of receiving pet in {effectiveCount.toLocaleString()} {countLabel}
              </p>
            </div>

            <div className="w-full bg-bg-tertiary rounded-full h-2 mb-4">
              <div
                className={`rounded-full h-2 transition-all ${
                  chance >= 90 ? "bg-danger" : chance >= 50 ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${Math.min(100, chance)}%` }}
              />
            </div>

            <div className="space-y-1.5 text-sm">
              {[
                { label: "50% chance", value: milestones.a50 },
                { label: "75% chance", value: milestones.a75 },
                { label: "90% chance", value: milestones.a90 },
                { label: "99% chance", value: milestones.a99 },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-secondary">{label}</span>
                  <span className="tabular-nums">{value.toLocaleString()} {countLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
