import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Optional small icon shown next to the value */
  icon?: ReactNode | string;
  /** Optional supporting text under the value (e.g. "of 1,699", "/24") */
  suffix?: ReactNode;
  /** Tailwind text color class applied to the value (e.g. "text-accent"). Use sparingly — the primary is white. */
  accent?: string;
  onClick?: () => void;
  className?: string;
  title?: string;
}

/**
 * Single stat cell — Star Helper 4-stat header style.
 * Value is prominent (white by default), label is muted. One optional accent.
 */
export function StatCard({
  label,
  value,
  icon,
  suffix,
  accent,
  onClick,
  className = "",
  title,
}: StatCardProps) {
  const valueClass = `text-lg font-semibold tabular-nums ${accent ?? "text-text-primary"}`;
  const body = (
    <>
      <div className="flex items-center gap-1.5">
        {typeof icon === "string" ? (
          <img
            src={icon}
            alt=""
            className="w-4 h-4 opacity-70"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : icon}
        <div className="section-kicker truncate" title={label}>{label}</div>
      </div>
      <div className={`mt-1 ${valueClass}`}>
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-normal text-text-secondary/60">{suffix}</span>
        )}
      </div>
    </>
  );

  const baseStyle = "rounded-xl border border-border/60 bg-bg-primary/45 px-4 py-3";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${baseStyle} text-left transition-colors hover:border-accent/35 hover:bg-bg-primary/70 ${className}`}
      >
        {body}
      </button>
    );
  }

  return (
    <div title={title} className={`${baseStyle} ${className}`}>
      {body}
    </div>
  );
}

interface StatGridProps {
  children: ReactNode;
  /** Number of columns at md+ breakpoint (default 4). */
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const COLS: Record<2 | 3 | 4 | 5 | 6, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-5",
  6: "grid-cols-3 md:grid-cols-6",
};

/**
 * Responsive grid for StatCards. Standardizes gaps.
 */
export function StatGrid({ children, columns = 4, className = "" }: StatGridProps) {
  return <div className={`grid ${COLS[columns]} gap-3 ${className}`}>{children}</div>;
}
