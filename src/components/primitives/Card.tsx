import type { ReactNode } from "react";

type Elevation = "flat" | "raised" | "overlay" | "hero";

interface CardProps {
  /** Uppercase section label rendered in the card header. */
  kicker?: ReactNode;
  /** Right-aligned header content (actions, toggles). */
  action?: ReactNode;
  /**
   * Surface elevation (Ledger Studio ladder):
   * - `flat`    — surface-1, no border. Nested groupings inside a card.
   * - `raised`  — surface-2 + hairline border. The DEFAULT card.
   * - `overlay` — surface-4 + soft drop-shadow. Menus / tooltips / modals.
   * - `hero`    — surface-2 + gold edge. The one focal element per view.
   */
  elevation?: Elevation;
  children: ReactNode;
  className?: string;
}

const SURFACE: Record<Elevation, string> = {
  flat: "bg-bg-base",
  raised:
    "border border-border-subtle bg-bg-tertiary shadow-[0_1px_0_color-mix(in_srgb,var(--color-text-primary)_4%,transparent),0_10px_24px_-16px_rgba(0,0,0,0.45)]",
  overlay:
    "border border-border bg-bg-overlay shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md",
  hero: "border border-accent-deep/80 bg-bg-tertiary shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_12%,transparent),0_14px_32px_-14px_color-mix(in_srgb,var(--color-accent)_30%,transparent)]",
};

/**
 * Standard content card — clear figure-ground against the content canvas.
 */
export function Card({
  kicker,
  action,
  elevation = "raised",
  children,
  className = "",
}: CardProps) {
  return (
    <section className={`rounded-2xl p-4 sm:p-5 ${SURFACE[elevation]} ${className}`}>
      {(kicker || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {kicker ? <div className="section-kicker">{kicker}</div> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
