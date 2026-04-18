import { TIER_COLORS, type Tier } from "./tierColors";

interface TierBadgeProps {
  tier: Tier;
  count?: number | string;
  className?: string;
}

export default function TierBadge({ tier, count, className = "" }: TierBadgeProps) {
  const colors = TIER_COLORS[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.badge} ${className}`}
    >
      <span>{tier}</span>
      {count !== undefined && <span className="opacity-70">{count}</span>}
    </span>
  );
}
