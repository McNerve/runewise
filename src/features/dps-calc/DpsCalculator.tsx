import { type HiscoreData } from "../../lib/api/hiscores";
import { useDpsState } from "./hooks/useDpsState";
import LoadoutManager from "./components/LoadoutManager";
import StatsPanel from "./components/StatsPanel";
import ResultsPanel from "./components/ResultsPanel";

interface Props {
  hiscores: HiscoreData | null;
}

export default function DpsCalculator({ hiscores }: Props) {
  const state = useDpsState({ hiscores });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">DPS Calculator</h2>
        <div className="flex gap-1.5">
          {(["melee", "ranged", "magic"] as const).map((style) => (
            <button
              key={style}
              onClick={() => state.setCombatStyle(style)}
              aria-pressed={state.combatStyle === style}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                state.combatStyle === style
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

        {/* ====== LEFT COLUMN -- Configuration ====== */}
        <div className="space-y-5">
          <LoadoutManager state={state} />
          <StatsPanel state={state} />
        </div>
        {/* ====== END LEFT COLUMN ====== */}

        {/* ====== RIGHT COLUMN -- Target + Results (sticky) ====== */}
        <ResultsPanel state={state} />
        {/* ====== END RIGHT COLUMN ====== */}

      </div>
      {/* ====== END GRID ====== */}
    </div>
  );
}
