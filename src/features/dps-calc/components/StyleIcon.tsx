import { Swords, Crosshair, Sparkles } from "lucide-react";

/** Combat-style glyph. Replaces emoji (⚔️🏹🔮), which render inconsistently
 * across platforms and fall back to tofu boxes without an emoji font. */
export default function StyleIcon({
  style,
  className = "h-3 w-3",
}: {
  style: string;
  className?: string;
}) {
  const Icon = style === "ranged" ? Crosshair : style === "magic" ? Sparkles : Swords;
  return <Icon className={className} aria-hidden />;
}
