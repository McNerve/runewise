import { useState } from "react";
import type { View } from "../lib/NavigationContext";
import { isTauri } from "../lib/env";
import { NAV_ICONS } from "../lib/sprites";

declare const __APP_VERSION__: string;

function UpdateButton() {
  const [status, setStatus] = useState<"idle" | "checking" | "downloading" | "ready" | "current" | "error">("idle");

  const checkForUpdates = async () => {
    setStatus("checking");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        setStatus("downloading");
        await update.downloadAndInstall();
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      } else {
        setStatus("current");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <button
      onClick={checkForUpdates}
      disabled={status === "checking" || status === "downloading" || status === "ready"}
      className="w-full text-xs px-3 py-1.5 rounded text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
    >
      {status === "idle" && "Check for Updates"}
      {status === "checking" && "Checking..."}
      {status === "downloading" && "Downloading..."}
      {status === "ready" && "Restart to update"}
      {status === "current" && "Up to date"}
      {status === "error" && "Update failed"}
    </button>
  );
}

const isMac = navigator.platform.toUpperCase().includes("MAC");
const mod = isMac ? "⌘" : "Ctrl+";

interface NavItem {
  id: View;
  label: string;
  key: string;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Player",
    items: [
      { id: "overview", label: "Overview", key: `${mod}1` },
      { id: "tracker", label: "XP Tracker", key: `${mod}2` },
    ],
  },
  {
    label: "Calculators",
    items: [
      { id: "skill-calc", label: "Skill Calcs", key: `${mod}3` },
      { id: "combat-calc", label: "Combat", key: "" },
      { id: "dry-calc", label: "Dry Calc", key: "" },
      { id: "dps-calc", label: "DPS Calc", key: "" },
      { id: "pet-calc", label: "Pet Chance", key: "" },
    ],
  },
  {
    label: "Market",
    items: [
      { id: "ge", label: "Grand Exchange", key: `${mod}4` },
      { id: "price-charts", label: "Price Charts", key: "" },
      { id: "item-db", label: "Item Database", key: `${mod}5` },
      { id: "alch-calc", label: "Alch Profits", key: "" },
      { id: "watchlist", label: "Watchlist", key: "" },
    ],
  },
  {
    label: "Combat",
    items: [
      { id: "bosses", label: "Boss Guides", key: "" },
      { id: "boss-loot", label: "Boss Loot", key: "" },
      { id: "drops", label: "Drop Tables", key: `${mod}6` },
      { id: "combat-tasks", label: "Combat Tasks", key: "" },
    ],
  },
  {
    label: "Guides",
    items: [
      { id: "quests", label: "Quests", key: "" },
      { id: "diaries", label: "Diaries", key: "" },
      { id: "slayer", label: "Slayer", key: "" },
      { id: "clue-helper", label: "Clue Helper", key: "" },
      { id: "money-making", label: "Money Making", key: "" },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "xp-table", label: "XP Table", key: "" },
      { id: "timers", label: "Timers", key: "" },
      { id: "runelite", label: "RuneLite", key: "" },
      { id: "stars", label: "Stars", key: "" },
    ],
  },
  {
    label: null,
    items: [
      { id: "news", label: "News", key: "" },
    ],
  },
];

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-bg-secondary border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">RuneWise</h1>
        <p className="text-xs text-text-secondary mt-0.5">OSRS Companion</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="text-[9px] uppercase tracking-widest text-text-secondary/40 px-3 pt-3 pb-1 select-none">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    currentView === item.id
                      ? "bg-accent/15 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  }`}
                >
                  <img
                    src={NAV_ICONS[item.id]}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      if (el.nextElementSibling) el.nextElementSibling.classList.remove("hidden");
                    }}
                  />
                  <span className="hidden w-4 h-4 rounded bg-bg-tertiary text-[9px] font-bold flex items-center justify-center text-text-secondary">
                    {item.label[0]}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.key && (
                    <span className="text-[10px] text-text-secondary/30">{item.key}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-2">
        {isTauri && <UpdateButton />}
        <button
          onClick={() => onNavigate("about")}
          className={`w-full text-[10px] px-3 py-1 rounded transition-colors ${
            currentView === "about"
              ? "text-accent"
              : "text-text-secondary/50 hover:text-text-secondary"
          }`}
        >
          v{__APP_VERSION__} — About
        </button>
      </div>
    </aside>
  );
}
