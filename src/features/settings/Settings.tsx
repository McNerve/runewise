import { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { DEFAULT_KEYBINDS, type KeybindMap } from "../../lib/settings";
import { isTauri, isMac } from "../../lib/env";

declare const __APP_VERSION__: string;

const KEYBIND_LABELS: Record<string, string> = {
  overview: "Overview",
  "skill-calc": "Skill Calculators",
  "combat-calc": "Combat Calculator",
  "dry-calc": "Dry Calculator",
  market: "Market",
  "xp-table": "XP Table",
  drops: "Drop Tables",
  tracker: "XP Tracker",
  news: "News",
};

function UpdateButton() {
  const [status, setStatus] = useState<
    "idle" | "checking" | "downloading" | "ready" | "current" | "error"
  >("idle");

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
      disabled={status === "checking" || status === "downloading"}
      className="bg-accent hover:bg-accent-hover text-white text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50"
    >
      {status === "idle" && "Check for Updates"}
      {status === "checking" && "Checking..."}
      {status === "downloading" && "Downloading..."}
      {status === "ready" && "Restart to update"}
      {status === "current" && "Up to date!"}
      {status === "error" && "Update failed"}
    </button>
  );
}

function KeybindRecorder({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const mod = isMac ? "⌘" : "Ctrl+";

  return recording ? (
    <button
      className="text-xs bg-accent/20 text-accent px-2 py-1 rounded border border-accent/40 animate-pulse"
      autoFocus
      onKeyDown={(e) => {
        e.preventDefault();
        if (e.key === "Escape") {
          setRecording(false);
          return;
        }
        if (e.key.length === 1) {
          onChange(e.key);
          setRecording(false);
        }
      }}
      onBlur={() => setRecording(false)}
    >
      Press a key...
    </button>
  ) : (
    <button
      onClick={() => setRecording(true)}
      className="text-xs bg-bg-tertiary text-text-secondary px-2 py-1 rounded hover:bg-bg-tertiary/80 transition-colors min-w-[80px]"
    >
      {mod}
      {value.toUpperCase()}
    </button>
  );
}

export default function Settings() {
  const { settings, update, resetAll } = useSettings();

  const handleKeybindChange = (action: string, key: string) => {
    const keybinds: KeybindMap = { ...settings.keybinds, [action]: key };
    update({ keybinds });
  };

  const resetKeybinds = () => {
    update({ keybinds: { ...DEFAULT_KEYBINDS } });
  };

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>

      {/* Appearance */}
      <div className="bg-bg-secondary rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Theme</span>
          <div className="flex gap-1">
            {(["dark", "light", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => update({ theme: t })}
                className={`text-xs px-3 py-1.5 rounded transition-colors capitalize ${
                  settings.theme === t
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-bg-secondary rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary/60">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={resetKeybinds}
            className="text-[10px] text-text-secondary/50 hover:text-text-secondary transition-colors"
          >
            Reset to defaults
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(KEYBIND_LABELS).map(([action, label]) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{label}</span>
              <KeybindRecorder
                value={settings.keybinds[action] ?? DEFAULT_KEYBINDS[action]}
                onChange={(key) => handleKeybindChange(action, key)}
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-text-secondary/40 mt-3">
          {isMac ? "⌘" : "Ctrl+"}K to open global search is always available
        </p>
      </div>

      {/* Notifications */}
      <div className="bg-bg-secondary rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
          Notifications
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-text-secondary">Price alerts</span>
            <p className="text-[10px] text-text-secondary/50 mt-0.5">
              Get notified when watchlist items hit your price targets
            </p>
          </div>
          <button
            onClick={() =>
              update({
                notifications: {
                  ...settings.notifications,
                  priceAlerts: !settings.notifications.priceAlerts,
                },
              })
            }
            className={`relative w-10 h-5 rounded-full transition-colors ${
              settings.notifications.priceAlerts ? "bg-accent" : "bg-bg-tertiary"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.notifications.priceAlerts ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Updates */}
      <div className="bg-bg-secondary rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
          Updates
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            Current version: <span className="text-text-primary font-medium">v{__APP_VERSION__}</span>
          </span>
          {isTauri ? <UpdateButton /> : (
            <span className="text-xs text-text-secondary/50">Desktop only</span>
          )}
        </div>
      </div>

      {/* Data & Storage */}
      <div className="bg-bg-secondary rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
          Data & Storage
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Reset all settings</span>
            <button
              onClick={() => {
                if (confirm("Reset all settings to defaults?")) resetAll();
              }}
              className="text-xs text-danger hover:text-danger/80 px-3 py-1.5 rounded bg-danger/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-bg-secondary rounded-lg p-4">
        <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
          About
        </h3>
        <p className="text-sm text-text-secondary mb-3">
          RuneWise v{__APP_VERSION__} — OSRS Desktop Companion
        </p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <a
              href="https://oldschool.runescape.wiki/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover"
            >
              OSRS Wiki
            </a>
            <span className="text-text-secondary/50">CC BY-NC-SA 3.0</span>
          </div>
          <div className="flex justify-between">
            <a
              href="https://wiseoldman.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover"
            >
              Wise Old Man
            </a>
            <span className="text-text-secondary/50">MIT</span>
          </div>
          <div className="flex justify-between">
            <a
              href="https://secure.runescape.com/m=hiscore_oldschool/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover"
            >
              OSRS Hiscores
            </a>
            <span className="text-text-secondary/50">Jagex</span>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <a
            href="https://github.com/McNerve/runewise"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-accent hover:text-accent-hover"
          >
            GitHub Repository
          </a>
          <a
            href="https://github.com/McNerve/runewise/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-accent hover:text-accent-hover"
          >
            Report a Bug
          </a>
        </div>
        <p className="text-[10px] text-text-secondary/40 mt-3">
          RuneWise is not affiliated with or endorsed by Jagex Ltd. Old School
          RuneScape is a trademark of Jagex Ltd.
        </p>
      </div>
    </div>
  );
}
