import { useState, useEffect, useCallback } from "react";
import { useNavigation } from "../../lib/NavigationContext";
import { WIKI_IMG, skillIcon, bossIconSmall } from "../../lib/sprites";
import { TableSkeleton } from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import { warn } from "../../lib/logger";
import { timeAgo } from "../../lib/format";

function skillIconUrl(name: string): string {
  if (name === "Overall") return `${WIKI_IMG}/Stats_icon.png`;
  return skillIcon(name);
}
import {
  fetchWomGains,
  fetchWomAchievements,
  fetchWomRecords,
  fetchWomNameChanges,
  fetchWomCompetitions,
  type WomGains,
  type WomAchievement,
  type WomRecord,
  type WomNameChange,
  type WomPlayerCompetition,
  type GainsPeriod,
} from "../../lib/api/wom";

interface Props {
  rsn: string;
}

const PERIODS: { id: GainsPeriod; label: string }[] = [
  { id: "day", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

const SKILL_NAMES: Record<string, string> = {
  overall: "Overall",
  attack: "Attack",
  defence: "Defence",
  strength: "Strength",
  hitpoints: "Hitpoints",
  ranged: "Ranged",
  prayer: "Prayer",
  magic: "Magic",
  cooking: "Cooking",
  woodcutting: "Woodcutting",
  fletching: "Fletching",
  fishing: "Fishing",
  firemaking: "Firemaking",
  crafting: "Crafting",
  smithing: "Smithing",
  mining: "Mining",
  herblore: "Herblore",
  agility: "Agility",
  thieving: "Thieving",
  slayer: "Slayer",
  farming: "Farming",
  runecraft: "Runecraft",
  hunter: "Hunter",
  construction: "Construction",
  sailing: "Sailing",
};

const formatBossName = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// WOM metric keys → display names that match our sprite maps
const METRIC_FIXUPS: Record<string, string> = {
  kril_tsutsaroth: "K'ril Tsutsaroth",
  kreearra: "Kree'Arra",
  tztok_jad: "TzTok-Jad",
  tzkal_zuk: "TzKal-Zuk",
  vetion: "Vet'ion",
  calvarion: "Calvar'ion",
  phosanis_nightmare: "Phosani's Nightmare",
  theatre_of_blood: "Theatre of Blood",
  chambers_of_xeric: "Chambers of Xeric",
  tombs_of_amascut: "Tombs of Amascut",
  the_corrupted_gauntlet: "The Corrupted Gauntlet",
  the_gauntlet: "The Gauntlet",
  the_leviathan: "The Leviathan",
  the_whisperer: "The Whisperer",
  moons_of_peril: "Moons of Peril",
  the_royal_titans: "The Royal Titans",
  fortis_colosseum: "The Fortis Colosseum",
  sol_heredit: "Sol Heredit",
  clue_scrolls_all: "Clue Scrolls (all)",
  clue_scrolls_beginner: "Clue Scrolls (beginner)",
  clue_scrolls_easy: "Clue Scrolls (easy)",
  clue_scrolls_medium: "Clue Scrolls (medium)",
  clue_scrolls_hard: "Clue Scrolls (hard)",
  clue_scrolls_elite: "Clue Scrolls (elite)",
  clue_scrolls_master: "Clue Scrolls (master)",
  collections_logged: "Collection Log",
  last_man_standing: "Last Man Standing",
  soul_wars_zeal: "Soul Wars",
  bounty_hunter_hunter: "Bounty Hunter",
  bounty_hunter_rogue: "Bounty Hunter",
  league_points: "League Points",
  ehp: "Overall",
  ehb: "Overall",
};

// Resolve WOM metric to icon URL
function metricIconUrl(rawMetric: string): string | null {
  const fixedName = METRIC_FIXUPS[rawMetric];
  if (fixedName) {
    if (rawMetric in SKILL_NAMES) return skillIconUrl(SKILL_NAMES[rawMetric]!);
    if (fixedName === "Overall") return skillIconUrl("Overall");
    if (fixedName === "Collection Log") return `${WIKI_IMG}/Collection_log.png`;
    if (fixedName.startsWith("Clue Scrolls")) {
      const tier = fixedName.match(/\((\w+)\)/)?.[1] ?? "hard";
      return `${WIKI_IMG}/Clue_scroll_%28${tier}%29.png`;
    }
    return bossIconSmall(fixedName);
  }
  if (rawMetric in SKILL_NAMES) return skillIconUrl(SKILL_NAMES[rawMetric]!);
  return bossIconSmall(formatBossName(rawMetric));
}

function metricDisplayName(rawMetric: string): string {
  return METRIC_FIXUPS[rawMetric] ?? SKILL_NAMES[rawMetric] ?? formatBossName(rawMetric);
}

function CompetitionsView({ competitions }: { competitions: WomPlayerCompetition[] }) {
  const now = new Date();
  const sorted = [...competitions].sort(
    (a, b) => new Date(b.competition?.startsAt ?? 0).getTime() - new Date(a.competition?.startsAt ?? 0).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((pc) => {
        const comp = pc.competition;
        if (!comp) return null;
        const isActive = new Date(comp.endsAt ?? 0) > now;
        const rawMetric = comp.metric ?? "";
        const metric = rawMetric.replace(/_/g, " ");
        const compIcon = metricIconUrl(rawMetric);
        const start = comp.startsAt ? new Date(comp.startsAt).toLocaleDateString() : "\u2014";
        const end = comp.endsAt ? new Date(comp.endsAt).toLocaleDateString() : "\u2014";
        const gained = pc.progress?.gained ?? 0;
        const rank = pc.rank ?? 0;
        return (
          <a
            key={comp.id}
            href={`https://wiseoldman.net/competitions/${comp.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`block bg-bg-secondary rounded-lg px-4 py-3 border-l-2 transition-colors hover:bg-bg-tertiary ${
              isActive ? "border-success" : "border-border/30 opacity-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <img src={compIcon ?? ""} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className="text-sm font-medium">{comp.title ?? "Untitled"}</span>
                  {isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success">Active</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary capitalize">
                    {comp.type ?? "classic"}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-text-secondary">
                  <span className="capitalize">{metric}</span>
                  <span>{start} \u2013 {end}</span>
                  {comp.group && <span className="text-accent">{comp.group.name}</span>}
                </div>
                {pc.teamName && (
                  <div className="text-xs text-text-secondary mt-0.5">
                    Team: <span className="text-text-primary">{pc.teamName}</span>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                {gained !== 0 && (
                  <div className={`text-sm font-medium tabular-nums ${gained > 0 ? "text-success" : ""}`}>
                    {gained > 0 ? `+${gained.toLocaleString()}` : gained.toLocaleString()}
                  </div>
                )}
                {rank > 0 && (
                  <div className="text-[10px] text-text-secondary">Rank #{rank.toLocaleString()}</div>
                )}
                <div className="text-[10px] text-text-secondary/50">
                  {comp.participantCount ?? 0} participants
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

const CONTENT_TABS = ["gains", "achievements", "records", "competitions"] as const;

export default function XpTracker({ rsn }: Props) {
  const { navigate } = useNavigation();
  const [period, setPeriod] = useState<GainsPeriod>("week");
  const [gains, setGains] = useState<WomGains | null>(null);
  const [achievements, setAchievements] = useState<WomAchievement[]>([]);
  const [records, setRecords] = useState<WomRecord[]>([]);
  const [nameChanges, setNameChanges] = useState<WomNameChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tab, setTab] = useState<"gains" | "achievements" | "records" | "competitions">(
    "gains"
  );
  const [competitions, setCompetitions] = useState<WomPlayerCompetition[]>([]);
  const [competitionsLoaded, setCompetitionsLoaded] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!rsn) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    Promise.all([
      fetchWomGains(rsn, period),
      fetchWomAchievements(rsn),
      fetchWomRecords(rsn),
      fetchWomNameChanges(rsn),
    ])
      .then(([g, a, r, n]) => {
        if (cancelled) return;
        setGains(g);
        setAchievements(a);
        setRecords(r);
        setNameChanges(n);
        setLoading(false);
        setLastUpdated(new Date());
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Failed to load tracker data. The Wise Old Man API may be down.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rsn, period, fetchKey]);

  // Lazy-load competitions when tab selected
  useEffect(() => {
    if (tab !== "competitions" || !rsn || competitionsLoaded) return;
    let cancelled = false;
    fetchWomCompetitions(rsn)
      .then((data) => {
        if (cancelled) return;
        setCompetitions(data ?? []);
        setCompetitionsLoaded(true);
      })
      .catch((err: unknown) => {
        warn("XpTracker: fetch competitions", err);
        if (!cancelled) setCompetitionsLoaded(true);
      });
    return () => { cancelled = true; };
  }, [tab, rsn, competitionsLoaded]);

  const handleRefresh = useCallback(() => {
    setFetchKey((k) => k + 1);
    setCompetitionsLoaded(false);
  }, []);

  const header = (
    <div className="space-y-1 mb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">XP Tracker</h2>
          <p className="text-sm text-text-secondary">
            Track XP gains, boss kills, achievements, and records via Wise Old Man.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-1.5">
          {lastUpdated && (
            <span className="text-xs text-text-secondary">
              Updated {timeAgo(Math.floor(lastUpdated.getTime() / 1000))}
            </span>
          )}
          <button onClick={handleRefresh} className="text-xs text-accent hover:underline">Refresh</button>
        </div>
      </div>
      {nameChanges.length > 0 && (
        <span className="text-[10px] text-text-secondary/50" title={nameChanges.map(n => `${n.oldName} \u2192 ${n.newName}`).join(", ")}>
          Previously: {nameChanges.map(n => n.oldName).join(" \u2192 ")}
        </span>
      )}
    </div>
  );

  if (!rsn) {
    return (
      <div className="text-text-secondary text-sm">
        Enter your RSN above to track XP gains.
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl">
        {header}
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm">
          <div className="font-medium text-danger">{error}</div>
          <button onClick={() => { setError(null); handleRefresh(); }} className="mt-2 text-xs text-accent hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const skillGains = gains
    ? Object.entries(gains.skills)
        .filter(([, v]) => v.experience.gained > 0)
        .sort((a, b) => b[1].experience.gained - a[1].experience.gained)
    : [];

  const bossGains = gains
    ? Object.entries(gains.bosses)
        .filter(([, v]) => v.kills.gained > 0)
        .sort((a, b) => b[1].kills.gained - a[1].kills.gained)
    : [];


  return (
    <div className="max-w-3xl">
      {header}

      <div className="flex gap-4 mb-4">
        <div className="flex gap-1.5">
          {CONTENT_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
                tab === t
                  ? "border-accent/50 bg-accent/10"
                  : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
              }`}
            >
              {tab === t && <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />}
              <div className={`text-xs font-semibold capitalize ${tab === t ? "text-accent" : ""}`}>{t}</div>
            </button>
          ))}
        </div>

        {tab === "gains" && (
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                aria-pressed={period === p.id}
                className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
                  period === p.id
                    ? "border-accent/50 bg-accent/10"
                    : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
                }`}
              >
                {period === p.id && <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />}
                <div className={`text-xs font-semibold ${period === p.id ? "text-accent" : ""}`}>{p.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <TableSkeleton rows={6} cols={3} />}

      {tab === "gains" && !loading && gains && (
        <div className="space-y-4">
          {skillGains.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
                Skill XP Gains
              </h3>
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-xs">
                      <th scope="col" className="text-left px-4 py-2">Skill</th>
                      <th scope="col" className="text-right px-4 py-2">XP Gained</th>
                      <th scope="col" className="text-right px-4 py-2">Rank Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillGains.map(([key, data]) => (
                      <tr
                        key={key}
                        className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary"
                      >
                        <td className="px-4 py-1.5 font-medium">
                          <button
                            onClick={() => navigate("skill-calc", { skill: SKILL_NAMES[key] ?? key })}
                            className="flex items-center gap-2 hover:text-accent transition-colors"
                          >
                            <img src={skillIconUrl(SKILL_NAMES[key] ?? key)} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            {SKILL_NAMES[key] ?? key}
                          </button>
                        </td>
                        <td className="px-4 py-1.5 text-right text-success tabular-nums">
                          +{data.experience.gained.toLocaleString()}
                        </td>
                        <td className={`px-4 py-1.5 text-right tabular-nums ${
                          data.rank.gained < 0 ? "text-success" : data.rank.gained > 0 ? "text-danger" : "text-text-secondary"
                        }`}>
                          {data.rank.gained > 0
                            ? `+${data.rank.gained.toLocaleString()}`
                            : data.rank.gained < 0
                              ? data.rank.gained.toLocaleString()
                              : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bossGains.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
                Boss Kills
              </h3>
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary text-xs">
                      <th scope="col" className="text-left px-4 py-2">Boss</th>
                      <th scope="col" className="text-right px-4 py-2">Kills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bossGains.map(([key, data]) => (
                      <tr
                        key={key}
                        className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary"
                      >
                        <td className="px-4 py-1.5 font-medium">
                          <button
                            onClick={() => navigate("bosses", { boss: formatBossName(key) })}
                            className="flex items-center gap-2 hover:text-accent transition-colors"
                          >
                            <img src={bossIconSmall(formatBossName(key))} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            {formatBossName(key)}
                          </button>
                        </td>
                        <td className="px-4 py-1.5 text-right text-success tabular-nums">
                          +{data.kills.gained.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {skillGains.length === 0 && bossGains.length === 0 && (
            <EmptyState title="No gains this period" description="Try a longer time period or update your profile on Wise Old Man." />
          )}
        </div>
      )}

      {tab === "achievements" && !loading && achievements.length === 0 && (
        <EmptyState title="No achievements recorded" description="Achievements appear as you unlock levels and milestones while being tracked on Wise Old Man." />
      )}
      {tab === "achievements" && !loading && achievements.length > 0 && (
        <div className="rounded-xl border border-border/60 overflow-hidden max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-secondary">
              <tr className="border-b border-border text-text-secondary text-xs">
                <th scope="col" className="text-left px-4 py-2">Achievement</th>
                <th scope="col" className="text-left px-4 py-2">Skill</th>
                <th scope="col" className="text-right px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {achievements.map((a, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary"
                >
                  <td className="px-4 py-1.5 font-medium">{a.name}</td>
                  <td className="px-4 py-1.5 text-text-secondary">
                    <span className="flex items-center gap-2">
                      <img src={metricIconUrl(a.metric) ?? ""} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      {metricDisplayName(a.metric)}
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-right text-text-secondary">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "records" && !loading && (() => {
        const PERIOD_ORDER = ["five_min", "day", "week", "month", "year"];
        const PERIOD_LABELS: Record<string, string> = { five_min: "5 Min", day: "Day", week: "Week", month: "Month", year: "Year" };
        // Group records by metric
        const grouped = new Map<string, typeof records>();
        for (const r of records) {
          const group = grouped.get(r.metric) ?? [];
          group.push(r);
          grouped.set(r.metric, group);
        }
        // Sort groups: skills first (by SKILL_NAMES key order), then bosses
        const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
          const aSkill = a in SKILL_NAMES;
          const bSkill = b in SKILL_NAMES;
          if (aSkill && !bSkill) return -1;
          if (!aSkill && bSkill) return 1;
          return metricDisplayName(a).localeCompare(metricDisplayName(b));
        });

        function formatValue(v: number): string {
          if (v >= 1_000_000) return `+${(v / 1_000_000).toFixed(2)}m`;
          if (v >= 1_000) return `+${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
          return `+${v.toLocaleString()}`;
        }

        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedGroups.map(([metric, recs]) => (
              <div key={metric}>
                <div className="flex items-center gap-2 mb-2">
                  <img src={metricIconUrl(metric) ?? ""} alt="" className="w-5 h-5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className="text-sm font-semibold">{metricDisplayName(metric)}</span>
                </div>
                <div className="space-y-1">
                  {PERIOD_ORDER.map((period) => {
                    const rec = recs.find((r) => r.period === period);
                    return (
                      <div
                        key={period}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/30 bg-bg-secondary/40"
                      >
                        <span className="text-xs text-text-secondary">{PERIOD_LABELS[period] ?? period}</span>
                        <div className="text-right">
                          {rec && rec.value > 0 ? (
                            <>
                              <div className="text-sm font-semibold text-success tabular-nums">
                                {formatValue(rec.value)}
                              </div>
                              <div className="text-[10px] text-text-secondary/50">
                                {new Date(rec.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-text-secondary/30">N/A</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {tab === "competitions" && (
        <div>
          {!competitionsLoaded && <TableSkeleton rows={4} cols={3} />}
          {competitionsLoaded && competitions.length === 0 && (
            <EmptyState title="No competitions found" description="This player hasn't participated in any Wise Old Man competitions." />
          )}
          {competitionsLoaded && competitions.length > 0 && (
            <CompetitionsView competitions={competitions} />
          )}
        </div>
      )}
    </div>
  );
}
