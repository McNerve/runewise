import { useState } from "react";
import type { View } from "../lib/features";
import { NAV_ICONS } from "../lib/sprites";
import AppIcon from "./AppIcon";

interface ShellIconProps {
  view: View;
  className?: string;
}

export default function ShellIcon({ view, className = "h-4 w-4" }: ShellIconProps) {
  const [failed, setFailed] = useState(false);
  const src = NAV_ICONS[view];

  if (!src || failed) {
    return <AppIcon view={view} className={className} />;
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
