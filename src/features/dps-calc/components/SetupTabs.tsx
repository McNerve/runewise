import StyleIcon from "./StyleIcon";
import type { DpsState } from "../hooks/useDpsState";

const TAB_LABELS = ["A", "B", "C"];

/** Setup tabs — full calculator configurations switched in place, with each
 * inactive tab's DPS computed live against the current target. */
export default function SetupTabs({ state }: { state: DpsState }) {
  const { setups, activeSetup, switchSetup, setupResults, result, combatStyle } = state;

  return (
    <div
      className="flex items-center gap-1.5"
      role="tablist"
      aria-label="Setup tabs"
      title="Each tab holds a complete setup. Inactive tabs show their DPS against the current target."
    >
      {TAB_LABELS.map((label, idx) => {
        const isActive = idx === activeSetup;
        const snap = setups[idx];
        const tabResult = isActive ? result : setupResults[idx];
        const style = isActive ? combatStyle : snap?.combatStyle;
        return (
          <button
            key={label}
            role="tab"
            aria-selected={isActive}
            onClick={() => switchSetup(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
              isActive
                ? "bg-accent/15 ring-1 ring-accent/50 border-transparent text-text-primary"
                : "bg-bg-tertiary/40 border-border/20 text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            <span className="font-semibold">{label}</span>
            {style && <StyleIcon style={style} className="ml-1 inline h-3 w-3 opacity-70" />}
            {tabResult ? (
              <span className={`ml-1.5 num ${isActive ? "text-accent" : "text-text-secondary/70"}`}>
                {tabResult.dps.toFixed(1)}
              </span>
            ) : !isActive ? (
              <span className="ml-1.5 text-text-secondary/40">new</span>
            ) : null}
          </button>
        );
      })}
      <span className="text-[10px] text-text-secondary/40 ml-1">Setups</span>
    </div>
  );
}
