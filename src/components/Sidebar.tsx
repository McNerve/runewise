import { useState } from "react";
import type { View } from "../App";

declare const __APP_VERSION__: string;
const isTauri = "__TAURI__" in window;

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
        setStatus("ready");
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

const NAV_ITEMS: { id: View; label: string; icon: string; key: string }[] = [
  { id: "overview", label: "Overview", icon: "👤", key: "⌘1" },
  { id: "skill-calc", label: "Skill Calcs", icon: "📊", key: "⌘2" },
  { id: "combat-calc", label: "Combat", icon: "⚔️", key: "⌘3" },
  { id: "dry-calc", label: "Dry Calc", icon: "🎲", key: "⌘4" },
  { id: "ge", label: "Grand Exchange", icon: "💰", key: "⌘5" },
  { id: "item-db", label: "Item Database", icon: "🗄️", key: "⌘6" },
  { id: "xp-table", label: "XP Table", icon: "📋", key: "⌘7" },
  { id: "drops", label: "Drop Tables", icon: "💀", key: "⌘8" },
  { id: "tracker", label: "XP Tracker", icon: "📈", key: "⌘9" },
  { id: "bosses", label: "Boss Guides", icon: "🐉", key: "" },
  { id: "quests", label: "Quests", icon: "📜", key: "" },
  { id: "diaries", label: "Diaries", icon: "🏆", key: "" },
  { id: "slayer", label: "Slayer", icon: "🗡️", key: "" },
  { id: "news", label: "News", icon: "📰", key: "" },
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
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
              currentView === item.id
                ? "bg-accent/15 text-accent"
                : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            }`}
          >
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <span className="text-[10px] text-text-secondary/30">{item.key}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-2">
        {isTauri && <UpdateButton />}
        <p className="text-[10px] text-text-secondary/50 text-center">v{__APP_VERSION__}</p>
      </div>
    </aside>
  );
}
