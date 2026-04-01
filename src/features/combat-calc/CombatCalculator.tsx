import { useState, useEffect } from "react";
import {
  combatLevel,
  type CombatStats,
} from "../../lib/formulas/combat";
import { type HiscoreData } from "../../lib/api/hiscores";

const DEFAULT_STATS: CombatStats = {
  attack: 1,
  strength: 1,
  defence: 1,
  hitpoints: 10,
  prayer: 1,
  ranged: 1,
  magic: 1,
};

const STAT_LABELS: { key: keyof CombatStats; label: string }[] = [
  { key: "attack", label: "Attack" },
  { key: "strength", label: "Strength" },
  { key: "defence", label: "Defence" },
  { key: "hitpoints", label: "Hitpoints" },
  { key: "prayer", label: "Prayer" },
  { key: "ranged", label: "Ranged" },
  { key: "magic", label: "Magic" },
];

interface Props {
  hiscores: HiscoreData | null;
}

export default function CombatCalculator({ hiscores }: Props) {
  const [stats, setStats] = useState<CombatStats>(DEFAULT_STATS);

  useEffect(() => {
    if (hiscores) {
      const get = (name: string) =>
        hiscores.skills.find(
          (s) => s.name.toLowerCase() === name.toLowerCase()
        )?.level ?? 1;
      setStats({
        attack: get("Attack"),
        strength: get("Strength"),
        defence: get("Defence"),
        hitpoints: get("Hitpoints"),
        prayer: get("Prayer"),
        ranged: get("Ranged"),
        magic: get("Magic"),
      });
    }
  }, [hiscores]);

  const updateStat = (key: keyof CombatStats, value: number) => {
    setStats((prev) => ({ ...prev, [key]: Math.max(1, Math.min(99, value)) }));
  };

  const level = combatLevel(stats);

  const melee = 0.325 * (stats.attack + stats.strength);
  const ranged = 0.325 * (Math.floor(stats.ranged / 2) + stats.ranged);
  const magic = 0.325 * (Math.floor(stats.magic / 2) + stats.magic);
  const dominantStyle =
    melee >= ranged && melee >= magic
      ? "Melee"
      : ranged >= magic
        ? "Ranged"
        : "Magic";

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">Combat Level Calculator</h2>

      <div className="bg-bg-secondary rounded-lg p-4">
        <div className="text-center mb-4">
          <span className="text-4xl font-bold text-accent">
            {level.toFixed(2)}
          </span>
          <p className="text-xs text-text-secondary mt-1">
            Combat Level · {dominantStyle}-based
          </p>
        </div>

        <div className="space-y-2">
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-20 text-sm text-text-secondary">
                {label}
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={stats[key]}
                onChange={(e) => updateStat(key, Number(e.target.value))}
                className="flex-1 bg-bg-tertiary border border-border rounded px-3 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>

        {hiscores && (
          <p className="text-xs text-text-secondary mt-3 text-center">
            Stats loaded from Hiscores
          </p>
        )}
      </div>
    </div>
  );
}
