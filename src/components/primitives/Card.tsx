import type { ReactNode } from "react";

interface CardProps {
  /** Uppercase section label rendered in the card header. */
  kicker?: ReactNode;
  /** Right-aligned header content (actions, toggles). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standard content card — the one surface treatment for grouped controls
 * and results. Replaces the hand-rolled
 * `rounded-xl border border-border/40 bg-bg-primary/20 p-4` pattern.
 */
export function Card({ kicker, action, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-xl border border-border/40 bg-bg-primary/20 p-4 ${className}`}>
      {(kicker || action) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {kicker ? <div className="section-kicker">{kicker}</div> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
