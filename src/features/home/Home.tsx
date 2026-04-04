import { useState } from "react";
import { motion } from "motion/react";
import type { HiscoreData } from "../../lib/api/hiscores";
import { NAV_ICONS } from "../../lib/sprites";
import { getFeatureAccent } from "../../lib/featureAccent";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import ShellIcon from "../../components/ShellIcon";
import { useWatchlist } from "../../hooks/useWatchlist";
import { useSettings } from "../../hooks/useSettings";
import { loadRecentEntities } from "../../lib/recentEntities";
import { formatGp } from "../../lib/format";

interface HomeProps {
  hiscores?: {
    rsn: string;
    data: HiscoreData | null;
  };
}

const TOOL_GRID = [
  { id: "skill-calc", label: "Skill Calc" },
  { id: "dps-calc", label: "DPS Calc" },
  { id: "bosses", label: "Boss Guides" },
  { id: "market", label: "Market" },
  { id: "loot", label: "Loot & Drops" },
  { id: "slayer", label: "Slayer" },
  { id: "shop-helper", label: "Shop Helper" },
  { id: "wiki", label: "Wiki" },
  { id: "progress", label: "Progress" },
  { id: "stars", label: "Stars" },
  { id: "news", label: "News" },
  { id: "clue-helper", label: "Clues" },
] as const;

function getCombatLevel(data: HiscoreData): number {
  const get = (name: string) => data.skills.find((s) => s.name === name)?.level ?? 1;
  const att = get("Attack");
  const str = get("Strength");
  const def = get("Defence");
  const hp = get("Hitpoints");
  const pray = get("Prayer");
  const ran = get("Ranged");
  const mag = get("Magic");
  const base = 0.25 * (def + hp + Math.floor(pray / 2));
  const melee = 0.325 * (att + str);
  const range = 0.325 * (Math.floor(ran / 2) + ran);
  const magic = 0.325 * (Math.floor(mag / 2) + mag);
  return Math.floor(base + Math.max(melee, range, magic));
}

export default function Home({ hiscores }: HomeProps) {
  const { items: watchlistItems, prices } = useWatchlist();
  const { settings } = useSettings();
  const { navigate } = useNavigation();
  const [recentEntities] = useState(() => loadRecentEntities().slice(0, 4));
  const savedRsn = hiscores?.rsn ?? "";
  const data = hiscores?.data ?? null;

  const totalLevel = data?.skills
    .filter((s) => s.name !== "Overall")
    .reduce((sum, s) => sum + s.level, 0) ?? null;
  const totalXp = data?.skills.find((s) => s.name === "Overall")?.xp ?? null;
  const combatLevel = data ? getCombatLevel(data) : null;
  const totalBossKills = data?.activities
    ?.filter((a) => a.score > 0 && a.id >= 20)
    .reduce((sum, a) => sum + a.score, 0) ?? null;
  const maxedSkills = data?.skills.filter((s) => s.name !== "Overall" && s.level >= 99).length ?? null;
  const questPoints = data?.activities.find((a) => a.name === "Quest Points" || a.name === "Overall Quest Points")?.score ?? null;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {savedRsn ? `Welcome back, ${savedRsn}` : "RuneWise"}
          </h2>
          <p className="text-sm text-text-secondary">
            {savedRsn
              ? "Your dashboard, tools, and recent activity."
              : "Your OSRS companion. Set a RSN to get started."}
          </p>
        </div>
        {!savedRsn && (
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('.topbar-shell input[type="text"]');
              if (input) { input.focus(); input.select(); }
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Set Your RSN
          </button>
        )}
        {settings.ironmanMode && (
          <span className="text-[10px] text-warning border border-warning/20 bg-warning/5 rounded-full px-2.5 py-0.5">
            Ironman Mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left column */}
        <div className="space-y-5">

          {/* First-run welcome */}
          {!savedRsn && !localStorage.getItem("runewise_welcome_dismissed") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-accent/30 bg-accent/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-accent">Welcome to RuneWise</h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Enter your RSN in the top bar to unlock personalized stats, XP tracking, and boss KC.
                    All tools work without an RSN too — just start exploring.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>('.topbar-shell input[type="text"]');
                        if (input) { input.focus(); input.select(); }
                      }}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                    >
                      Set Your RSN
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        localStorage.setItem("runewise_welcome_dismissed", "1");
                        (e.currentTarget.closest("[class*=rounded-xl]") as HTMLElement)?.remove();
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Player card */}
          {savedRsn && data && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-border/40 bg-bg-primary/20 p-4"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-lg font-bold text-accent">
                  {savedRsn[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold">{savedRsn}</div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span>Combat {combatLevel}</span>
                    {questPoints != null && questPoints > 0 && <span>{questPoints} QP</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("overview")}
                  className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:border-accent/45 transition-colors"
                >
                  Full Profile
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/40 bg-bg-tertiary/20 px-3 py-2 text-center">
                  <div className="text-lg font-bold tabular-nums text-success">{totalLevel?.toLocaleString()}</div>
                  <div className="text-[10px] text-text-secondary/50">Total</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-bg-tertiary/20 px-3 py-2 text-center">
                  <div className="text-lg font-bold tabular-nums text-accent">{totalXp ? `${(totalXp / 1_000_000).toFixed(0)}M` : "—"}</div>
                  <div className="text-[10px] text-text-secondary/50">XP</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-bg-tertiary/20 px-3 py-2 text-center">
                  <div className="text-lg font-bold tabular-nums text-danger">{totalBossKills?.toLocaleString() ?? "—"}</div>
                  <div className="text-[10px] text-text-secondary/50">Boss KC</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-bg-tertiary/20 px-3 py-2 text-center">
                  <div className="text-lg font-bold tabular-nums text-[#a78bfa]">{maxedSkills ?? 0}<span className="text-text-secondary/30 text-sm">/24</span></div>
                  <div className="text-[10px] text-text-secondary/50">Maxed</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tool grid */}
          <section>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-secondary/50 mb-2">Tools</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {TOOL_GRID.map((tool, i) => {
                const accent = getFeatureAccent(tool.id);
                return (
                  <motion.button
                    key={tool.id}
                    type="button"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.15 }}
                    onClick={() => navigate(tool.id)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 px-2 py-3 transition hover:bg-bg-secondary/50 hover:border-border/60"
                  >
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ color: accent, background: `color-mix(in srgb, ${accent} 10%, transparent)` }}
                    >
                      <ShellIcon view={tool.id} className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] text-text-secondary">{tool.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Recent */}
          {recentEntities.length > 0 && (
            <section>
              <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-secondary/50 mb-2">Recent</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {recentEntities.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => navigate(entity.view, entity.params)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-bg-secondary/50"
                  >
                    <WikiImage src={entity.icon ?? NAV_ICONS.wiki} alt="" className="h-5 w-5 shrink-0" fallback={entity.name[0]} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{entity.name}</div>
                      <div className="text-[10px] text-text-secondary/40">{entity.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — widgets */}
        <div className="space-y-4">

          {/* Watchlist widget */}
          {watchlistItems.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-secondary/50">Watchlist</h3>
                <button
                  type="button"
                  onClick={() => navigate("watchlist")}
                  className="text-[10px] text-accent hover:text-accent-hover transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-1">
                {watchlistItems.slice(0, 5).map((item) => {
                  const p = prices[String(item.id)];
                  const price = p?.high ?? p?.low ?? null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded text-xs"
                    >
                      <span className="truncate text-text-primary">{item.name}</span>
                      {price != null && (
                        <span className="text-success tabular-nums shrink-0">{formatGp(price)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-3">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-secondary/50 mb-2">While Playing</h3>
            <div className="space-y-0.5">
              {[
                { id: "timers", label: "Farm Timers", desc: "Track growth cycles" },
                { id: "stars", label: "Shooting Stars", desc: "Live star calls" },
                { id: "slayer", label: "Slayer Helper", desc: "Task weights & blocks" },
                { id: "dps-calc", label: "DPS Calculator", desc: "Gear & loadout DPS" },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className="flex items-center gap-2.5 w-full rounded-lg px-2 py-2 text-left transition hover:bg-bg-secondary/50"
                >
                  <ShellIcon view={id} className="h-4 w-4 shrink-0 opacity-50" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{label}</div>
                    <div className="text-[10px] text-text-secondary/40">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          {settings.keybindsEnabled && (
            <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-3">
              <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-secondary/50 mb-2">Shortcuts</h3>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {[
                  { key: "K", label: "Search" },
                  { key: "1", label: "Profile" },
                  { key: "3", label: "Skills" },
                  { key: "5", label: "Bosses" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between px-2 py-1">
                    <span className="text-text-secondary/50">{label}</span>
                    <kbd className="rounded border border-border/60 bg-bg-tertiary/50 px-1.5 py-0.5 font-mono text-text-secondary/40">
                      {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl+"}{key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
