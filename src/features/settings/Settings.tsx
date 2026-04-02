import { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { DEFAULT_KEYBINDS, type KeybindMap } from "../../lib/settings";
import { isTauri, isMac } from "../../lib/env";

declare const __APP_VERSION__: string;

const KEYBIND_LABELS: Record<string, string> = {
  overview: "Profile",
  tracker: "XP Tracker",
  "skill-calc": "Skill Calc",
  "dps-calc": "DPS Calc",
  "dry-calc": "Dry Calc",
  "pet-calc": "Pet Calc",
  bosses: "Boss Guides",
  loot: "Loot",
  market: "Items",
  watchlist: "Watchlist",
  progress: "Progress",
  slayer: "Slayer Blocks",
  "clue-helper": "Clue Helper",
  "money-making": "Money Making",
  stars: "Shooting Stars",
  news: "News",
  wiki: "Wiki",
  timers: "Timers",
  "xp-table": "XP Table",
};

function ThemeGlyph({ theme }: { theme: "dark" | "light" | "system" }) {
  if (theme === "dark") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"
        />
      </svg>
    );
  }

  if (theme === "light") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3.5" y="4.5" width="17" height="11" rx="2.5" />
      <path strokeLinecap="round" d="M8 19.5h8M10 15.5v4M14 15.5v4" />
    </svg>
  );
}

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
      className="text-xs border border-border bg-bg-tertiary/80 text-text-primary px-2 py-1 rounded hover:bg-bg-tertiary transition-colors min-w-[80px]"
    >
      {mod}
      {(value ?? "").toUpperCase()}
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
    <div className="max-w-6xl space-y-4">
      <div className="mb-2">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="section-kicker">Preferences</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary/90">
              Tune RuneWise for your workflow, visuals, and desktop setup with a denser,
              faster control panel.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="px-4 py-3">
              <div className="section-kicker">Theme</div>
              <div className="mt-1 text-sm font-medium text-text-primary capitalize">{settings.theme}</div>
            </div>
            <div className="px-4 py-3">
              <div className="section-kicker">Alerts</div>
              <div className="mt-1 text-sm font-medium text-text-primary">
                {settings.notifications.priceAlerts ? "Enabled" : "Muted"}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="section-kicker">Platform</div>
              <div className="mt-1 text-sm font-medium text-text-primary">
                {isTauri ? "Desktop" : "Browser"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.1fr_0.95fr_0.95fr]">
        <div className="space-y-4">
          <div>
            <h3 className="section-kicker mb-3">Appearance</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-text-primary">Theme</span>
                <p className="mt-1 text-xs text-text-secondary/85">
                  Choose how RuneWise should render across desktop surfaces.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  {
                    key: "dark",
                    label: "Dark",
                  },
                  {
                    key: "light",
                    label: "Light",
                  },
                  {
                    key: "system",
                    label: "System",
                  },
                ] as const).map((option) => {
                  const active = settings.theme === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => update({ theme: option.key })}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-accent/35 bg-accent/11 text-text-primary"
                          : "border-border bg-bg-tertiary/45 text-text-secondary hover:border-border hover:bg-bg-tertiary/65 hover:text-text-primary"
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                          active
                            ? "border-accent/30 bg-accent/12 text-accent"
                            : "border-border/80 bg-bg-primary/55 text-text-secondary"
                        }`}
                      >
                        <ThemeGlyph theme={option.key} />
                      </span>
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs leading-5 text-text-secondary/80">
                {settings.theme === "dark" && "Dark is best for long sessions and denser data panels."}
                {settings.theme === "light" && "Light gives higher contrast for wiki reading and workspace scans."}
                {settings.theme === "system" && "System matches your desktop appearance automatically."}
              </p>
            </div>
          </div>

          <div>
            <h3 className="section-kicker mb-3">Notifications</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-text-primary">Price alerts</span>
                <p className="mt-1 text-xs text-text-secondary/70">
                  Notify when watchlist items hit your target prices.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.notifications.priceAlerts}
                aria-label="Price alerts"
                onClick={() =>
                  update({
                    notifications: {
                      ...settings.notifications,
                      priceAlerts: !settings.notifications.priceAlerts,
                    },
                  })
                }
                className={`relative h-5 w-10 rounded-full transition-colors ${
                  settings.notifications.priceAlerts ? "bg-accent" : "bg-bg-tertiary"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.notifications.priceAlerts ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="section-kicker mb-3">Game Mode</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-text-primary">Ironman Mode</span>
                <p className="mt-1 text-xs text-text-secondary/70">
                  Filter training methods and calculators to ironman-viable options only.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.ironmanMode}
                aria-label="Ironman mode"
                onClick={() => update({ ironmanMode: !settings.ironmanMode })}
                className={`relative h-5 w-10 rounded-full transition-colors ${
                  settings.ironmanMode ? "bg-accent" : "bg-bg-tertiary"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.ironmanMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-kicker">Keyboard Shortcuts</h3>
            <button
              onClick={resetKeybinds}
              className="text-[10px] text-text-secondary/70 hover:text-text-primary transition-colors"
            >
              Reset all
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(KEYBIND_LABELS).map(([action, label]) => (
              <div key={action} className="panel-muted rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                <span className="text-sm text-text-primary/90">{label}</span>
                <KeybindRecorder
                  value={settings.keybinds[action] ?? DEFAULT_KEYBINDS[action]}
                  onChange={(key) => handleKeybindChange(action, key)}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-text-secondary/65">
            {isMac ? "⌘" : "Ctrl+"}K to open global search is always available
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="section-kicker mb-3">System</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-text-primary">Updates</span>
                  <p className="mt-1 text-xs text-text-secondary/70">
                    {isTauri ? `Desktop build v${__APP_VERSION__}` : "Update checks are desktop only."}
                  </p>
                </div>
                {isTauri ? <UpdateButton /> : <span className="text-xs text-text-secondary/70">Browser</span>}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-text-primary">Reset settings</span>
                  <p className="mt-1 text-xs text-text-secondary/70">
                    Clear saved preferences, theme choices, and custom shortcuts.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Reset all settings to defaults?")) resetAll();
                  }}
                  className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs text-danger transition-colors hover:text-danger/80"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="section-kicker mb-3">Attribution</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 py-1">
                <a
                  href="https://oldschool.runescape.wiki/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  OSRS Wiki
                </a>
                <span className="text-text-secondary/70">CC BY-NC-SA 3.0</span>
              </div>
              <div className="flex justify-between gap-3 py-1">
                <a
                  href="https://wiseoldman.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  Wise Old Man
                </a>
                <span className="text-text-secondary/70">MIT</span>
              </div>
              <div className="flex justify-between gap-3 py-1">
                <a
                  href="https://secure.runescape.com/m=hiscore_oldschool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  OSRS Hiscores
                </a>
                <span className="text-text-secondary/70">Jagex</span>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href="https://github.com/McNerve/runewise"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent transition hover:text-accent-hover"
              >
                GitHub Repository
              </a>
              <a
                href="https://github.com/McNerve/runewise/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent transition hover:text-accent-hover"
              >
                Report a Bug
              </a>
            </div>
            <p className="mt-3 text-[10px] text-text-secondary/65">
              RuneWise is not affiliated with or endorsed by Jagex Ltd. Old School
              RuneScape is a trademark of Jagex Ltd.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
