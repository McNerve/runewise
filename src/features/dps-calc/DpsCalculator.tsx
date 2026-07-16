import { type HiscoreData } from "../../lib/api/hiscores";
import { useDpsState } from "./hooks/useDpsState";
import LoadoutManager from "./components/LoadoutManager";
import StatsPanel from "./components/StatsPanel";
import ResultsPanel from "./components/ResultsPanel";
import UpgradeFinder from "./components/UpgradeFinder";
import SetupTabs from "./components/SetupTabs";
import { FilterPills } from "../../components/primitives";
import AccountPrefillBanner from "../../components/AccountPrefillBanner";

interface Props {
  hiscores: HiscoreData | null;
}

export default function DpsCalculator({ hiscores }: Props) {
  const state = useDpsState({ hiscores });

  return (
    <div className="max-w-5xl">
      <AccountPrefillBanner
        hasHiscores={Boolean(hiscores)}
        context="Attack / Strength / Ranged / Magic levels from your hiscores"
      />
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-h3 font-semibold">DPS Calculator</h2>
        <SetupTabs state={state} />
        <FilterPills
          ariaLabel="Combat style"
          activeKey={state.combatStyle}
          onChange={state.setCombatStyle}
          items={[
            { id: "melee" as const, label: "Melee" },
            { id: "ranged" as const, label: "Ranged" },
            { id: "magic" as const, label: "Magic" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

        {/* ====== LEFT COLUMN -- Configuration ====== */}
        <div className="space-y-5">
          <LoadoutManager state={state} />
          <StatsPanel state={state} />
          <UpgradeFinder state={state} />
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
