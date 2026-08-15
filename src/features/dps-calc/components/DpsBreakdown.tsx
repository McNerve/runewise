import { memo } from "react";
import { StatGrid, StatCard } from "../../../components/primitives";
import { accuracyTier, dpsVerdict, formatTtk } from "../dpsVerdict";

interface DpsBreakdownProps {
  maxHit: number;
  accuracy: number;
  dps: number;
  ttk: number;
  attackRoll: number;
  defenseRoll: number;
  showDetails?: boolean;
  monsterName?: string | null;
  hitsToKill?: number | null;
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
  monsterName = null,
  hitsToKill = null,
}: DpsBreakdownProps) {
  const accPct = (accuracy * 100).toFixed(1);
  const tier = accuracyTier(accuracy);
  const accColor =
    tier === "high" ? "text-success" : tier === "moderate" ? "text-warning" : "text-danger";
  const accLabel =
    tier === "high" ? "High accuracy" : tier === "moderate" ? "Moderate accuracy" : "Low accuracy";
  const accBar =
    tier === "high" ? "bg-success" : tier === "moderate" ? "bg-warning" : "bg-danger";
  const line = dpsVerdict({ monsterName, dps, ttk, accuracy });

  return (
    <div className="space-y-4">
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

      <p className="text-sm leading-6 text-text-secondary">{line}</p>

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

      <StatGrid columns={2}>
        <StatCard label="Max Hit" value={maxHit} />
        <StatCard
          label="Hits to kill"
          value={hitsToKill != null && isFinite(hitsToKill) ? hitsToKill.toFixed(1) : "—"}
        />
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
