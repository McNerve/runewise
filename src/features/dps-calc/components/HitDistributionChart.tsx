import { memo, useMemo } from "react";
import { hitDistribution } from "../../../lib/formulas/hitDistribution";

interface HitDistributionChartProps {
  maxHit: number;
  accuracy: number;
}

const CHART_W = 300;
const CHART_H = 72;
const LABEL_H = 14;

/** Probability mass of every possible damage value for a single attack. */
export default memo(function HitDistributionChart({ maxHit, accuracy }: HitDistributionChartProps) {
  const dist = useMemo(() => hitDistribution(maxHit, accuracy), [maxHit, accuracy]);

  if (maxHit <= 0) return null;

  const peak = Math.max(...dist.pmf);
  const barW = CHART_W / dist.pmf.length;
  const expectedX = (dist.expectedHit + 0.5) * barW;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">
          Hit Distribution
        </div>
        <div className="text-[10px] text-text-secondary num">
          avg <span className="text-text-primary font-medium">{dist.expectedHit.toFixed(1)}</span>
          <span className="mx-1 text-text-secondary/40">·</span>
          0-hit <span className="text-text-primary font-medium">{(dist.zeroChance * 100).toFixed(0)}%</span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H + LABEL_H}`}
        className="mt-1.5 w-full"
        role="img"
        aria-label={`Damage distribution from 0 to ${maxHit}, average hit ${dist.expectedHit.toFixed(1)}`}
      >
        {dist.pmf.map((p, k) => {
          const h = peak > 0 ? (p / peak) * (CHART_H - 4) : 0;
          return (
            <rect
              key={k}
              x={k * barW + barW * 0.1}
              y={CHART_H - h}
              width={barW * 0.8}
              height={h}
              rx={Math.min(1.5, barW * 0.3)}
              className={k === 0 ? "fill-text-secondary/25" : "fill-accent/70"}
            >
              <title>{`${k} damage — ${(p * 100).toFixed(2)}%`}</title>
            </rect>
          );
        })}
        <line
          x1={expectedX}
          y1={2}
          x2={expectedX}
          y2={CHART_H}
          strokeDasharray="3 3"
          className="stroke-warning"
          strokeWidth={1}
        >
          <title>{`Average hit: ${dist.expectedHit.toFixed(1)}`}</title>
        </line>
        <text x={2} y={CHART_H + LABEL_H - 3} className="fill-text-secondary/50 text-[9px] num">
          0
        </text>
        <text
          x={CHART_W - 2}
          y={CHART_H + LABEL_H - 3}
          textAnchor="end"
          className="fill-text-secondary/50 text-[9px] num"
        >
          {maxHit}
        </text>
      </svg>
    </div>
  );
});
