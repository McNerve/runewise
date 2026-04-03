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

export default function DpsBreakdown({
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
      {/* Primary results */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent tabular-nums">
            {maxHit}
          </div>
          <div className="text-xs text-text-secondary mt-1">Max Hit</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold tabular-nums ${accColor}`}>
            {accPct}%
          </div>
          <div className="text-xs text-text-secondary mt-1">Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent tabular-nums">
            {dps.toFixed(2)}
          </div>
          <div className="text-xs text-text-secondary mt-1">DPS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary tabular-nums">
            {formatTtk(ttk)}
          </div>
          <div className="text-xs text-text-secondary mt-1">Time to Kill</div>
        </div>
      </div>

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
}
