import { useState, useMemo } from "react";
import {
  SLAYER_MASTERS,
  SLAYER_REWARDS,
  SLAYER_REWARD_CATEGORIES,
  SLAYER_STREAK_MULTIPLIERS,
  RECOMMENDED_BLOCKS,
  BOOSTING_STRATEGIES,
  type SlayerMaster,
  type SlayerRewardCategory,
} from "../../lib/data/slayer";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import { StatCard, StatGrid } from "../../components/primitives";
import { WIKI_IMG } from "../../lib/sprites";

type SlayerTab = "tasks" | "rewards" | "strategy";

const ICON_OVERRIDES: Record<string, string> = {
    // Turael basics
    "Banshees": "Banshee.png",
    "Bats": "Bat.png",
    "Bears": "Black_bear.png",
    "Birds": "Seagull.png",
    "Cave bugs": "Cave_bug_icon.png",
    "Cave crawlers": "Cave_crawler_icon.png",
    "Cows": "Cow_%281%29.png",
    "Crawling Hands": "Crawling_Hand.png",
    "Dogs": "Guard_dog.png",
    "Dwarves": "Dwarf.png",
    "Ghosts": "Ghost.png",
    "Goblins": "Goblin.png",
    "Icefiends": "Icefiend.png",
    "Lizards": "Lizard.png",
    "Minotaurs": "Minotaur.png",
    "Monkeys": "Monkey.png",
    "Rats": "Giant_rat.png",
    "Scorpions": "Scorpion.png",
    "Spiders": "Spider.png",
    "Wolves": "Wolf.png",
    "Zombies": "Zombie_%28Level_13%29.png",
    // Demons & giants
    "Abyssal demons": "Abyssal_demon.png",
    "Black demons": "Black_demon.png",
    "Greater demons": "Greater_demon.png",
    "Lesser demons": "Lesser_demon.png",
    "Fire giants": "Fire_giant.png",
    "Ice giants": "Ice_giant.png",
    "Hill Giants": "Hill_Giant.png",
    "Moss giants": "Moss_giant.png",
    // Dragons
    "Black dragons": "Black_dragon.png",
    "Blue dragons": "Blue_dragon.png",
    "Red dragons": "Red_dragon.png",
    "Green dragons": "Green_dragon.png",
    "Metal dragons": "Iron_dragon.png",
    "Lava dragons": "Lava_dragon.png",
    "Frost dragons": "Frost_dragon.png",
    // Slayer monsters
    "Aberrant spectres": "Aberrant_spectre.png",
    "Aviansies": "Aviansie_icon.png",
    "Basilisks": "Basilisk.png",
    "Cave horrors": "Cave_horror_icon.png",
    "Dark beasts": "Dark_beast.png",
    "Drakes": "Drake.png",
    "Dust devils": "Dust_devil.png",
    "Gargoyles": "Gargoyle.png",
    "Hellhounds": "Hellhound.png",
    "Hydras": "Hydra.png",
    "Jellies": "Jelly.png",
    "Smoke devils": "Smoke_devil.png",
    "Wyrms": "Wyrm.png",
    // Wilderness
    "Bandits": "Bandit.png",
    "Chaos druids": "Chaos_druid.png",
    "Dark warriors": "Dark_warrior.png",
    "Earth warriors": "Earth_warrior.png",
    "Ents": "Ent_trunk.png",
    "Ice warriors": "Ice_warrior.png",
    "Magic axes": "Magic_axe.png",
    "Mammoths": "Mammoth.png",
    "Revenants": "Revenant_imp.png",
    "Rogues": "Rogue.png",
    // Special names
    "Fossil Island wyverns": "Ancient_Wyvern.png",
    "Fossil Island Wyverns": "Ancient_Wyvern.png",
    "Kalphite": "Kalphite_Soldier.png",
    "Skeletal wyverns": "Skeletal_Wyvern.png",
    "Suqah": "Suqah_icon.png",
    "Trolls": "Troll.png",
    "TzHaar": "TzHaar-Hur.png",
    "Waterfiends": "Waterfiend.png",
    "Brine rats": "Brine_rat.png",
    "Vampyres": "Vyrewatch.png",
    "Mutated Zygomites": "Ancient_Zygomite.png",
    "Lesser Nagua": "Sulphur_Nagua.png",
    "Aquanites": "Aquanite.png",
    "Araxytes": "Araxxor.png",
    "Gryphons": "Gryphon.png",
    // Boss task overrides
    "Bosses": "Slayer_helmet_%28i%29.png",
    "Wilderness bosses": "Slayer_helmet_%28i%29.png",
    // Already correct (singular = plural)
    "Ankou": "Ankou.png",
    "Bloodveld": "Bloodveld.png",
    "Cave kraken": "Cave_kraken.png",
    "Cave slime": "Cave_slime.png",
    "Dagannoth": "Dagannoth.png",
    "Kurask": "Kurask.png",
    "Nechryael": "Nechryael.png",
    "Turoth": "Turoth_icon.png",
    "Elves": "Elf_Warrior_%281%29.png",
    "Lizardmen": "Lizardman_%28level_53%29.png",
    "Warped creatures": "Warped_Jelly.png",
    // Previously missing
    "Black Knights": "Black_Knight_Titan.png",
    "Pirates": "Pirate_%28Brimhaven%29.png",
    "Skeletons": "Skeleton_fremennik.png",
    "Spiritual creatures": "Spiritual_ranger_%28Saradomin%29.png",
    "Scabarites": "Scarab_Mage.png",
    "Custodian stalker": "Scabaras.png",
};

function monsterIconUrl(name: string): string {
  if (ICON_OVERRIDES[name]) return `${WIKI_IMG}/${ICON_OVERRIDES[name]}`;
  const file = name.replace(/ /g, "_").replace(/'/g, "%27");
  return `${WIKI_IMG}/${file}.png`;
}

const BLOCKED_KEY = "runewise_blocked_slayer";

type BlockedMap = Record<string, string[]>;
type SortKey = "weight" | "monster" | "slayerLevel" | "probability";

const MASTER_ICONS: Record<string, string> = {
  "Turael": "Turael.png",
  "Konar": "Konar_quo_Maten.png",
  "Krystilia": "Krystilia.png",
  "Nieve / Steve": "Nieve.png",
  "Duradel": "Duradel.png",
};

const MASTER_DESCRIPTIONS: Record<string, string> = {
  "Turael": "Beginner master in Burthorpe. Assigns easy, low-level tasks. Can reset tasks from other masters.",
  "Konar": "Assigns region-locked tasks with bonus Brimstone key drops. Tasks must be done in a specific location.",
  "Krystilia": "Wilderness-only master. Tasks give Larran's keys and increased points. PvP danger.",
  "Nieve / Steve": "High-level master in the Stronghold Slayer Cave. Best for efficient task grinding.",
  "Duradel": "Highest-level master in Shilo Village. Assigns the most rewarding and difficult tasks.",
};

function loadBlocked(): BlockedMap {
  try {
    const saved = localStorage.getItem(BLOCKED_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      const migrated: BlockedMap = {};
      for (const master of SLAYER_MASTERS) {
        migrated[master.name] = [...parsed];
      }
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed as BlockedMap;
  } catch {
    return {};
  }
}

const REWARD_PURCHASED_KEY = "runewise_slayer_rewards_purchased";

function loadPurchased(): Set<string> {
  try {
    const saved = localStorage.getItem(REWARD_PURCHASED_KEY);
    if (!saved) return new Set();
    return new Set(JSON.parse(saved) as string[]);
  } catch {
    return new Set();
  }
}

export default function SlayerHelper() {
  const { navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<SlayerTab>("tasks");
  const [selectedMaster, setSelectedMaster] = useState<SlayerMaster>(
    SLAYER_MASTERS[SLAYER_MASTERS.length - 1]
  );
  const [blockedMap, setBlockedMap] = useState<BlockedMap>(loadBlocked);
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [sortAsc, setSortAsc] = useState(false);
  const [showBlocked, setShowBlocked] = useState(true);
  const [rewardFilter, setRewardFilter] = useState<SlayerRewardCategory | "all">("all");
  const [purchasedRewards, setPurchasedRewards] = useState<Set<string>>(loadPurchased);
  const [hideUnaffordable, setHideUnaffordable] = useState(false);
  const [myPoints, setMyPoints] = useState<number | "">("");

  const blockedTasks = useMemo(
    () => new Set(blockedMap[selectedMaster.name] ?? []),
    [blockedMap, selectedMaster],
  );

  const totalWeight = useMemo(() => {
    return selectedMaster.tasks
      .filter((t) => !blockedTasks.has(t.monster))
      .filter((t) => !t.requiredUnlock || purchasedRewards.has(t.requiredUnlock))
      .reduce((sum, t) => sum + t.weight, 0);
  }, [selectedMaster, blockedTasks, purchasedRewards]);

  const tasksWithProbability = useMemo(() => {
    const tasks = selectedMaster.tasks
      .map((task) => {
        const blocked = blockedTasks.has(task.monster);
        const locked = Boolean(task.requiredUnlock && !purchasedRewards.has(task.requiredUnlock));
        return {
          ...task,
          blocked,
          locked,
          probability: blocked || locked
            ? 0
            : (task.weight / totalWeight) * 100,
        };
      });

    const filtered = showBlocked ? tasks : tasks.filter((t) => !t.blocked && !t.locked);

    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "monster": cmp = a.monster.localeCompare(b.monster); break;
        case "slayerLevel": cmp = a.slayerLevel - b.slayerLevel; break;
        case "probability": cmp = a.probability - b.probability; break;
        default: cmp = a.weight - b.weight;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [selectedMaster, blockedTasks, purchasedRewards, totalWeight, sortKey, sortAsc, showBlocked]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const toggleBlock = (monster: string) => {
    setBlockedMap((prev) => {
      const masterKey = selectedMaster.name;
      const current = prev[masterKey] ?? [];
      const next = current.includes(monster)
        ? current.filter((m) => m !== monster)
        : [...current, monster];
      const updated = { ...prev, [masterKey]: next };
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const activeTasks = tasksWithProbability.filter((t) => !t.blocked).length;
  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  const togglePurchased = (name: string) => {
    setPurchasedRewards((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      localStorage.setItem(REWARD_PURCHASED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const filteredRewards = useMemo(() => {
    let rewards = rewardFilter === "all" ? SLAYER_REWARDS : SLAYER_REWARDS.filter((r) => r.category === rewardFilter);
    if (hideUnaffordable && typeof myPoints === "number" && myPoints > 0) {
      rewards = rewards.filter((r) => r.cost <= myPoints);
    }
    return rewards;
  }, [rewardFilter, hideUnaffordable, myPoints]);

  const totalCost = SLAYER_REWARDS.reduce((sum, r) => sum + r.cost, 0);
  const purchasedCost = SLAYER_REWARDS.filter((r) => purchasedRewards.has(r.name)).reduce((sum, r) => sum + r.cost, 0);

  const masterBlocks = RECOMMENDED_BLOCKS[selectedMaster.name] ?? [];


  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Slayer Helper</h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          Block unwanted tasks and see real-time probability changes. Pick a master, toggle blocks, and optimize your task list.
        </p>
      </div>

      {/* Master tabs */}
      <div className="flex flex-wrap gap-2">
        {SLAYER_MASTERS.map((master) => (
          <button
            key={master.name}
            onClick={() => setSelectedMaster(master)}
            aria-pressed={selectedMaster.name === master.name}
            className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
              selectedMaster.name === master.name
                ? "border-accent/50 bg-accent/10"
                : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
            }`}
          >
            {selectedMaster.name === master.name && (
              <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
            )}
            <div className={`text-xs font-semibold ${selectedMaster.name === master.name ? "text-accent" : ""}`}>
              {master.name}
            </div>
            <div className={`hidden sm:block text-[11px] ${selectedMaster.name === master.name ? "text-accent/60" : "text-text-secondary/60"}`}>
              {master.tasks.length} tasks
            </div>
          </button>
        ))}
      </div>

      {/* Master info card */}
      <div className="rounded-xl border border-border/60 bg-bg-primary/40 p-4">
        <div className="flex items-start gap-4">
          <WikiImage
            src={`${WIKI_IMG}/${MASTER_ICONS[selectedMaster.name] ?? `${selectedMaster.name}.png`}`}
            alt={selectedMaster.name}
            className="h-14 w-14 rounded-xl border border-border/40 bg-bg-primary/60 object-contain p-1 shrink-0"
            fallback={selectedMaster.name[0]}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-xs rounded-full border border-border bg-bg-primary/60 px-3 py-1 text-text-secondary">
                Combat {selectedMaster.combatRequired}+
              </span>
              {selectedMaster.slayerRequired > 1 && (
                <span className="text-xs rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-accent">
                  Slayer {selectedMaster.slayerRequired}+
                </span>
              )}
              <span className="text-xs text-text-secondary">
                📍 {selectedMaster.location}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {MASTER_DESCRIPTIONS[selectedMaster.name] ?? ""}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <StatGrid columns={4}>
            <StatCard label="Active Tasks" value={activeTasks} />
            <StatCard label="Blocked" value={blockedTasks.size} accent={blockedTasks.size > 0 ? "text-danger" : undefined} />
            <StatCard label="Total Weight" value={totalWeight} />
            <StatCard label="Points / Task" value={selectedMaster.pointsPerTask} accent="text-accent" />
          </StatGrid>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { id: "tasks" as const, label: "Task List", description: "Block tasks and view probabilities" },
          { id: "rewards" as const, label: "Reward Shop", description: "Spend slayer points on unlocks" },
          { id: "strategy" as const, label: "Strategy", description: "Guides, block tips, and boosting" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
              activeTab === tab.id
                ? "border-accent/50 bg-accent/10"
                : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
            )}
            <div className={`text-xs font-semibold ${activeTab === tab.id ? "text-accent" : ""}`}>
              {tab.label}
            </div>
            <div className={`hidden sm:block text-[11px] ${activeTab === tab.id ? "text-accent/60" : "text-text-secondary/60"}`}>
              {tab.description}
            </div>
          </button>
        ))}
      </div>

      {activeTab === "tasks" ? (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showBlocked}
                onChange={(e) => setShowBlocked(e.target.checked)}
                className="rounded border-border"
              />
              Show blocked tasks
            </label>
            <button
              onClick={() => {
                setBlockedMap((prev) => {
                  const updated = { ...prev, [selectedMaster.name]: [] };
                  localStorage.setItem(BLOCKED_KEY, JSON.stringify(updated));
                  return updated;
                });
              }}
              disabled={blockedTasks.size === 0}
              className={`text-xs transition-colors ${
                blockedTasks.size > 0
                  ? "text-text-secondary hover:text-danger cursor-pointer"
                  : "text-text-secondary/20 cursor-not-allowed"
              }`}
            >
              Clear All Blocks
            </button>
          </div>

          {/* Task table */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-center px-3 py-2 w-10">Block</th>
                  <th
                    scope="col"
                    className="text-left px-4 py-2 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort("monster")}
                  >
                    Monster{arrow("monster")}
                  </th>
                  <th scope="col" className="text-right px-4 py-2">Amount</th>
                  <th
                    scope="col"
                    className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort("weight")}
                  >
                    Weight{arrow("weight")}
                  </th>
                  <th
                    scope="col"
                    className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort("probability")}
                  >
                    Chance{arrow("probability")}
                  </th>
                  <th
                    scope="col"
                    className="text-right px-4 py-2 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort("slayerLevel")}
                  >
                    Slayer Lvl{arrow("slayerLevel")}
                  </th>
                  <th scope="col" className="px-3 py-2 w-12" />
                </tr>
              </thead>
              <tbody>
                {tasksWithProbability.map((task) => (
                  <tr
                    key={task.monster}
                    className={`border-b border-border/30 transition-colors ${
                      task.locked
                        ? "opacity-30 bg-warning/3"
                        : task.blocked
                          ? "opacity-35 bg-danger/3"
                          : "even:bg-bg-primary/25 hover:bg-bg-secondary/40"
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => toggleBlock(task.monster)}
                        aria-label={task.blocked ? `Unblock ${task.monster}` : `Block ${task.monster}`}
                        className={`w-5 h-5 rounded border text-[10px] flex items-center justify-center mx-auto transition ${
                          task.blocked
                            ? "bg-danger/20 border-danger text-danger"
                            : "border-border hover:border-danger/50 hover:bg-danger/5"
                        }`}
                      >
                        {task.blocked ? "✕" : ""}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <WikiImage
                          src={monsterIconUrl(task.monster)}
                          alt=""
                          className="w-5 h-5 shrink-0"
                          fallback={task.monster[0]}
                        />
                        <button
                          onClick={() => navigate("loot", { monster: task.monster, tab: "drops" })}
                          className="font-medium hover:text-accent transition-colors text-left"
                          title={task.locked ? `Requires: ${task.requiredUnlock}` : undefined}
                        >
                          {task.monster}
                        </button>
                        {(task.monster === "Bosses" || task.monster === "Wilderness bosses") && (
                          <button
                            onClick={() => navigate("bosses")}
                            className="text-[9px] text-accent/50 hover:text-accent transition-colors"
                          >
                            Guides
                          </button>
                        )}
                        {task.locked && (
                          <span className="text-[9px] text-warning/60">Unlock: {task.requiredUnlock}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary tabular-nums">
                      {task.amount}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary tabular-nums">
                      {task.weight}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium tabular-nums ${
                      task.blocked ? "text-text-secondary/40" :
                      task.probability >= 5 ? "text-success" :
                      task.probability >= 3 ? "text-accent" :
                      "text-text-secondary"
                    }`}>
                      {task.locked ? "Locked" : task.blocked ? "—" : `${task.probability.toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-2 text-right text-text-secondary tabular-nums">
                      {task.slayerLevel > 1 ? task.slayerLevel : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => navigate("dps-calc", { monster: task.monster, onTask: "1" })}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                        title={`Open DPS Calc for ${task.monster} on task`}
                      >
                        DPS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-text-secondary/40 text-right">
            {selectedMaster.tasks.length} tasks · Weights from OSRS Wiki
          </div>
        </>
      ) : activeTab === "rewards" ? (
        <>
          {/* Reward progress */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">Total Rewards</div>
              <div className="mt-0.5 text-lg font-semibold text-text-primary">{SLAYER_REWARDS.length}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">Purchased</div>
              <div className="mt-0.5 text-lg font-semibold text-success">{purchasedRewards.size}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">Points Spent</div>
              <div className="mt-0.5 text-lg font-semibold text-text-primary tabular-nums">{purchasedCost.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">Points Remaining</div>
              <div className="mt-0.5 text-lg font-semibold text-accent tabular-nums">{(totalCost - purchasedCost).toLocaleString()}</div>
            </div>
          </div>

          {/* Points per master reference */}
          <div className="rounded-xl border border-border/60 bg-bg-primary/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45 mb-3">Points Per Task by Master</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-xs">
                    <th scope="col" className="text-left px-3 py-2">Master</th>
                    <th scope="col" className="text-right px-3 py-2">Base</th>
                    {SLAYER_STREAK_MULTIPLIERS.map((s) => (
                      <th key={s.streak} scope="col" className="text-right px-3 py-2">{s.streak}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLAYER_MASTERS.map((master) => (
                    <tr key={master.name} className={`border-b border-border/30 ${
                      selectedMaster.name === master.name ? "bg-accent/5" : "even:bg-bg-primary/25"
                    }`}>
                      <td className={`px-3 py-2 font-medium ${selectedMaster.name === master.name ? "text-accent" : ""}`}>
                        {master.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{master.pointsPerTask}</td>
                      {SLAYER_STREAK_MULTIPLIERS.map((s) => (
                        <td key={s.streak} className="px-3 py-2 text-right tabular-nums text-text-secondary">
                          {master.pointsPerTask * s.multiplier}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Points + affordability filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary shrink-0" htmlFor="slayer-my-points">My Points</label>
              <input
                id="slayer-my-points"
                type="number"
                min={0}
                placeholder="0"
                value={myPoints}
                onChange={(e) => setMyPoints(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors tabular-nums"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={hideUnaffordable}
                onChange={(e) => setHideUnaffordable(e.target.checked)}
                disabled={myPoints === "" || myPoints === 0}
                className="rounded border-border"
              />
              Hide unaffordable
            </label>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRewardFilter("all")}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                rewardFilter === "all"
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
              }`}
            >
              All ({SLAYER_REWARDS.length})
            </button>
            {SLAYER_REWARD_CATEGORIES.map((cat) => {
              const count = SLAYER_REWARDS.filter((r) => r.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setRewardFilter(cat.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    rewardFilter === cat.id
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Rewards table */}
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-center px-3 py-2 w-10">Got</th>
                  <th scope="col" className="text-left px-4 py-2">Reward</th>
                  <th scope="col" className="text-left px-4 py-2 hidden sm:table-cell">Description</th>
                  <th scope="col" className="text-right px-4 py-2">Cost</th>
                  <th scope="col" className="text-left px-4 py-2 w-20">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredRewards.map((reward) => {
                  const owned = purchasedRewards.has(reward.name);
                  return (
                    <tr
                      key={reward.name}
                      className={`border-b border-border/30 transition-colors ${
                        owned
                          ? "opacity-50 bg-success/3"
                          : "even:bg-bg-primary/25 hover:bg-bg-secondary/40"
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => togglePurchased(reward.name)}
                          aria-label={owned ? `Unmark ${reward.name}` : `Mark ${reward.name} as purchased`}
                          className={`w-5 h-5 rounded border text-[10px] flex items-center justify-center mx-auto transition ${
                            owned
                              ? "bg-success/20 border-success text-success"
                              : "border-border hover:border-success/50 hover:bg-success/5"
                          }`}
                        >
                          {owned ? "✓" : ""}
                        </button>
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {reward.name}
                        <div className="sm:hidden text-xs text-text-secondary mt-0.5">{reward.description}</div>
                      </td>
                      <td className="px-4 py-2 text-text-secondary hidden sm:table-cell">{reward.description}</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-accent">{reward.cost.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] uppercase tracking-[0.16em] ${
                          reward.category === "unlock" ? "text-accent" :
                          reward.category === "extend" ? "text-success" :
                          reward.category === "buy" ? "text-warning" :
                          "text-text-secondary"
                        }`}>
                          {reward.category}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary/40">
            <span>{filteredRewards.length} rewards · Data from OSRS Wiki</span>
            {purchasedRewards.size > 0 && (
              <button
                onClick={() => {
                  setPurchasedRewards(new Set());
                  localStorage.removeItem(REWARD_PURCHASED_KEY);
                }}
                className="text-text-secondary/40 hover:text-danger transition-colors"
              >
                Clear All Purchased
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Boosting strategies */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-text-secondary/45">Points Optimization</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BOOSTING_STRATEGIES.map((strategy) => (
                <div key={strategy.title} className="rounded-xl border border-border/60 bg-bg-primary/40 p-4">
                  <div className="text-sm font-semibold text-text-primary mb-2">{strategy.title}</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{strategy.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Block recommendations for selected master */}
          {masterBlocks.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-text-secondary/45">
                Recommended Blocks — {selectedMaster.name}
              </div>
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-xs">
                      <th scope="col" className="text-left px-4 py-2">Monster</th>
                      <th scope="col" className="text-left px-4 py-2">Why Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterBlocks.map((rec, i) => (
                      <tr key={rec.monster} className={`border-b border-border/30 ${i % 2 === 1 ? "bg-bg-primary/25" : ""}`}>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <WikiImage
                              src={monsterIconUrl(rec.monster)}
                              alt=""
                              className="w-5 h-5 shrink-0"
                              fallback={rec.monster[0]}
                            />
                            <span className="font-medium">{rec.monster}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-text-secondary">{rec.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-text-secondary/40">
                These are general recommendations. Adjust based on your goals — boss tasks, money making, or pure XP.
              </p>
            </div>
          )}

        </>
      )}
    </div>
  );
}
