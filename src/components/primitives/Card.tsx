import type { ReactNode, CSSProperties } from "react";

type Elevation = "flat" | "raised" | "overlay" | "hero";

interface CardProps {
  children: ReactNode;
  /**
   * Surface elevation (Gielinor Ledger ladder):
   * - `flat`    — surface-1, no border. Nested groupings inside a raised card.
   * - `raised`  — surface-2 + hairline border. The DEFAULT card.
   * - `overlay` — surface-4 + soft drop-shadow. Menus, tooltips, modals only.
   * - `hero`    — surface-2 + deep-gold border. The one focal element per view.
   */
  elevation?: Elevation;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  title?: string;
}

const SURFACE: Record<Elevation, string> = {
  flat: "bg-bg-base rounded-xl",
  raised: "bg-bg-tertiary border border-border-subtle rounded-xl",
  overlay:
    "bg-bg-overlay border border-border rounded-xl shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]",
  hero: "bg-bg-tertiary border border-accent-deep rounded-2xl",
};

/**
 * Canonical surface primitive. Replaces ad-hoc
 * `rounded-xl border border-border-subtle bg-bg-tertiary` cards so every
 * surface reads as a real, layered surface instead of a translucent guess.
 */
export default function Card({
  children,
  elevation = "raised",
  className = "",
  style,
  onClick,
  title,
}: CardProps) {
  const base = SURFACE[elevation];

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        style={style}
        className={`${base} text-left transition-colors hover:border-border-strong ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div title={title} style={style} className={`${base} ${className}`}>
      {children}
    </div>
  );
}
