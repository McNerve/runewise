import type { ReactNode } from "react";

type Elevation = "flat" | "raised" | "overlay" | "hero";

interface CardProps {
  /** Uppercase section label rendered in the card header. */
  kicker?: ReactNode;
  /** Right-aligned header content (actions, toggles). */
  action?: ReactNode;
  /**
   * Surface elevation (Gielinor Ledger ladder):
   * - `flat`    — surface-1, no border. Nested groupings inside a card.
   * - `raised`  — surface-2 + hairline border. The DEFAULT card.
   * - `overlay` — surface-4 + soft drop-shadow. Menus / tooltips / modals.
   * - `hero`    — surface-2 + deep-gold border. The one focal element per view.
   */
  elevation?: Elevation;
  children: ReactNode;
  className?: string;
}

const SURFACE: Record<Elevation, string> = {
  flat: "bg-bg-base",
  raised: "border border-border-subtle bg-bg-tertiary",
  overlay:
    "border border-border bg-bg-overlay shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]",
  hero: "border border-accent-deep bg-bg-tertiary",
};

/**
 * Standard content card — the one surface treatment for grouped controls
 * and results. Carries a real raised surface (genuine figure-ground) from
 * the token ladder instead of the old translucent `bg-bg-primary/20`.
 */
export function Card({
  kicker,
  action,
  elevation = "raised",
  children,
  className = "",
}: CardProps) {
  return (
    <section className={`rounded-xl p-4 ${SURFACE[elevation]} ${className}`}>
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
