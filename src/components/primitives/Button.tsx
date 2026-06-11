import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent border border-transparent font-medium hover:bg-accent-hover",
  secondary:
    "bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-secondary hover:text-text-primary",
  ghost:
    "bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-bg-tertiary/60",
  danger:
    "bg-transparent text-text-secondary/60 border border-transparent hover:text-danger hover:bg-danger/10",
};

const SIZES: Record<Size, string> = {
  xs: "gap-1 rounded-md px-2 py-0.5 text-2xs",
  sm: "gap-1.5 rounded-lg px-3 py-1.5 text-xs",
  md: "gap-2 rounded-lg px-4 py-2 text-sm",
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
      className={`inline-flex items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
