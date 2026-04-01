import { useMemo } from "react";
import type { View } from "../lib/NavigationContext";
import { isMac } from "../lib/env";
import { NAV_ICONS } from "../lib/sprites";
import { useSettings } from "../hooks/useSettings";

declare const __APP_VERSION__: string;

const mod = isMac ? "⌘" : "Ctrl+";

interface NavItem {
  id: View;
  label: string;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Player",
    items: [
      { id: "overview", label: "Overview" },
      { id: "tracker", label: "XP Tracker" },
    ],
  },
  {
    label: "Calculators",
    items: [
      { id: "skill-calc", label: "Skill Calcs" },
      { id: "combat-calc", label: "Combat" },
      { id: "dry-calc", label: "Dry Calc" },
      { id: "dps-calc", label: "DPS Calc" },
      { id: "pet-calc", label: "Pet Chance" },
    ],
  },
  {
    label: "Market",
    items: [
      { id: "market", label: "Market" },
      { id: "alch-calc", label: "Alch Profits" },
      { id: "watchlist", label: "Watchlist" },
    ],
  },
  {
    label: "Combat",
    items: [
      { id: "bosses", label: "Boss Guides" },
      { id: "drops", label: "Drop Tables" },
      { id: "boss-loot", label: "Loot Calculator" },
      { id: "combat-tasks", label: "Combat Tasks" },
    ],
  },
  {
    label: "Guides",
    items: [
      { id: "quests", label: "Quests" },
      { id: "diaries", label: "Diaries" },
      { id: "slayer", label: "Slayer" },
      { id: "clue-helper", label: "Clue Helper" },
      { id: "money-making", label: "Money Making" },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "xp-table", label: "XP Table" },
      { id: "timers", label: "Timers" },
      { id: "runelite", label: "RuneLite" },
      { id: "stars", label: "Stars" },
    ],
  },
  {
    label: null,
    items: [
      { id: "news", label: "News" },
    ],
  },
];

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { settings, update } = useSettings();
  const collapsed = settings.sidebar.collapsed;

  const toggleCollapse = () => {
    update({ sidebar: { collapsed: !collapsed } });
  };

  // Build reverse map: view -> display key string
  const viewKeys = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [view, key] of Object.entries(settings.keybinds)) {
      map[view] = `${mod}${key.toUpperCase()}`;
    }
    return map;
  }, [settings.keybinds]);

  return (
    <aside className={`${collapsed ? "w-14" : "w-56"} bg-bg-secondary border-r border-border flex flex-col transition-all duration-200`}>
      <div className={`${collapsed ? "px-2 py-3" : "p-4"} border-b border-border flex items-center`}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight">RuneWise</h1>
            <p className="text-xs text-text-secondary mt-0.5">OSRS Companion</p>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="text-text-secondary/60 hover:text-text-secondary transition-colors shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            )}
          </svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && !collapsed && (
              <div className="text-[9px] uppercase tracking-widest text-text-secondary/60 px-3 pt-3 pb-1 select-none">
                {section.label}
              </div>
            )}
            {section.label && collapsed && si > 0 && (
              <div className="border-t border-border/30 my-1 mx-1" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full text-left ${collapsed ? "px-2 py-1.5 justify-center" : "px-3 py-1.5"} rounded-md text-sm flex items-center gap-2 transition-colors ${
                    currentView === item.id
                      ? "bg-accent/15 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  }`}
                >
                  <img
                    src={NAV_ICONS[item.id]}
                    alt=""
                    className="w-4 h-4 shrink-0"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      if (el.nextElementSibling) el.nextElementSibling.classList.remove("hidden");
                    }}
                  />
                  <span className="hidden w-4 h-4 rounded bg-bg-tertiary text-[9px] font-bold flex items-center justify-center text-text-secondary">
                    {item.label[0]}
                  </span>
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && viewKeys[item.id] && (
                    <span className="text-[10px] text-text-secondary/30">{viewKeys[item.id]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className={`${collapsed ? "p-1" : "p-3"} border-t border-border space-y-1`}>
        <button
          onClick={() => onNavigate("settings")}
          title={collapsed ? "Settings" : undefined}
          className={`w-full text-left ${collapsed ? "px-2 py-1.5 justify-center" : "px-3 py-1.5"} rounded-md text-sm flex items-center gap-2 transition-colors ${
            currentView === "settings"
              ? "bg-accent/15 text-accent"
              : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {!collapsed && <span className="flex-1">Settings</span>}
        </button>
        {!collapsed && (
          <div className="text-[10px] text-text-secondary/60 text-center py-0.5">
            v{__APP_VERSION__}
          </div>
        )}
      </div>
    </aside>
  );
}
