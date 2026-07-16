import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent border border-accent-deep/40 font-semibold hover:bg-accent-hover shadow-[0_1px_0_color-mix(in_srgb,var(--color-on-accent)_10%,transparent),0_6px_14px_-8px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]",
  secondary:
    "bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-secondary hover:text-text-primary hover:border-border-strong",
  ghost:
    "bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-bg-tertiary/70",
  danger:
    "bg-transparent text-text-secondary/60 border border-transparent hover:text-danger hover:bg-danger/10",
};

const SIZES: Record<Size, string> = {
  xs: "gap-1 rounded-lg px-2 py-0.5 text-2xs",
  sm: "gap-1.5 rounded-xl px-3 py-1.5 text-xs",
  md: "gap-2 rounded-xl px-4 py-2 text-sm",
};

/**
 * The app-wide button. Variants: primary (one per view, the main action),
 * secondary (boxed utility actions), ghost (low-emphasis inline actions),
 * danger (destructive, quiet until hovered).
 */
export function Button({
  variant = "secondary",
  size = "sm",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rw-button inline-flex items-center justify-center disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
