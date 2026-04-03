import { useState, useMemo } from "react";
import { SLAYER_MASTERS, type SlayerMaster } from "../../lib/data/slayer";
import { useNavigation } from "../../lib/NavigationContext";

const BLOCKED_KEY = "runewise_blocked_slayer";

type BlockedMap = Record<string, string[]>;

function loadBlocked(): BlockedMap {
  try {
    const saved = localStorage.getItem(BLOCKED_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    // Migration: old format was string[] — copy to all masters
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

export default function SlayerHelper() {
  const { navigate } = useNavigation();
  const [selectedMaster, setSelectedMaster] = useState<SlayerMaster>(
    SLAYER_MASTERS[SLAYER_MASTERS.length - 1] // Default to Duradel (highest level)
  );
  const [blockedMap, setBlockedMap] = useState<BlockedMap>(loadBlocked);

  const blockedTasks = useMemo(
    () => new Set(blockedMap[selectedMaster.name] ?? []),
    [blockedMap, selectedMaster],
  );

  const totalWeight = useMemo(() => {
    return selectedMaster.tasks
      .filter((t) => !blockedTasks.has(t.monster))
      .reduce((sum, t) => sum + t.weight, 0);
  }, [selectedMaster, blockedTasks]);

  const tasksWithProbability = useMemo(() => {
    return selectedMaster.tasks
      .map((task) => ({
        ...task,
        blocked: blockedTasks.has(task.monster),
        probability: blockedTasks.has(task.monster)
          ? 0
          : (task.weight / totalWeight) * 100,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [selectedMaster, blockedTasks, totalWeight]);

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

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Slayer Blocks</h2>

      <div className="flex gap-2 mb-4">
        {SLAYER_MASTERS.map((master) => (
          <button
            key={master.name}
            onClick={() => setSelectedMaster(master)}
            aria-pressed={selectedMaster.name === master.name}
            className={`px-3 py-1.5 rounded text-sm ${
              selectedMaster.name === master.name
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {master.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-text-secondary">
          Combat {selectedMaster.combatRequired}+ required
          {selectedMaster.slayerRequired > 1 &&
            ` · Slayer ${selectedMaster.slayerRequired}+`}
          {" · "}
          {selectedMaster.location}
          {blockedTasks.size > 0 && (
            <span className="text-danger ml-2">
              {blockedTasks.size} blocked
            </span>
          )}
        </div>
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
              ? "text-text-secondary hover:text-text-primary cursor-pointer"
              : "text-text-secondary/20 cursor-not-allowed"
          }`}
        >
          Clear All Blocks
        </button>
      </div>

      <div className="bg-bg-secondary rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs">
              <th scope="col" className="text-left px-4 py-2 w-8">Block</th>
              <th scope="col" className="text-left px-4 py-2">Monster</th>
              <th scope="col" className="text-right px-4 py-2">Amount</th>
              <th scope="col" className="text-right px-4 py-2">Weight</th>
              <th scope="col" className="text-right px-4 py-2">Chance</th>
              <th scope="col" className="text-right px-4 py-2">Slayer Lvl</th>
            </tr>
          </thead>
          <tbody>
            {tasksWithProbability.map((task) => (
              <tr
                key={task.monster}
                className={`border-b border-border/50 even:bg-bg-primary/30 transition-colors ${
                  task.blocked
                    ? "opacity-40"
                    : "hover:bg-bg-tertiary"
                }`}
              >
                <td className="px-4 py-1.5">
                  <button
                    onClick={() => toggleBlock(task.monster)}
                    className={`w-4 h-4 rounded border text-[10px] flex items-center justify-center ${
                      task.blocked
                        ? "bg-danger/20 border-danger text-danger"
                        : "border-border hover:border-danger"
                    }`}
                  >
                    {task.blocked ? "✕" : ""}
                  </button>
                </td>
                <td className="px-4 py-1.5 font-medium">
                  <button
                    onClick={() => navigate("loot", { monster: task.monster, tab: "drops" })}
                    className="hover:text-accent transition-colors text-left"
                  >
                    {task.monster}
                  </button>
                </td>
                <td className="px-4 py-1.5 text-right text-text-secondary">
                  {task.amount}
                </td>
                <td className="px-4 py-1.5 text-right text-text-secondary">
                  {task.weight}
                </td>
                <td
                  className={`px-4 py-1.5 text-right font-medium ${
                    task.probability >= 5
                      ? "text-success"
                      : task.probability >= 3
                        ? "text-accent"
                        : "text-text-secondary"
                  }`}
                >
                  {task.blocked ? "—" : `${task.probability.toFixed(1)}%`}
                </td>
                <td className="px-4 py-1.5 text-right text-text-secondary">
                  {task.slayerLevel > 1 ? task.slayerLevel : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
