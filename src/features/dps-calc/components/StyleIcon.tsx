import { useState } from "react";
import { Swords, Crosshair, Sparkles } from "lucide-react";
import { skillIcon } from "../../../lib/sprites";

const SKILL_BY_STYLE: Record<string, string> = {
  melee: "Attack",
  ranged: "Ranged",
  magic: "Magic",
};

/** Combat-style marker. Game concepts get game art: the official Attack /
 * Ranged / Magic skill sprites, matching the sidebar and prayer icons. The
 * Lucide glyph is only a fallback when the sprite can't load (offline). */
export default function StyleIcon({
  style,
  className = "h-3 w-3",
}: {
  style: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const Icon = style === "ranged" ? Crosshair : style === "magic" ? Sparkles : Swords;
    return <Icon className={className} aria-hidden />;
  }

  return (
    <img
      src={skillIcon(SKILL_BY_STYLE[style] ?? "Attack")}
      alt=""
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
      aria-hidden
    />
  );
}
