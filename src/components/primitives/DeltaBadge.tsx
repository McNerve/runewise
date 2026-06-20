interface DeltaBadgeProps {
  /** Signed delta — its sign drives the colour and arrow. */
  delta: number;
  /** Render the delta number (default: signed, 2 decimals). */
  format?: (n: number) => string;
  /** Optional trailing percentage, shown muted. */
  pct?: number;
  className?: string;
  title?: string;
}

const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;

const TONE: Record<"pos" | "neg" | "neutral", string> = {
  pos: "bg-success/12 text-success",
  neg: "bg-danger/12 text-danger",
  neutral: "bg-bg-secondary text-text-secondary",
};

/**
 * op.gg-style delta chip — a directional, colour-coded verdict for a
 * comparison (DPS gained, price swing, stat diff). Numbers render mono.
 */
export function DeltaBadge({
  delta,
  format = fmtSigned,
  pct,
  className = "",
  title,
}: DeltaBadgeProps) {
  const tone = delta > 0 ? "pos" : delta < 0 ? "neg" : "neutral";
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "·";
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium num ${TONE[tone]} ${className}`}
    >
      <span aria-hidden="true" className="text-[8px] leading-none">
        {arrow}
      </span>
      {format(delta)}
      {pct != null && (
        <span className="opacity-60">
          {pct >= 0 ? "+" : ""}
          {pct.toFixed(1)}%
        </span>
      )}
    </span>
  );
}
