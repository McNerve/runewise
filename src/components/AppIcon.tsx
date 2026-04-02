import type { View } from "../lib/features";

interface AppIconProps {
  view: View;
  className?: string;
}

function IconBase({
  className,
  children,
  viewBox = "0 0 24 24",
}: {
  className?: string;
  children: React.ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function AppIcon({ view, className = "h-4 w-4" }: AppIconProps) {
  switch (view) {
    case "home":
      return (
        <IconBase className={className}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
        </IconBase>
      );
    case "overview":
      return (
        <IconBase className={className}>
          <path d="M4.5 19.5h15" />
          <path d="M7 16V9" />
          <path d="M12 16V5.5" />
          <path d="M17 16v-7" />
        </IconBase>
      );
    case "lookup":
      return (
        <IconBase className={className}>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="m15.5 15.5 4 4" />
        </IconBase>
      );
    case "tracker":
      return (
        <IconBase className={className}>
          <path d="M5 18V9" />
          <path d="M10 18V6" />
          <path d="M15 18v-4" />
          <path d="M20 18V8" />
        </IconBase>
      );
    case "market":
      return (
        <IconBase className={className}>
          <path d="M7 7h8" />
          <path d="M8 12h10" />
          <path d="M7 17h8" />
          <path d="M5.5 5.5h1" />
          <path d="M17.5 15.5h1" />
        </IconBase>
      );
    case "watchlist":
      return (
        <IconBase className={className}>
          <path d="M12 5v14" />
          <path d="M7 10.5 12 5l5 5.5" />
          <path d="M18 18H6" />
        </IconBase>
      );
    case "bosses":
    case "loot":
    case "combat-tasks":
    case "dps-calc":
    case "dry-calc":
    case "pet-calc":
      return (
        <IconBase className={className}>
          <path d="M8 5.5 18.5 16" />
          <path d="M15.5 5.5 18.5 8.5 8 19l-3.5.5L5 16z" />
          <path d="M6.5 6.5 9 9" />
        </IconBase>
      );
    case "skill-calc":
    case "xp-table":
      return (
        <IconBase className={className}>
          <path d="M6 5.5h12" />
          <path d="M6 10.5h12" />
          <path d="M6 15.5h8" />
          <path d="M6 19.5h12" />
        </IconBase>
      );
    case "progress":
    case "wiki":
    case "news":
      return (
        <IconBase className={className}>
          <path d="M6 5.5h9a3 3 0 0 1 3 3v10H9a3 3 0 0 0-3 3z" />
          <path d="M6 5.5v13a3 3 0 0 1 3-3h9" />
        </IconBase>
      );
    case "slayer":
      return (
        <IconBase className={className}>
          <path d="M12 4.5 18.5 8v8L12 19.5 5.5 16V8z" />
          <path d="M9 10.5h6" />
          <path d="M9 13.5h6" />
        </IconBase>
      );
    case "clue-helper":
      return (
        <IconBase className={className}>
          <path d="M6 6.5h12v11H6z" />
          <path d="M9 10h6" />
          <path d="M9 13h4" />
          <path d="M15.5 17.5 18 20" />
        </IconBase>
      );
    case "money-making":
      return (
        <IconBase className={className}>
          <path d="M12 4.5v15" />
          <path d="M16 8.5a3.5 3.5 0 0 0-3.5-2H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-2.5A3.5 3.5 0 0 1 8 16.5" />
        </IconBase>
      );
    case "stars":
      return (
        <IconBase className={className}>
          <path d="m12 4 1.9 4.6 5 .4-3.8 3.2 1.2 4.8L12 14.4 7.7 17l1.2-4.8L5 9l5-.4z" />
        </IconBase>
      );
    case "timers":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="13" r="6.5" />
          <path d="M12 13V9.5" />
          <path d="M12 13l3 2" />
          <path d="M9 4.5h6" />
        </IconBase>
      );
    case "settings":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 4.5v2" />
          <path d="M12 17.5v2" />
          <path d="m5.6 6.1 1.4 1.4" />
          <path d="m17 17.5 1.4 1.4" />
          <path d="M4.5 12h2" />
          <path d="M17.5 12h2" />
          <path d="m5.6 17.9 1.4-1.4" />
          <path d="m17 6.5 1.4-1.4" />
        </IconBase>
      );
    default:
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="7" />
        </IconBase>
      );
  }
}
