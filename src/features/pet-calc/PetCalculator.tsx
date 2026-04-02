import { useState, useMemo } from "react";
import { petChance, actionsForChance } from "../../lib/formulas/pet";
import { SKILL_PETS, BOSS_PETS, type SkillPet, type BossPet } from "../../lib/data/pets";
import { petIcon } from "../../lib/sprites";
import type { HiscoreData } from "../../lib/api/hiscores";

interface Props {
  hiscores: HiscoreData | null;
}

type Tab = "skilling" | "boss";

const BOSS_CATEGORIES = ["boss", "raid", "minigame", "other"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  boss: "Bosses",
  raid: "Raids",
  minigame: "Minigames",
  other: "Other",
};

export default function PetCalculator({ hiscores }: Props) {
  const [tab, setTab] = useState<Tab>("skilling");

  // Skilling state
  const [selectedPet, setSelectedPet] = useState<SkillPet>(SKILL_PETS[0]);
  const [selectedAction, setSelectedAction] = useState(SKILL_PETS[0].actions[0]);
  const [inputMode, setInputMode] = useState<"actions" | "xp">("actions");
  const [actionCount, setActionCount] = useState(0);
  const [xpInput, setXpInput] = useState(0);

  // Boss state
  const [selectedBossPet, setSelectedBossPet] = useState<BossPet>(BOSS_PETS[0]);
  const [killCount, setKillCount] = useState(0);

  // Skilling calcs
  const actions = useMemo(() => {
    if (inputMode === "actions") return actionCount;
    if (selectedAction.xpPerAction <= 0) return 0;
    return Math.floor(xpInput / selectedAction.xpPerAction);
  }, [inputMode, actionCount, xpInput, selectedAction]);

  const skillChance = actions > 0 && selectedAction.baseRate > 0
    ? petChance(actions, selectedAction.baseRate) * 100
    : 0;

  const skillMilestones = useMemo(() => {
    const rate = selectedAction.baseRate;
    if (rate <= 0) return { a50: 0, a75: 0, a90: 0, a99: 0 };
    return {
      a50: actionsForChance(rate, 0.50),
      a75: actionsForChance(rate, 0.75),
      a90: actionsForChance(rate, 0.90),
      a99: actionsForChance(rate, 0.99),
    };
  }, [selectedAction]);

  // Boss calcs
  const bossChance = killCount > 0 && selectedBossPet.baseRate > 0
    ? petChance(killCount, selectedBossPet.baseRate) * 100
    : 0;

  const bossMilestones = useMemo(() => {
    const rate = selectedBossPet.baseRate;
    if (rate <= 0) return { a50: 0, a75: 0, a90: 0, a99: 0 };
    return {
      a50: actionsForChance(rate, 0.50),
      a75: actionsForChance(rate, 0.75),
      a90: actionsForChance(rate, 0.90),
      a99: actionsForChance(rate, 0.99),
    };
  }, [selectedBossPet]);

  const hiscoreXp = useMemo(() => {
    if (!hiscores) return null;
    const skill = hiscores.skills.find(
      (s) => s.name.toLowerCase() === selectedPet.skill.toLowerCase()
    );
    return skill?.xp ?? null;
  }, [hiscores, selectedPet]);

  const hiscoreKc = useMemo(() => {
    if (!hiscores) return null;
    const boss = hiscores.activities?.find(
      (a) => a.name.toLowerCase().includes(selectedBossPet.source.toLowerCase())
    );
    return boss?.score ?? null;
  }, [hiscores, selectedBossPet]);

  const handlePetChange = (petName: string) => {
    const pet = SKILL_PETS.find((p) => p.name === petName);
    if (!pet) return;
    setSelectedPet(pet);
    setSelectedAction(pet.actions[0]);
    setActionCount(0);
    setXpInput(0);
  };

  const handleActionChange = (actionName: string) => {
    const action = selectedPet.actions.find((a) => a.name === actionName);
    if (action) setSelectedAction(action);
  };

  const handleBossPetChange = (petName: string) => {
    const pet = BOSS_PETS.find((p) => p.name === petName);
    if (pet) {
      setSelectedBossPet(pet);
      setKillCount(0);
    }
  };

  const chance = tab === "skilling" ? skillChance : bossChance;
  const milestones = tab === "skilling" ? skillMilestones : bossMilestones;
  const count = tab === "skilling" ? actions : killCount;
  const countLabel = tab === "skilling" ? "actions" : "kills";

  const resultBlock = (
    <div className="border-t border-border pt-4">
      <div className="text-center mb-3">
        <span
          className={`text-4xl font-bold ${
            chance >= 90 ? "text-danger" : chance >= 50 ? "text-warning" : "text-success"
          }`}
        >
          {chance.toFixed(2)}%
        </span>
        <p className="text-xs text-text-secondary mt-1">
          chance of receiving pet in {count.toLocaleString()} {countLabel}
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
        <div className="flex justify-between">
          <span className="text-text-secondary">50% chance</span>
          <span>{milestones.a50.toLocaleString()} {countLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">75% chance</span>
          <span>{milestones.a75.toLocaleString()} {countLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">90% chance</span>
          <span>{milestones.a90.toLocaleString()} {countLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">99% chance</span>
          <span>{milestones.a99.toLocaleString()} {countLabel}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Pet Chance Calculator</h2>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setTab("skilling")}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            tab === "skilling" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
          }`}
        >
          Skilling Pets ({SKILL_PETS.length})
        </button>
        <button
          onClick={() => setTab("boss")}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            tab === "boss" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
          }`}
        >
          Boss & Other Pets ({BOSS_PETS.length})
        </button>
      </div>

      <div className="grid grid-cols-[1fr_260px] gap-4">
        {/* Left panel - calculator */}
        <div className="bg-bg-secondary rounded-lg p-4 space-y-4">
          {tab === "skilling" ? (
            <>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Pet</label>
                <div className="flex items-center gap-2">
                  <img
                    src={petIcon(selectedPet.icon)}
                    alt=""
                    className="w-6 h-6"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <select
                    value={selectedPet.name}
                    onChange={(e) => handlePetChange(e.target.value)}
                    className="flex-1 bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                  >
                    {SKILL_PETS.map((pet) => (
                      <option key={pet.name} value={pet.name}>
                        {pet.name} ({pet.skill})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Action</label>
                <select
                  value={selectedAction.name}
                  onChange={(e) => handleActionChange(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                >
                  {selectedPet.actions.map((action) => (
                    <option key={action.name} value={action.name}>
                      {action.name} (1/{action.baseRate.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setInputMode("actions")}
                    className={`px-3 py-1 rounded text-xs ${
                      inputMode === "actions" ? "bg-accent text-white" : "bg-bg-tertiary text-text-secondary"
                    }`}
                  >
                    Action Count
                  </button>
                  {selectedAction.xpPerAction > 0 && (
                    <button
                      onClick={() => setInputMode("xp")}
                      className={`px-3 py-1 rounded text-xs ${
                        inputMode === "xp" ? "bg-accent text-white" : "bg-bg-tertiary text-text-secondary"
                      }`}
                    >
                      XP Input
                    </button>
                  )}
                  {hiscoreXp != null && (
                    <button
                      onClick={() => { setInputMode("xp"); setXpInput(hiscoreXp); }}
                      className="px-3 py-1 rounded text-xs bg-bg-tertiary text-accent hover:bg-accent/15"
                    >
                      Use Hiscores ({hiscoreXp.toLocaleString()} xp)
                    </button>
                  )}
                </div>

                {inputMode === "actions" ? (
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Actions Completed</label>
                    <input
                      type="number"
                      min={0}
                      value={actionCount}
                      onChange={(e) => setActionCount(Number(e.target.value))}
                      className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      XP Earned ({selectedAction.xpPerAction} xp/action = {actions.toLocaleString()} actions)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={xpInput}
                      onChange={(e) => setXpInput(Number(e.target.value))}
                      className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Pet</label>
                <div className="flex items-center gap-2">
                  <img
                    src={petIcon(selectedBossPet.icon)}
                    alt=""
                    className="w-6 h-6"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <select
                    value={selectedBossPet.name}
                    onChange={(e) => handleBossPetChange(e.target.value)}
                    className="flex-1 bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                  >
                    {BOSS_PETS.map((pet) => (
                      <option key={pet.name} value={pet.name}>
                        {pet.name} — {pet.source} (1/{pet.baseRate.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex gap-2 mb-2">
                  {hiscoreKc != null && hiscoreKc > 0 && (
                    <button
                      onClick={() => setKillCount(hiscoreKc)}
                      className="px-3 py-1 rounded text-xs bg-bg-tertiary text-accent hover:bg-accent/15"
                    >
                      Use Hiscores ({hiscoreKc.toLocaleString()} kc)
                    </button>
                  )}
                </div>
                <label className="block text-xs text-text-secondary mb-1">
                  Kill Count (1/{selectedBossPet.baseRate.toLocaleString()} drop rate)
                </label>
                <input
                  type="number"
                  min={0}
                  value={killCount}
                  onChange={(e) => setKillCount(Number(e.target.value))}
                  className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {resultBlock}
        </div>

        {/* Right panel - pet list */}
        <div className="bg-bg-secondary rounded-lg p-3 overflow-y-auto max-h-[600px]">
          {tab === "skilling" ? (
            <>
              <div className="text-xs text-text-secondary mb-2">All Skill Pets</div>
              <div className="space-y-0.5">
                {SKILL_PETS.map((pet) => (
                  <button
                    key={pet.name}
                        onClick={() => handlePetChange(pet.name)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                      selectedPet.name === pet.name ? "bg-accent/15 text-accent" : "hover:bg-bg-tertiary text-text-secondary"
                    }`}
                  >
                    <img src={petIcon(pet.icon)} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <div>
                      <div className="font-medium text-text-primary">{pet.name}</div>
                      <div>{pet.skill}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {BOSS_CATEGORIES.map((cat) => {
                const pets = BOSS_PETS.filter((p) => p.category === cat);
                if (pets.length === 0) return null;
                return (
                  <div key={cat} className="mb-3">
                    <div className="text-[9px] uppercase tracking-widest text-text-secondary/40 px-2 pt-2 pb-1">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    <div className="space-y-0.5">
                      {pets.map((pet) => (
                        <button
                          key={pet.name}
                          onClick={() => handleBossPetChange(pet.name)}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                            selectedBossPet.name === pet.name ? "bg-accent/15 text-accent" : "hover:bg-bg-tertiary text-text-secondary"
                          }`}
                        >
                          <img
                            src={petIcon(pet.icon)}
                            alt=""
                            className="w-4 h-4"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-text-primary truncate">{pet.name}</div>
                            <div className="truncate">{pet.source} · 1/{pet.baseRate.toLocaleString()}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
