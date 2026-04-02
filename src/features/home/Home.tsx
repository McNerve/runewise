import { useState } from "react";
import { motion } from "motion/react";
import type { HiscoreData } from "../../lib/api/hiscores";
import { NAV_ICONS } from "../../lib/sprites";
import { SIDEBAR_FEATURES } from "../../lib/features";
import { getFeatureAccent } from "../../lib/featureAccent";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import ShellIcon from "../../components/ShellIcon";
import { useWatchlist } from "../../hooks/useWatchlist";
import { loadRecentEntities } from "../../lib/recentEntities";

interface HomeProps {
  hiscores?: {
    rsn: string;
    data: HiscoreData | null;
  };
}

const QUICK_LAUNCH = ["overview", "market", "bosses", "wiki", "stars", "loot"] as const;

const QUICK_ACTIONS = [
  { view: "watchlist" as const, label: "Watchlist", desc: "Price alerts & tracked items" },
  { view: "bosses" as const, label: "Boss Guides", desc: "Strategy, drops & tasks" },
  { view: "stars" as const, label: "Live Stars", desc: "Crowdsource star calls" },
  { view: "wiki" as const, label: "Wiki Lookup", desc: "Search the OSRS Wiki" },
] as const;

export default function Home({ hiscores }: HomeProps) {
  const { items: watchlistItems } = useWatchlist();
  const { navigate } = useNavigation();
  const [recentEntities] = useState(() => loadRecentEntities().slice(0, 6));
  const savedRsn = hiscores?.rsn ?? "";
  const totalLevel =
    hiscores?.data?.skills
      .filter((skill) => skill.name !== "Overall")
      .reduce((sum, skill) => sum + skill.level, 0) ?? null;
  const totalBossKills =
    hiscores?.data?.activities
      ?.filter((activity) => activity.score > 0 && activity.id >= 20)
      .reduce((sum, activity) => sum + activity.score, 0) ?? null;
  const maxedSkills =
    hiscores?.data?.skills.filter((skill) => skill.name !== "Overall" && skill.level >= 99)
      .length ?? null;

  return (
    <div className="space-y-8">
      {/* Header — no card wrapper */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {savedRsn ? `Welcome back, ${savedRsn}` : "Command Center"}
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            {savedRsn
              ? "Your profile, recent workspaces, and tools."
              : "Set a saved RSN to personalize your experience."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(savedRsn ? "overview" : "lookup")}
            className="btn-primary"
          >
            {savedRsn ? "Open Profile" : "Find a Player"}
          </button>
          <button
            type="button"
            onClick={() => navigate("wiki")}
            className="btn-ghost"
          >
            Look Up Anything
          </button>
        </div>
      </header>

      {/* Stats row — minimal, no card wrapper */}
      {savedRsn && (
        <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-border/40">
          <div className="stat-card bg-bg-secondary/40 px-4 py-3" data-accent="green">
            <div className="text-[11px] uppercase tracking-wider text-text-secondary/70">Total Level</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{totalLevel?.toLocaleString() ?? "—"}</div>
          </div>
          <div className="stat-card bg-bg-secondary/40 px-4 py-3" data-accent="red">
            <div className="text-[11px] uppercase tracking-wider text-text-secondary/70">Boss KC</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{totalBossKills?.toLocaleString() ?? "—"}</div>
          </div>
          <div className="stat-card bg-bg-secondary/40 px-4 py-3" data-accent="purple">
            <div className="text-[11px] uppercase tracking-wider text-text-secondary/70">Maxed Skills</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums">{maxedSkills != null ? `${maxedSkills}/24` : "—"}</div>
          </div>
        </div>
      )}

      {/* Quick launch — compact grid */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/70 mb-3">Quick Launch</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LAUNCH.map((featureId, index) => {
            const feature = SIDEBAR_FEATURES.find((item) => item.id === featureId);
            if (!feature) return null;
            const accent = getFeatureAccent(feature.id);

            return (
              <motion.button
                key={feature.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.18, ease: "easeOut" }}
                onClick={() => navigate(feature.id)}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-bg-secondary/60"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}>
                  <ShellIcon view={feature.id} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text-primary">{feature.navLabel}</span>
                </span>
                <span className="text-text-secondary/30 transition group-hover:text-text-secondary">→</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Recent entities */}
      {recentEntities.length > 0 && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/70 mb-3">Recent</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentEntities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => navigate(entity.view, entity.params)}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-bg-secondary/60"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary/60">
                  <WikiImage src={entity.icon ?? NAV_ICONS.wiki} alt="" className="h-4 w-4" fallback={entity.name[0]} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">{entity.name}</span>
                  <span className="block text-xs text-text-secondary/60">{entity.category}</span>
                </span>
                <span className="text-text-secondary/30 transition group-hover:text-text-secondary">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions — simple link list */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/70 mb-3">While Playing</h3>
        <div className="space-y-0.5">
          {QUICK_ACTIONS.map(({ view, label, desc }) => (
            <button
              key={view}
              type="button"
              onClick={() => navigate(view)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-bg-secondary/60"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ color: getFeatureAccent(view), background: `color-mix(in srgb, ${getFeatureAccent(view)} 12%, transparent)` }}>
                <ShellIcon view={view} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text-primary">{label}</span>
                <span className="block text-xs text-text-secondary/60">{desc}</span>
              </span>
              <span className="text-text-secondary/30 transition group-hover:text-text-secondary">→</span>
            </button>
          ))}
        </div>
      </section>

      {/* Market summary — inline, no card */}
      {watchlistItems.length > 0 && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/70 mb-3">Market Watch</h3>
          <button
            type="button"
            onClick={() => navigate("watchlist")}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-bg-secondary/60"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ color: getFeatureAccent("watchlist"), background: `color-mix(in srgb, ${getFeatureAccent("watchlist")} 12%, transparent)` }}>
              <ShellIcon view="watchlist" className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text-primary">{watchlistItems.length} tracked {watchlistItems.length === 1 ? "item" : "items"}</span>
              <span className="block text-xs text-text-secondary/60">Review thresholds and alerts</span>
            </span>
            <span className="text-text-secondary/30 transition group-hover:text-text-secondary">→</span>
          </button>
        </section>
      )}
    </div>
  );
}
