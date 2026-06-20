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
  // One accuracy tier drives the value color, verdict label, and bar fill.
  const accTier = accuracy >= 0.8 ? 0 : accuracy >= 0.5 ? 1 : 2;
  const accColor = ["text-success", "text-warning", "text-danger"][accTier];
  const accLabel = ["High accuracy", "Moderate accuracy", "Low accuracy"][accTier];
  const accBar = ["bg-success", "bg-warning", "bg-danger"][accTier];

  return (
    <div className="space-y-4">
      {/* Hero verdict — DPS is the one focal metric, TTK the supporting answer.
          No nested Card: this already renders inside the Results card. */}
      <div className="flex items-end justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="hero-metric text-accent-bright">{dps.toFixed(2)}</div>
          <div className="section-kicker mt-1">damage / second</div>
        </div>
        <div className="text-right">
          <div className="num text-h3 font-semibold text-text-primary" title="Expected time to kill">
            {formatTtk(ttk)}
          </div>
          <div className="section-kicker">time to kill</div>
        </div>
      </div>

      {/* Accuracy verdict + bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="section-kicker">{accLabel}</span>
          <span className={`num text-sm font-semibold ${accColor}`}>{accPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${accBar}`}
            style={{ width: `${Math.min(accuracy * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Supporting stats */}
      <StatGrid columns={2}>
        <StatCard label="Max Hit" value={maxHit} />
        <StatCard label="Accuracy" value={`${accPct}%`} accent={accColor} />
      </StatGrid>

      {/* Roll breakdown */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-base rounded-lg px-3 py-2">
            <div className="text-xs text-text-secondary">Attack Roll</div>
            <div className="num text-sm font-medium">{formatRoll(attackRoll)}</div>
          </div>
          <div className="bg-bg-base rounded-lg px-3 py-2">
            <div className="text-xs text-text-secondary">Defence Roll</div>
            <div className="num text-sm font-medium">{formatRoll(defenseRoll)}</div>
          </div>
        </div>
      )}
    </div>
  );
});
