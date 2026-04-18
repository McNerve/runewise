import { useState, useEffect } from "react";
import { useSettings } from "../../hooks/useSettings";
import { DEFAULT_KEYBINDS, type KeybindMap } from "../../lib/settings";
import { isTauri, isMac } from "../../lib/env";

declare const __APP_VERSION__: string;

// Labels for every possible keybind action. Only entries present in
// DEFAULT_KEYBINDS are actually rendered — the default set is intentionally
// curated to avoid stomping on system shortcuts.
const KEYBIND_LABELS_ALL: Record<string, { label: string; family: string }> = {
  overview: { label: "Profile", family: "Player" },
  tracker: { label: "XP Tracker", family: "Player" },
  "collection-log": { label: "Collection Log", family: "Player" },
  "skill-calc": { label: "Skill Calc", family: "Tools" },
  "dps-calc": { label: "DPS Calc", family: "Tools" },
  "dry-calc": { label: "Dry Calc", family: "Tools" },
  "pet-calc": { label: "Pet Calc", family: "Tools" },
  "gear-compare": { label: "Gear Compare", family: "Tools" },
  "money-making": { label: "Money Making", family: "Tools" },
  timers: { label: "Farm Timers", family: "Tools" },
  "xp-table": { label: "XP Table", family: "Tools" },
  "training-plan": { label: "Training Plan", family: "Tools" },
  "production-calc": { label: "Recipe Calc", family: "Tools" },
  bosses: { label: "Boss Guides", family: "Bossing" },
  raids: { label: "Raid Guides", family: "Bossing" },
  market: { label: "Items", family: "Market" },
  loot: { label: "Loot & Drops", family: "Market" },
  spells: { label: "Spells", family: "Market" },
  progress: { label: "Progress", family: "Guides" },
  slayer: { label: "Slayer Helper", family: "Guides" },
  "clue-helper": { label: "Clue Helper", family: "Guides" },
  stars: { label: "Star Helper", family: "Guides" },
  "world-map": { label: "World Map", family: "Live" },
  news: { label: "OSRS News", family: "Live" },
  wiki: { label: "OSRS Wiki", family: "Live" },
};

const KEYBIND_LABELS: Record<string, { label: string; family: string }> =
  Object.fromEntries(
    Object.entries(KEYBIND_LABELS_ALL).filter(([action]) => action in DEFAULT_KEYBINDS)
  );

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
    "idle" | "checking" | "downloading" | "available" | "current" | "error"
  >("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [autoChecked, setAutoChecked] = useState(false);

  const checkForUpdates = async (silent = false) => {
    if (!silent) setStatus("checking");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        setUpdateVersion(update.version ?? null);
        setStatus("available");
      } else {
        setStatus("current");
        if (!silent) setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      if (!silent) {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    }
  };

  const installUpdate = async () => {
    setStatus("downloading");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // Auto-check on mount (silent)
  useEffect(() => {
    if (autoChecked) return;
    setAutoChecked(true);
    const timer = setTimeout(() => checkForUpdates(true), 2000);
    return () => clearTimeout(timer);
  }, [autoChecked]);

  if (status === "available") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-text-primary">
            v{updateVersion ?? "new"} available
          </span>
        </div>
        <button
          onClick={installUpdate}
          className="bg-success hover:bg-success/80 text-white text-xs px-3 py-1.5 rounded font-medium transition-colors"
        >
          Update Now
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => checkForUpdates(false)}
        disabled={status === "checking" || status === "downloading"}
        className="bg-accent hover:bg-accent-hover text-on-accent text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50"
      >
        {status === "idle" && "Check for Updates"}
        {status === "checking" && "Checking..."}
        {status === "downloading" && "Installing..."}
        {status === "current" && "Up to date ✓"}
        {status === "error" && "Check failed"}
      </button>
      {status === "downloading" && (
        <div className="w-20 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      )}
    </div>
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
      className="text-xs border border-border bg-bg-tertiary/80 text-text-primary px-2 py-1 rounded hover:bg-bg-secondary transition-colors min-w-[80px]"
    >
      {mod}
      {(value ?? "").toUpperCase()}
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-5 w-10 rounded-full transition-colors shrink-0 ${
        checked ? "bg-accent" : "bg-bg-tertiary"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-tertiary rounded-lg p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Settings() {
  const { settings, update, resetAll } = useSettings();

  const handleKeybindChange = (action: string, key: string) => {
    const keybinds: KeybindMap = { ...settings.keybinds, [action]: key };
    update({ keybinds });
  };

  const resetKeybinds = () => {
    // Fully replace — don't merge with old saved keys
    const fresh: Record<string, string> = {};
    for (const action of Object.keys(KEYBIND_LABELS)) {
      fresh[action] = DEFAULT_KEYBINDS[action] ?? "";
    }
    update({ keybinds: fresh });
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-text-secondary/80">
          Configure your RuneWise experience.
        </p>
      </div>

      {/* Appearance */}
      <SettingsCard title="Appearance">
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-text-primary">Theme</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {([
                { key: "dark", label: "Dark" },
                { key: "light", label: "Light" },
                { key: "system", label: "System" },
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
                        : "border-border bg-bg-tertiary/45 text-text-secondary hover:bg-bg-tertiary/65 hover:text-text-primary"
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
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-text-primary">Ironman Mode</span>
              <p className="mt-0.5 text-xs text-text-secondary/70">
                Filter training methods and calculators to ironman-viable options only.
              </p>
            </div>
            <ToggleSwitch
              checked={settings.ironmanMode}
              onChange={() => update({ ironmanMode: !settings.ironmanMode })}
              label="Ironman mode"
            />
          </div>
        </div>
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard title="Notifications">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-text-primary">Price alerts</span>
            <p className="mt-0.5 text-xs text-text-secondary/70">
              Notify when watchlist items hit your target prices.
            </p>
          </div>
          <ToggleSwitch
            checked={settings.notifications.priceAlerts}
            onChange={() =>
              update({
                notifications: {
                  ...settings.notifications,
                  priceAlerts: !settings.notifications.priceAlerts,
                },
              })
            }
            label="Price alerts"
          />
        </div>
      </SettingsCard>

      {/* Keyboard Shortcuts */}
      <SettingsCard title="Keyboard Shortcuts">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
          <div>
            <div className="text-sm font-medium">Enable Shortcuts</div>
            <div className="text-xs text-text-secondary">Ctrl/Cmd + key to navigate between views</div>
          </div>
          <button
            onClick={() => update({ keybindsEnabled: !settings.keybindsEnabled })}
            className={`w-10 h-5 rounded-full transition-colors ${settings.keybindsEnabled ? "bg-accent" : "bg-bg-tertiary"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.keybindsEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {(() => {
          const families = new Map<string, [string, { label: string; family: string }][]>();
          for (const [action, info] of Object.entries(KEYBIND_LABELS)) {
            const list = families.get(info.family) ?? [];
            list.push([action, info]);
            families.set(info.family, list);
          }
          const usedKeys = new Map<string, string>();
          for (const [action] of Object.entries(KEYBIND_LABELS)) {
            const key = (settings.keybinds[action] ?? DEFAULT_KEYBINDS[action] ?? "").toLowerCase();
            if (key && usedKeys.has(key)) {
              // conflict detected
            }
            if (key) usedKeys.set(key, action);
          }
          return Array.from(families.entries()).map(([family, entries]) => (
            <div key={family} className="mb-4 last:mb-0">
              <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/50 mb-2">{family}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {entries.map(([action, info]) => {
                  const key = (settings.keybinds[action] ?? DEFAULT_KEYBINDS[action] ?? "").toLowerCase();
                  const conflict = key.length > 0 && Array.from(Object.entries(KEYBIND_LABELS)).some(
                    ([a]) => a !== action && (settings.keybinds[a] ?? DEFAULT_KEYBINDS[a] ?? "").toLowerCase() === key
                  );
                  return (
                    <div key={action} className="flex items-center justify-between gap-3 py-1">
                      <span className="text-sm text-text-primary/90">{info.label}</span>
                      <div className="flex items-center gap-1">
                        {conflict && <span className="text-[9px] text-warning" title="Duplicate keybind">⚠</span>}
                        <KeybindRecorder
                          value={settings.keybinds[action] ?? DEFAULT_KEYBINDS[action]}
                          onChange={(key) => handleKeybindChange(action, key)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
          <p className="text-[10px] text-text-secondary/65">
            {isMac ? "⌘" : "Ctrl+"}K to open global search is always available
          </p>
          <button
            onClick={resetKeybinds}
            className="rounded-lg border border-border bg-bg-tertiary px-3 py-1 text-xs text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </SettingsCard>

      {/* App */}
      {isTauri && (
        <SettingsCard title="App">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-text-primary">Close to tray</span>
                <p className="mt-0.5 text-xs text-text-secondary/70">
                  Clicking the close button hides RuneWise to the system tray instead of quitting.
                </p>
              </div>
              <ToggleSwitch
                checked={settings.closeToTray}
                onChange={() => update({ closeToTray: !settings.closeToTray })}
                label="Close to tray"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/30">
              <div>
                <span className="text-sm font-medium text-text-primary">Discord Rich Presence</span>
                <p className="mt-0.5 text-xs text-text-secondary/70">
                  Show what you&apos;re doing in RuneWise on your Discord profile. Off by default.
                </p>
              </div>
              <ToggleSwitch
                checked={settings.discordRpc}
                onChange={() => update({ discordRpc: !settings.discordRpc })}
                label="Discord Rich Presence"
              />
            </div>
          </div>
        </SettingsCard>
      )}

      {/* System */}
      <SettingsCard title="System">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-text-primary">Updates</span>
              <p className="mt-0.5 text-xs text-text-secondary/70">
                {isTauri ? `Desktop build v${__APP_VERSION__}` : "Update checks are desktop only."}
              </p>
            </div>
            {isTauri ? <UpdateButton /> : <span className="text-xs text-text-secondary/70">Browser</span>}
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/30">
            <div>
              <span className="text-sm font-medium text-text-primary">Clear data cache</span>
              <p className="mt-0.5 text-xs text-text-secondary/70">
                Remove cached API responses. Useful if data appears stale.
              </p>
            </div>
            <button
              onClick={() => {
                const keys = Object.keys(localStorage).filter(k => k.startsWith("runewise_cache:"));
                keys.forEach(k => localStorage.removeItem(k));
                alert(`Cleared ${keys.length} cached entries. Reload the page to fetch fresh data.`);
                window.location.reload();
              }}
              className="rounded-lg bg-bg-tertiary px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              Clear Cache
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/30">
            <div>
              <span className="text-sm font-medium text-text-primary">Reset settings</span>
              <p className="mt-0.5 text-xs text-text-secondary/70">
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
      </SettingsCard>

      {/* Data Sync */}
      <SettingsCard title="Data Sync">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary leading-relaxed">
            RuneWise pulls live data from <strong>Wise Old Man</strong>, <strong>Temple OSRS</strong>,
            and the <strong>OSRS Hiscores</strong>. Set your RSN in the top bar to see your stats,
            boss kills, and collection log.
          </p>
          <div className="space-y-2 pt-2 border-t border-border/30">
            <div className="flex items-start gap-3">
              <span className="text-accent text-sm mt-0.5">1.</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong className="text-text-primary">Collection Log</strong> — Install the <em>Temple OSRS</em> RuneLite
                plugin and sync your account at{" "}
                <a href="https://templeosrs.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
                  templeosrs.com
                </a>. Your collection log data will appear automatically.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent text-sm mt-0.5">2.</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong className="text-text-primary">XP Tracking</strong> — Update your profile on{" "}
                <a href="https://wiseoldman.net" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
                  wiseoldman.net
                </a>{" "}
                for gains, records, and achievements.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent text-sm mt-0.5">3.</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong className="text-text-primary">Quests &amp; Combat Tasks</strong> — Mark these manually in
                RuneWise. No public API tracks individual quest or combat achievement completion.
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Attribution */}
      <SettingsCard title="Attribution">
        <div className="space-y-1">
          {[
            { label: "OSRS Wiki", href: "https://oldschool.runescape.wiki/", license: "CC BY-NC-SA 3.0" },
            { label: "Wise Old Man", href: "https://wiseoldman.net/", license: "MIT" },
            { label: "Temple OSRS", href: "https://templeosrs.com/", license: "Temple OSRS" },
            { label: "Star Miners", href: "https://starminers.site/", license: "Star Miners" },
            { label: "OSRS Hiscores", href: "https://secure.runescape.com/m=hiscore_oldschool/", license: "Jagex" },
          ].map(({ label, href, license }) => (
            <div key={label} className="flex justify-between gap-3 py-1">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:text-accent-hover"
              >
                {label}
              </a>
              <span className="text-xs text-text-secondary/70">{license}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/30 flex gap-4">
          <a
            href="https://github.com/McNerve/runewise"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-accent-hover"
          >
            GitHub Repository
          </a>
          <a
            href="https://github.com/McNerve/runewise/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-accent-hover"
          >
            Report a Bug
          </a>
        </div>
        <p className="mt-3 text-[10px] text-text-secondary/65">
          RuneWise is not affiliated with or endorsed by Jagex Ltd. Old School
          RuneScape is a trademark of Jagex Ltd.
        </p>
      </SettingsCard>
    </div>
  );
}
