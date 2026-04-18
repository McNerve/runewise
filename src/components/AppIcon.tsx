import type { View } from "../lib/features";

interface AppIconProps {
  view: View;
  className?: string;
}

// OSRS-inspired silhouette glyph set. All paths use currentColor so the
// sidebar's feature-accent CSS variable can tint them. Each glyph is tuned
// to read clearly at 16-20px.
function Glyph({
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
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function AppIcon({ view, className = "h-4 w-4" }: AppIconProps) {
  switch (view) {
    // Lumbridge-castle silhouette: crenellated keep with gate.
    case "home":
      return (
        <Glyph className={className}>
          <path d="M3 11v9h18v-9l-3-2V6h-2v1.7L12 5 8 7.7V6H6v3z" />
          <path d="M3 11h18v1.5H3z" opacity="0" />
          <path d="M10.5 14.5h3v5.5h-3z" fill="var(--app-bg, #0b0f17)" opacity="0.35" />
        </Glyph>
      );

    // Character bust in profile.
    case "overview":
      return (
        <Glyph className={className}>
          <circle cx="12" cy="8" r="3.8" />
          <path d="M4.5 20c0-4 3.4-6.8 7.5-6.8s7.5 2.8 7.5 6.8z" />
        </Glyph>
      );

    // Scroll with unfurled top — Hiscores.
    case "lookup":
      return (
        <Glyph className={className}>
          <path d="M6 4h11a3 3 0 0 1 3 3v1h-3V7a1 1 0 0 0-2 0v13H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2zm0 2a1 1 0 0 0 0 2h7V6z" />
          <path d="M9 12h5v1.5H9zM9 15h5v1.5H9z" fill="var(--app-bg, #0b0f17)" opacity="0.45" />
        </Glyph>
      );

    // Treasure chest with clasp — Collection Log.
    case "collection-log":
      return (
        <Glyph className={className}>
          <path d="M4 8.5h16V20H4z" />
          <path d="M5 5h14a2 2 0 0 1 2 2v2H3V7a2 2 0 0 1 2-2z" />
          <rect x="10.8" y="10" width="2.4" height="4.2" rx="0.4" fill="var(--app-bg, #0b0f17)" opacity="0.55" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" />
        </Glyph>
      );

    // Upward trend line with coin — XP/gains tracker.
    case "tracker":
      return (
        <Glyph className={className}>
          <path d="M3 19h18v1.5H3z" />
          <path d="m4 16 5-5 3.5 3 4-5 .6.6-5.6 7-3.5-3-3 3z" />
          <circle cx="18.5" cy="7.5" r="3" />
          <circle cx="18.5" cy="7.5" r="1" fill="var(--app-bg, #0b0f17)" opacity="0.55" />
        </Glyph>
      );

    // Skill cape with neck collar — Skill Calculator.
    case "skill-calc":
      return (
        <Glyph className={className}>
          <path d="M6 5h4a2 2 0 0 0 4 0h4l2 6-4 1v9H8v-9l-4-1z" />
          <path d="M10 5a2 2 0 0 0 4 0" stroke="var(--app-bg, #0b0f17)" strokeWidth="0.6" fill="none" opacity="0.55" />
        </Glyph>
      );

    // Crossed scimitars — DPS Calculator.
    case "dps-calc":
      return (
        <Glyph className={className}>
          <path d="m4 4 2-1 12 12-2 2z" />
          <path d="m20 4-2-1L6 15l2 2z" />
          <rect x="3" y="18" width="5" height="2" rx="0.5" transform="rotate(-45 5.5 19)" />
          <rect x="16" y="18" width="5" height="2" rx="0.5" transform="rotate(45 18.5 19)" />
        </Glyph>
      );

    // Shard / dust pile — Dry Calculator.
    case "dry-calc":
      return (
        <Glyph className={className}>
          <path d="m12 3 2.5 5L20 10l-4 3.5 1 5.5-5-3-5 3 1-5.5L4 10l5.5-2z" />
          <circle cx="6" cy="19" r="1.1" />
          <circle cx="18" cy="19" r="0.9" />
          <circle cx="12" cy="20.5" r="0.8" />
        </Glyph>
      );

    // Paw print — Pet Calculator.
    case "pet-calc":
      return (
        <Glyph className={className}>
          <ellipse cx="7" cy="9" rx="1.7" ry="2.3" />
          <ellipse cx="17" cy="9" rx="1.7" ry="2.3" />
          <ellipse cx="10" cy="5.5" rx="1.5" ry="2" />
          <ellipse cx="14" cy="5.5" rx="1.5" ry="2" />
          <path d="M12 10.5c-3.3 0-5.5 2.3-5.5 5a3 3 0 0 0 3 3c1 0 1.5-.6 2.5-.6s1.5.6 2.5.6a3 3 0 0 0 3-3c0-2.7-2.2-5-5.5-5z" />
        </Glyph>
      );

    // Mortar and pestle — Production / Recipe.
    case "production-calc":
      return (
        <Glyph className={className}>
          <path d="M5 11h14l-1.5 5.5A3 3 0 0 1 14.6 19H9.4a3 3 0 0 1-2.9-2.5z" />
          <rect x="4" y="9.5" width="16" height="2" rx="1" />
          <path d="M14.5 3.5 17 6l-4 4-2.5-2.5z" transform="rotate(15 13 6)" />
        </Glyph>
      );

    // Royal crown — Kingdom.
    case "kingdom":
      return (
        <Glyph className={className}>
          <path d="M3 9.5 6 14l3-4 3 5 3-5 3 4 3-4.5V18H3z" />
          <circle cx="3" cy="8" r="1.3" />
          <circle cx="12" cy="6.2" r="1.4" />
          <circle cx="21" cy="8" r="1.3" />
          <rect x="3" y="18" width="18" height="2" rx="0.5" />
        </Glyph>
      );

    // Two swords facing each other — Gear Compare.
    case "gear-compare":
      return (
        <Glyph className={className}>
          <path d="M3 3h2l4 8-2 2-4-8z" />
          <path d="M6 12h4v2H5zM8 14l3 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M21 3h-2l-4 8 2 2 4-8z" />
          <path d="M18 12h-4v2h5zM16 14l-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="10.5" y="17" width="3" height="4" rx="0.5" />
        </Glyph>
      );

    // Stack of coins — Money Making.
    case "money-making":
      return (
        <Glyph className={className}>
          <ellipse cx="12" cy="6.5" rx="6" ry="2.2" />
          <path d="M6 6.5v3c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-3c0 1.2-2.7 2.2-6 2.2s-6-1-6-2.2z" />
          <path d="M6 11v3c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-3c0 1.2-2.7 2.2-6 2.2s-6-1-6-2.2z" />
          <path d="M6 15.5v3c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-3c0 1.2-2.7 2.2-6 2.2s-6-1-6-2.2z" />
        </Glyph>
      );

    // Farming: seedling sprouting from soil mound — Timers.
    case "timers":
      return (
        <Glyph className={className}>
          <path d="M12 13c-1-3-4-4-6-3 0 3 2 5 6 5z" />
          <path d="M12 13c1-3 4-4 6-3 0 3-2 5-6 5z" />
          <path d="M12 8v6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M3 17h18l-2 4H5z" />
        </Glyph>
      );

    // Skull silhouette with horns — Bosses.
    case "bosses":
      return (
        <Glyph className={className}>
          <path d="M12 3c-4.4 0-8 3.3-8 7.6 0 2.6 1.3 4.9 3.2 6.3V20h2.4v-2.1c.3.1.7.1 1 .1v2h2.8v-2c.3 0 .7 0 1-.1V20h2.4v-3.1c1.9-1.4 3.2-3.7 3.2-6.3C20 6.3 16.4 3 12 3z" />
          <circle cx="9.3" cy="11" r="1.6" fill="var(--app-bg, #0b0f17)" opacity="0.8" />
          <circle cx="14.7" cy="11" r="1.6" fill="var(--app-bg, #0b0f17)" opacity="0.8" />
          <path d="M10.5 14.5h3v1.5h-3z" fill="var(--app-bg, #0b0f17)" opacity="0.55" />
        </Glyph>
      );

    // Portal pillars (raid entrance) — Raids.
    case "raids":
      return (
        <Glyph className={className}>
          <rect x="4" y="5" width="3.5" height="15" rx="0.3" />
          <rect x="16.5" y="5" width="3.5" height="15" rx="0.3" />
          <path d="M7 5c0-1.5 2.2-2.5 5-2.5s5 1 5 2.5v4c0 1.5-2.2 2.5-5 2.5S7 10.5 7 9z" opacity="0.85" />
          <path d="M10 19v-6a2 2 0 0 1 4 0v6z" />
        </Glyph>
      );

    // Loot sack with drawstring — Loot.
    case "loot":
      return (
        <Glyph className={className}>
          <path d="M8 7.5h8l2.5 3.5a7 7 0 1 1-13 0z" />
          <path d="M8 7.5c0-2 2-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="1.6" fill="none" />
          <path d="M10 6c0-1 .8-1.5 2-1.5s2 .5 2 1.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7" />
          <circle cx="12" cy="14" r="1.3" fill="var(--app-bg, #0b0f17)" opacity="0.6" />
        </Glyph>
      );

    // GE booth — Market (awning + counter + post).
    case "market":
      return (
        <Glyph className={className}>
          <path d="M3 8 5 4h14l2 4v2H3z" />
          <path d="M6 4l-1 4h3l1-4zM11 4l-1 4h4l-1-4zM16 4l-1 4h3l-1-4z" fill="var(--app-bg, #0b0f17)" opacity="0.35" />
          <rect x="4" y="10" width="16" height="2" />
          <rect x="5" y="12" width="14" height="8" />
          <rect x="10" y="14" width="4" height="6" fill="var(--app-bg, #0b0f17)" opacity="0.55" />
        </Glyph>
      );

    // Rune tablet — Spells (diamond with central mark).
    case "spells":
      return (
        <Glyph className={className}>
          <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" />
          <path d="M12 6.5 17.5 12 12 17.5 6.5 12z" fill="var(--app-bg, #0b0f17)" opacity="0.55" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </Glyph>
      );

    // Slayer helmet silhouette (iconic OSRS shape).
    case "slayer":
      return (
        <Glyph className={className}>
          <path d="M5 12a7 7 0 0 1 14 0v4H5z" />
          <path d="M5 16h14v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
          <rect x="7" y="11" width="10" height="2.5" rx="0.4" fill="var(--app-bg, #0b0f17)" opacity="0.6" />
          <path d="M11.2 11v2.5M12.8 11v2.5" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
          <path d="M12 3c-1 0-1.5.6-1.5 1.5 0 .8.5 1.2 1.5 1.2s1.5-.4 1.5-1.2c0-.9-.5-1.5-1.5-1.5z" />
        </Glyph>
      );

    // Clue scroll — rolled scroll with seal.
    case "clue-helper":
      return (
        <Glyph className={className}>
          <rect x="4" y="5" width="3" height="14" rx="1.5" />
          <rect x="17" y="5" width="3" height="14" rx="1.5" />
          <rect x="6.5" y="6" width="11" height="12" />
          <path d="M9 9.5h6M9 12h6M9 14.5h4" stroke="var(--app-bg, #0b0f17)" strokeWidth="1" opacity="0.55" fill="none" />
          <circle cx="15.5" cy="15" r="1.8" fill="currentColor" />
        </Glyph>
      );

    // Shopkeeper banner/flag — Shop Helper.
    case "shop-helper":
      return (
        <Glyph className={className}>
          <rect x="11.2" y="3" width="1.6" height="18" rx="0.4" />
          <path d="M13 4h7l-2 3 2 3h-7z" />
          <circle cx="11.5" cy="20" r="1" />
        </Glyph>
      );

    // Shooting star — Stars.
    case "stars":
      return (
        <Glyph className={className}>
          <path d="M14.5 3.5 16 7l3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5L9.5 8.5 13 7z" />
          <path d="m11 11-7 9 1 .5 8-7.5z" opacity="0.85" />
          <circle cx="7" cy="17" r="0.8" />
          <circle cx="5" cy="14" r="0.6" />
        </Glyph>
      );

    // World map with pin.
    case "world-map":
      return (
        <Glyph className={className}>
          <path d="M3 6 9 4l6 2 6-2v14l-6 2-6-2-6 2z" />
          <path d="M9 4v16M15 6v16" stroke="var(--app-bg, #0b0f17)" strokeWidth="0.8" opacity="0.5" fill="none" />
          <path d="M12 9c-2 0-3.5 1.5-3.5 3.3 0 2.2 3.5 5.2 3.5 5.2s3.5-3 3.5-5.2C15.5 10.5 14 9 12 9z" />
          <circle cx="12" cy="12.3" r="1.1" fill="var(--app-bg, #0b0f17)" opacity="0.8" />
        </Glyph>
      );

    // Newspaper.
    case "news":
      return (
        <Glyph className={className}>
          <path d="M4 5h13v14H6a2 2 0 0 1-2-2z" />
          <path d="M17 8h3v9a2 2 0 0 1-2 2h-1z" />
          <rect x="6" y="7.5" width="9" height="2" fill="var(--app-bg, #0b0f17)" opacity="0.55" />
          <path d="M6 11h9M6 13h9M6 15h6" stroke="var(--app-bg, #0b0f17)" strokeWidth="0.8" opacity="0.55" fill="none" />
        </Glyph>
      );

    // Open book — Wiki.
    case "wiki":
      return (
        <Glyph className={className}>
          <path d="M3 5.5c3-1 6-1 9 .5v13c-3-1.5-6-1.5-9-.5z" />
          <path d="M21 5.5c-3-1-6-1-9 .5v13c3-1.5 6-1.5 9-.5z" />
          <path d="M6 9h4M6 11.5h4M6 14h3M14 9h4M14 11.5h4M14 14h3" stroke="var(--app-bg, #0b0f17)" strokeWidth="0.8" opacity="0.5" fill="none" />
        </Glyph>
      );

    // Gear — Settings.
    case "settings":
      return (
        <Glyph className={className}>
          <path d="M12 2 13.2 4.2 15.7 3.3 16 5.8 18.5 5.8 17.5 8.2 20 9.5 18.2 11.2 19.5 13.5 17 14.2 17 17 14.5 16.8 13.5 19 12 17.5 10.5 19 9.5 16.8 7 17 7 14.2 4.5 13.5 5.8 11.2 4 9.5 6.5 8.2 5.5 5.8 8 5.8 8.3 3.3 10.8 4.2z" />
          <circle cx="12" cy="12" r="3.2" fill="var(--app-bg, #0b0f17)" opacity="0.7" />
        </Glyph>
      );

    // Checklist — Progress.
    case "progress":
      return (
        <Glyph className={className}>
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="m7 9 1.5 1.5L11.5 7.5M7 14l1.5 1.5L11.5 12.5" stroke="var(--app-bg, #0b0f17)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <rect x="13" y="9" width="5" height="1.5" fill="var(--app-bg, #0b0f17)" opacity="0.6" />
          <rect x="13" y="14" width="5" height="1.5" fill="var(--app-bg, #0b0f17)" opacity="0.6" />
        </Glyph>
      );

    // XP table — spell/xp scroll-like grid.
    case "xp-table":
      return (
        <Glyph className={className}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
          <path d="M3.5 9h17M3.5 14h17M9 4.5v15M15 4.5v15" stroke="var(--app-bg, #0b0f17)" strokeWidth="0.8" opacity="0.55" fill="none" />
        </Glyph>
      );

    // Watchlist — eye.
    case "watchlist":
      return (
        <Glyph className={className}>
          <path d="M12 5C7 5 3 9 2 12c1 3 5 7 10 7s9-4 10-7c-1-3-5-7-10-7z" />
          <circle cx="12" cy="12" r="3.2" fill="var(--app-bg, #0b0f17)" opacity="0.75" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" />
        </Glyph>
      );

    // Combat achievements — crossed axe/mace medallion.
    case "combat-tasks":
      return (
        <Glyph className={className}>
          <circle cx="12" cy="10" r="6.5" />
          <path d="M9 7.5 14.5 13M14.5 7.5 9 13" stroke="var(--app-bg, #0b0f17)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="m8 15 2 2-2 3-2-2zM16 15l-2 2 2 3 2-2z" />
        </Glyph>
      );

    // Training plan — scroll with goal.
    case "training-plan":
      return (
        <Glyph className={className}>
          <path d="M6 4h11a3 3 0 0 1 3 3v1h-3V7a1 1 0 0 0-2 0v13H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2z" />
          <path d="M9 10h5v1.5H9zM9 13h5v1.5H9zM9 16h3v1.5H9z" fill="var(--app-bg, #0b0f17)" opacity="0.55" />
        </Glyph>
      );

    // About — info circle.
    case "about":
      return (
        <Glyph className={className}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="7.5" r="1.2" fill="var(--app-bg, #0b0f17)" opacity="0.8" />
          <rect x="11" y="10.5" width="2" height="7" rx="0.3" fill="var(--app-bg, #0b0f17)" opacity="0.8" />
        </Glyph>
      );

    // Flip Journal — ledger with a coin
    case "flip-journal":
      return (
        <Glyph className={className}>
          <rect x="4" y="3" width="12" height="16" rx="1.5" />
          <rect x="16" y="5" width="4" height="14" rx="1" />
          <path d="M7 7h6M7 10h6M7 13h4" stroke="var(--app-bg, #0b0f17)" strokeWidth="1" opacity="0.55" fill="none" />
          <circle cx="18" cy="18" r="3.5" />
          <path d="M18 15.5v5M16.5 17h2.5M16.5 19h2.5" stroke="var(--app-bg, #0b0f17)" strokeWidth="0.8" opacity="0.7" fill="none" />
        </Glyph>
      );

    default:
      return (
        <Glyph className={className}>
          <circle cx="12" cy="12" r="7" />
        </Glyph>
      );
  }
}
