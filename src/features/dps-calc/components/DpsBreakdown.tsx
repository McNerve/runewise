import { memo } from "react";
import { StatGrid, StatCard } from "../../../components/primitives";

interface DpsBreakdownProps {
  maxHit: number;
  accuracy: number;
  dps: number;
  ttk: number;
  attackRoll: number;
  defenseRoll: number;
  showDetails?: boolean;
}

function formatTtk(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatRoll(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export default memo(function DpsBreakdown({
  maxHit,
  accuracy,
  dps,
  ttk,
  attackRoll,
  defenseRoll,
  showDetails = false,
}: DpsBreakdownProps) {
  const accPct = (accuracy * 100).toFixed(1);
  const accColor =
    accuracy >= 0.8
      ? "text-success"
      : accuracy >= 0.5
        ? "text-warning"
        : "text-danger";

  return (
    <div className="space-y-4">
      {/* Primary results — DPS is the one accent; accuracy uses traffic-light. */}
      <StatGrid columns={4}>
        <StatCard label="Max Hit" value={maxHit} />
        <StatCard label="Accuracy" value={`${accPct}%`} accent={accColor} />
        <StatCard label="DPS" value={dps.toFixed(2)} accent="text-accent" />
        <StatCard label="Time to Kill" value={formatTtk(ttk)} />
      </StatGrid>

      {/* Accuracy bar */}
      <div>
        <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              accuracy >= 0.8
                ? "bg-success"
                : accuracy >= 0.5
                  ? "bg-warning"
                  : "bg-danger"
            }`}
            style={{ width: `${Math.min(accuracy * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Roll breakdown */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-tertiary/50 rounded-lg px-3 py-2">
            <div className="text-xs text-text-secondary">Attack Roll</div>
            <div className="text-sm font-medium tabular-nums">
              {formatRoll(attackRoll)}
            </div>
          </div>
          <div className="bg-bg-tertiary/50 rounded-lg px-3 py-2">
            <div className="text-xs text-text-secondary">Defence Roll</div>
            <div className="text-sm font-medium tabular-nums">
              {formatRoll(defenseRoll)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
