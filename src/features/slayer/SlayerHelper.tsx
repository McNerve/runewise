import { useState, useMemo } from "react";
import { SLAYER_MASTERS, type SlayerMaster } from "../../lib/data/slayer";

export default function SlayerHelper() {
  const [selectedMaster, setSelectedMaster] = useState<SlayerMaster>(
    SLAYER_MASTERS[0]
  );
  const [blockedTasks, setBlockedTasks] = useState<Set<string>>(new Set());

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
    setBlockedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(monster)) next.delete(monster);
      else next.add(monster);
      return next;
    });
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Slayer Task Helper</h2>

      <div className="flex gap-2 mb-4">
        {SLAYER_MASTERS.map((master) => (
          <button
            key={master.name}
            onClick={() => {
              setSelectedMaster(master);
              setBlockedTasks(new Set());
            }}
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

      <div className="text-xs text-text-secondary mb-4">
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

      <div className="bg-bg-secondary rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs">
              <th className="text-left px-4 py-2 w-8">Block</th>
              <th className="text-left px-4 py-2">Monster</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-right px-4 py-2">Weight</th>
              <th className="text-right px-4 py-2">Chance</th>
              <th className="text-right px-4 py-2">Slayer Lvl</th>
            </tr>
          </thead>
          <tbody>
            {tasksWithProbability.map((task) => (
              <tr
                key={task.monster}
                className={`border-b border-border/50 transition-colors ${
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
                <td className="px-4 py-1.5 font-medium">{task.monster}</td>
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
