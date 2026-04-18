import { useState, useMemo, useEffect } from "react";
import { petChance, actionsForChance, skillingPetRate } from "../../lib/formulas/pet";
import { SKILL_PETS, BOSS_PETS, type SkillPet, type BossPet } from "../../lib/data/pets";
import { PET_MODIFIERS, modifierDefaults, type ModifierState } from "../../lib/data/pet-modifiers";
import { petIcon } from "../../lib/sprites";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { fetchTempleCollectionLog, fetchTempleClogItemNames } from "../../lib/api/temple";
import { findActivityScore, type HiscoreData } from "../../lib/api/hiscores";

const OWNED_KEY_PREFIX = "runewise_owned_pets:";
const ownedKey = (rsn: string) => `${OWNED_KEY_PREFIX}${rsn.toLowerCase() || "anon"}`;

const UNIT_LABELS: Record<string, string> = {
  actions: "Actions Completed",
  kills: "Kill Count",
  completions: "Completions",
  caskets: "Caskets Opened",
  games: "Games Completed",
  catches: "Catches",
  rumours: "Rumours Completed",
  waves: "Wave 10 Completions",
  runs: "Runs Completed",
  subdues: "Subdues",
};

function variantSource(pet: UnifiedPet, state: ModifierState): string {
  const name = pet.name;
  if (name === "Callisto cub" && state.artio) return "Artio";
  if (name === "Vet'ion jr." && state.calvarion) return "Calvar'ion";
  if (name === "Venenatis spiderling" && state.spindel) return "Spindel";
  if (name === "Pet chaos elemental" && state.fanatic) return "Chaos Fanatic";
  if (name === "Youngllef" && state.normal) return "The Gauntlet";
  return pet.source;
}

interface Props {
  hiscores: HiscoreData | null;
  rsn: string;
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
  { id: "other", label: "Misc" },
];

const ALL_PETS: UnifiedPet[] = [
  ...SKILL_PETS.map((p) => ({
    name: p.name,
    icon: p.icon,
    source: p.skill,
    baseRate: p.actions[0]?.baseChance ?? 0,
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

export default function PetCalculator({ hiscores, rsn }: Props) {
  const [category, setCategory] = useState<PetCategory>("all");
  const [selected, setSelected] = useState<UnifiedPet>(ALL_PETS[0]);
  const [killCount, setKillCount] = useState(0);
  const [selectedAction, setSelectedAction] = useState(SKILL_PETS[0]?.actions[0]);
  const [actionCount, setActionCount] = useState(0);
  const [xpInput, setXpInput] = useState(0);
  const [skillLevel, setSkillLevel] = useState(99);
  const [levelTouched, setLevelTouched] = useState(false);
  const [countTouched, setCountTouched] = useState(false);
  const [modifierState, setModifierState] = useState<ModifierState>(() => {
    const entry = PET_MODIFIERS[ALL_PETS[0]?.name];
    return entry ? modifierDefaults(entry) : {};
  });
  const [manualOwned, setManualOwned] = useState<Set<string>>(() => new Set(loadJSON<string[]>(ownedKey(rsn), [])));
  const [templeOwned, setTempleOwned] = useState<Set<string>>(new Set());
  const [templeStatus, setTempleStatus] = useState<"idle" | "loading" | "synced" | "unsynced" | "error">("idle");
  const [ratePerHour, setRatePerHour] = useState(0);
  const [search, setSearch] = useState("");
  const [hideOwned, setHideOwned] = useState(false);

  useEffect(() => {
    if (!rsn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset Temple state when RSN cleared
      setTempleOwned(new Set());
      setTempleStatus("idle");
      return;
    }
    let cancelled = false;
    setTempleStatus("loading");
    Promise.allSettled([fetchTempleCollectionLog(rsn), fetchTempleClogItemNames()])
      .then(([clogResult, namesResult]) => {
        if (cancelled) return;
        if (clogResult.status === "rejected") {
          setTempleStatus("error");
          return;
        }
        const clog = clogResult.value;
        const names = namesResult.status === "fulfilled" ? namesResult.value : new Map<number, string>();
        const allPets = clog?.categories?.["All Pets"] ?? clog?.categories?.["all_pets"] ?? [];
        if (!allPets.length) {
          setTempleStatus("unsynced");
          return;
        }
        const owned = new Set<string>();
        for (const entry of allPets) {
          if (entry.count > 0) {
            const name = entry.name ?? names.get(entry.id);
            if (name) owned.add(name);
          }
        }
        setTempleOwned(owned);
        setTempleStatus("synced");
      });
    return () => { cancelled = true; };
  }, [rsn]);

  const ownedPets = useMemo(() => {
    const combined = new Set(manualOwned);
    for (const n of templeOwned) combined.add(n);
    return combined;
  }, [manualOwned, templeOwned]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_PETS.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (hideOwned && ownedPets.has(p.name)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.source.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, search, hideOwned, ownedPets]);

  const toggleOwned = (name: string) => {
    setManualOwned((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      saveJSON(ownedKey(rsn), [...next]);
      return next;
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- rehydrating from per-RSN localStorage
    setManualOwned(new Set(loadJSON<string[]>(ownedKey(rsn), [])));
  }, [rsn]);

  const ownedCount = ownedPets.size;

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
    setRatePerHour(0);
    setLevelTouched(false);
    setCountTouched(false);
    if (pet.skillPet) setSelectedAction(pet.skillPet.actions[0]);
    const entry = PET_MODIFIERS[pet.name];
    setModifierState(entry ? modifierDefaults(entry) : {});
  };

  const modifierEntry = PET_MODIFIERS[selected.name];
  const isSkilling = selected.type === "skilling" && selected.skillPet;

  const hiscoreSkill = useMemo(() => {
    if (!hiscores || !isSkilling || !selected.skillPet) return null;
    return hiscores.skills.find(
      (s) => s.name.toLowerCase() === selected.skillPet!.skill.toLowerCase()
    ) ?? null;
  }, [hiscores, selected, isSkilling]);

  const has200m = (hiscoreSkill?.xp ?? 0) >= 200_000_000;

  const methodRows = useMemo(() => {
    if (!isSkilling || !selected.skillPet) return [];
    return selected.skillPet.actions.map((action) => {
      const rate = action.xpPerAction > 0
        ? skillingPetRate(action.baseChance, skillLevel, has200m)
        : action.baseChance;
      return { action, rate };
    });
  }, [isSkilling, selected, skillLevel, has200m]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync hiscores level → editable input, manual-override gated
    if (!levelTouched && hiscoreSkill?.level) setSkillLevel(hiscoreSkill.level);
  }, [hiscoreSkill, levelTouched]);

  useEffect(() => {
    if (countTouched || !selectedAction) return;
    if (selectedAction.xpPerAction > 0 && hiscoreSkill?.xp) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync hiscores xp → editable input, manual-override gated
      setXpInput(hiscoreSkill.xp);
      setActionCount(Math.floor(hiscoreSkill.xp / selectedAction.xpPerAction));
      return;
    }
    if (selectedAction.xpPerAction === 0 && hiscores?.activities) {
      const tokens = selectedAction.name.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3);
      const match = hiscores.activities.find((a) => {
        const name = a.name.toLowerCase();
        return tokens.some((t) => name.includes(t));
      });
      if (match && match.score > 0) setActionCount(match.score);
    }
  }, [hiscoreSkill, selectedAction, countTouched, hiscores]);

  const effectiveRate = useMemo(() => (
    isSkilling && selectedAction
      ? (selectedAction.xpPerAction > 0
        ? skillingPetRate(selectedAction.baseChance, skillLevel, has200m)
        : selectedAction.baseChance)
      : (modifierEntry ? modifierEntry.rate(modifierState, selected.baseRate) : selected.baseRate)
  ), [isSkilling, selectedAction, skillLevel, has200m, modifierEntry, modifierState, selected]);

  const effectiveCount = isSkilling ? actionCount : killCount;
  const chance = useMemo(() => (
    effectiveCount > 0 && effectiveRate > 0 ? petChance(effectiveCount, effectiveRate) * 100 : 0
  ), [effectiveCount, effectiveRate]);

  const sortedMethodRows = useMemo(() => [...methodRows].sort((a, b) => a.rate - b.rate), [methodRows]);

  const milestones = useMemo(() => {
    if (effectiveRate <= 0) return { a50: 0, a75: 0, a90: 0, a99: 0 };
    return {
      a50: actionsForChance(effectiveRate, 0.50),
      a75: actionsForChance(effectiveRate, 0.75),
      a90: actionsForChance(effectiveRate, 0.90),
      a99: actionsForChance(effectiveRate, 0.99),
    };
  }, [effectiveRate]);

  const fastestActionName = sortedMethodRows[0]?.action.name ?? null;

  const hiscoreKc = useMemo(() => {
    if (!hiscores || isSkilling) return null;
    return findActivityScore(hiscores, selected.source);
  }, [hiscores, selected, isSkilling]);

  useEffect(() => {
    if (countTouched || isSkilling) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync hiscores KC → editable input, manual-override gated
    if (hiscoreKc && hiscoreKc > 0) setKillCount(hiscoreKc);
  }, [hiscoreKc, countTouched, isSkilling]);


  const { unit, inputLabel } = useMemo(() => {
    const u = isSkilling
      ? (selectedAction?.unit ?? "actions")
      : selected.bossPet?.unit ?? (selected.category === "raid" ? "completions" : "kills");
    return { unit: u, inputLabel: UNIT_LABELS[u] ?? u };
  }, [isSkilling, selectedAction, selected]);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight">Pet Chance Calculator</h2>
      <p className="text-sm text-text-secondary mb-1">Handles level-scaled skilling pets, raid scaling, team size, and Slayer-task boosts.</p>
      <p className="text-xs text-text-secondary/70 mb-4 tabular-nums">
        Owned: <span className="text-success font-medium">{ownedCount}</span> / {ALL_PETS.length}
        {templeStatus === "synced" && (
          <span className="ml-2 text-text-secondary/50">· synced from Temple ({templeOwned.size})</span>
        )}
        {templeStatus === "loading" && <span className="ml-2 text-text-secondary/50">· loading Temple…</span>}
        {templeStatus === "unsynced" && rsn && (
          <span className="ml-2 text-text-secondary/50">· Temple not synced — mark manually</span>
        )}
        {templeStatus === "error" && rsn && (
          <span className="ml-2 text-warning/70">· Temple lookup failed — using manual marks only</span>
        )}
      </p>

      {/* Search + hide-owned + category filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pets or sources…"
            className="w-full bg-bg-tertiary border border-border rounded-lg pl-8 pr-8 py-2 text-sm placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 transition-colors"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/40 text-sm pointer-events-none">⌕</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/40 hover:text-text-secondary text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
          hideOwned
            ? "bg-accent/15 border-accent/40 text-accent"
            : "bg-bg-tertiary border-border text-text-secondary hover:border-border/70"
        }`}>
          <input
            type="checkbox"
            checked={hideOwned}
            onChange={(e) => setHideOwned(e.target.checked)}
            className="sr-only"
          />
          {hideOwned ? "☑" : "☐"} Hide owned
        </label>
      </div>
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
                  ? "bg-accent text-on-accent"
                  : "text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {cat.label}
              <span className={`ml-1 tabular-nums ${category === cat.id ? "text-on-accent/70" : "text-text-secondary/40"}`}>
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
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-bg-secondary/30 rounded-lg">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm text-text-secondary">
                {hideOwned && ownedCount === ALL_PETS.length
                  ? "You've got them all."
                  : hideOwned && search
                    ? "No unowned pets match that search."
                    : hideOwned
                      ? "Every pet in this category is owned."
                      : "No pets match that search."}
              </p>
              {(search || hideOwned) && (
                <button
                  onClick={() => { setSearch(""); setHideOwned(false); }}
                  className="mt-3 text-xs text-accent hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
            {filtered.map((pet) => {
              const isActive = selected.name === pet.name;
              const isOwned = ownedPets.has(pet.name);
              return (
                <button
                  key={pet.name}
                  onClick={() => selectPet(pet)}
                  title={`${pet.name} — ${pet.source} (1/${pet.baseRate.toLocaleString()})${isOwned ? " — owned" : ""}`}
                  className={`group relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-accent/15 ring-2 ring-accent scale-105"
                      : isOwned
                        ? "bg-success/10 ring-1 ring-success/40 hover:bg-success/15 hover:scale-105"
                        : "hover:bg-bg-secondary/50 hover:scale-105"
                  }`}
                >
                  {isOwned && (
                    <span className="absolute top-0.5 right-0.5 text-success text-[10px] leading-none">✓</span>
                  )}
                  <img
                    src={petIcon(pet.icon)}
                    alt={pet.name}
                    className={`w-8 h-8 object-contain transition-all ${isActive || isOwned ? "" : "opacity-60 group-hover:opacity-100"}`}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className={`text-[9px] text-center leading-tight truncate w-full ${
                    isActive ? "text-accent font-medium" : isOwned ? "text-success/80" : "text-text-secondary/60"
                  }`}>
                    {pet.name}
                  </span>
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Calculator panel */}
        <div className="bg-bg-tertiary rounded-lg p-4 space-y-4 h-fit xl:sticky xl:top-4">
          {/* Selected pet header */}
          <div className="flex items-center gap-3">
            <img
              src={petIcon(selected.icon)}
              alt=""
              className="w-10 h-10"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">
                {selected.name}
                {isSkilling && has200m && (
                  <span className="ml-2 text-[10px] font-medium text-accent">200M · 15x</span>
                )}
              </div>
              <div className="text-xs text-text-secondary">
                {variantSource(selected, modifierState)} · 1/{Math.round(effectiveRate).toLocaleString()}
              </div>
            </div>
            {templeOwned.has(selected.name) ? (
              <span
                title="Owned per Temple collection log"
                className="shrink-0 px-2 py-1 rounded text-xs font-medium bg-success/15 text-success cursor-default"
              >
                ✓ Owned
              </span>
            ) : (
              <button
                onClick={() => toggleOwned(selected.name)}
                title={manualOwned.has(selected.name) ? "Mark as not owned" : "Mark as owned"}
                className={`shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  manualOwned.has(selected.name)
                    ? "bg-success/15 text-success hover:bg-success/25"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70"
                }`}
              >
                {manualOwned.has(selected.name) ? "✓ Owned" : "Mark owned"}
              </button>
            )}
          </div>

          {/* Skilling-specific controls */}
          {isSkilling && selected.skillPet && (
            <>
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label className="text-xs text-text-secondary">Method</label>
                  {fastestActionName && fastestActionName !== selectedAction?.name && (
                    <button
                      onClick={() => {
                        const fastest = selected.skillPet!.actions.find((a) => a.name === fastestActionName);
                        if (fastest) { setSelectedAction(fastest); setCountTouched(false); }
                      }}
                      className="text-[10px] text-warning hover:underline"
                    >
                      ★ Fastest at L{skillLevel}: {fastestActionName} — click to use
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {sortedMethodRows.map(({ action, rate }) => {
                    const a50 = actionsForChance(rate, 0.5);
                    const isFastest = action.name === fastestActionName;
                    const isSelected = action.name === selectedAction?.name;
                    const hours = ratePerHour > 0 && action.xpPerAction > 0
                      ? (a50 * action.xpPerAction) / ratePerHour
                      : ratePerHour > 0 ? a50 / ratePerHour : null;
                    return (
                      <button
                        key={action.name}
                        onClick={() => { setSelectedAction(action); setCountTouched(false); }}
                        aria-pressed={isSelected}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs transition-colors text-left ${
                          isSelected
                            ? "bg-accent/15 ring-1 ring-accent/50 text-text-primary"
                            : "bg-bg-tertiary/40 hover:bg-bg-secondary text-text-secondary"
                        }`}
                      >
                        <span className="truncate flex items-center gap-1">
                          {isFastest && <span className="text-warning" title="Fastest at current level">★</span>}
                          {action.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-right">
                          <span className={isSelected ? "text-text-primary" : "text-text-secondary/80"}>
                            1/{Math.round(rate).toLocaleString()}
                          </span>
                          <span className="ml-2 text-text-secondary/50">
                            50% @ {a50.toLocaleString()}
                            {hours != null && (
                              <span className="ml-1">· {hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`}</span>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedAction && selectedAction.xpPerAction > 0 && (
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    {selected.skillPet.skill} Level
                    <span className="ml-1 text-text-secondary/40 tabular-nums">
                      → 1/{Math.round(effectiveRate).toLocaleString()} per action
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={skillLevel}
                    onChange={(e) => {
                      setLevelTouched(true);
                      const n = Number(e.target.value);
                      setSkillLevel(Math.max(1, Math.min(99, Number.isFinite(n) ? n : 99)));
                    }}
                    className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                  />
                  {!hiscoreSkill && (
                    <p className="text-[11px] text-text-secondary/60 mt-1">
                      assumes level {skillLevel} — enter your level to adjust
                    </p>
                  )}
                </div>
              )}

              {selectedAction && selectedAction.xpPerAction > 0 ? (
                <div>
                  <label className="flex items-baseline gap-2 text-xs text-text-secondary mb-1">
                    XP Earned
                    {hiscoreSkill?.xp != null && !countTouched && (
                      <span className="text-accent/80 text-[10px]">auto-filled from hiscores</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={xpInput || ""}
                    onChange={(e) => {
                      setCountTouched(true);
                      const v = Number(e.target.value) || 0;
                      setXpInput(v);
                      setActionCount(Math.floor(v / selectedAction.xpPerAction));
                    }}
                    className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                  />
                  <p className="text-[11px] text-text-secondary/60 mt-1 tabular-nums">
                    = {actionCount.toLocaleString()} actions
                  </p>
                </div>
              ) : (
                <div>
                  <label className="flex items-baseline gap-2 text-xs text-text-secondary mb-1">
                    {inputLabel}
                    {!countTouched && actionCount > 0 && (
                      <span className="text-accent/80 text-[10px]">auto-filled from hiscores</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={actionCount || ""}
                    onChange={(e) => {
                      setCountTouched(true);
                      setActionCount(Number(e.target.value) || 0);
                    }}
                    className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {selectedAction && selectedAction.xpPerAction > 0 ? "XP per hour" : "Actions per hour"}
                  <span className="text-text-secondary/40"> (optional)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={ratePerHour || ""}
                  onChange={(e) => setRatePerHour(Number(e.target.value) || 0)}
                  className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {/* Modifier inputs (scaled bosses) */}
          {!isSkilling && modifierEntry && (
            <div className="space-y-2">
              {modifierEntry.modifiers.map((m) => {
                if (m.kind === "toggle") {
                  const checked = Boolean(modifierState[m.id]);
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setModifierState((s) => ({ ...s, [m.id]: e.target.checked }))}
                      />
                      {m.label}
                    </label>
                  );
                }
                if (m.kind === "slider") {
                  const val = Number(modifierState[m.id] ?? m.default);
                  return (
                    <div key={m.id}>
                      <label className="block text-xs text-text-secondary mb-1">
                        {m.label}
                        <span className="ml-1 text-text-secondary/40 tabular-nums">{val.toLocaleString()}</span>
                      </label>
                      <input
                        type="range"
                        min={m.min}
                        max={m.max}
                        step={m.step ?? 1}
                        value={val}
                        onChange={(e) => setModifierState((s) => ({ ...s, [m.id]: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  );
                }
                const val = String(modifierState[m.id] ?? m.default);
                return (
                  <div key={m.id}>
                    <label className="block text-xs text-text-secondary mb-1">{m.label}</label>
                    <select
                      value={val}
                      onChange={(e) => setModifierState((s) => ({ ...s, [m.id]: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                    >
                      {m.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {/* Boss-specific controls */}
          {!isSkilling && (
            <>
              <div>
                <label className="flex items-baseline gap-2 text-xs text-text-secondary mb-1">
                  {inputLabel}
                  {hiscoreKc != null && hiscoreKc > 0 && !countTouched && (
                    <span className="text-accent/80 text-[10px]">auto-filled from hiscores</span>
                  )}
                  {rsn && hiscoreKc == null && (
                    <span className="text-text-secondary/40 text-[10px]">not tracked on hiscores — enter manually</span>
                  )}
                </label>
                <input
                  type="number"
                  min={0}
                  value={killCount || ""}
                  onChange={(e) => {
                    setCountTouched(true);
                    setKillCount(Number(e.target.value) || 0);
                  }}
                  className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {unit[0].toUpperCase() + unit.slice(1)} per hour <span className="text-text-secondary/40">(optional)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={ratePerHour || ""}
                  onChange={(e) => setRatePerHour(Number(e.target.value) || 0)}
                  className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
                />
              </div>
            </>
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
                chance of receiving pet in {effectiveCount.toLocaleString()} {unit}
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
              ].map(({ label, value }) => {
                let hours: number | null = null;
                if (ratePerHour > 0) {
                  if (isSkilling && selectedAction && selectedAction.xpPerAction > 0) {
                    hours = (value * selectedAction.xpPerAction) / ratePerHour;
                  } else {
                    hours = value / ratePerHour;
                  }
                }
                return (
                  <div key={label} className="flex justify-between">
                    <span className="text-text-secondary">{label}</span>
                    <span className="tabular-nums">
                      {value.toLocaleString()} {unit}
                      {hours != null && (
                        <span className="text-text-secondary/50 ml-1.5">
                          ({hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
