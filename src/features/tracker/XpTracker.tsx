import { useState, useEffect } from "react";
import { useNavigation } from "../../lib/NavigationContext";
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

export default function XpTracker({ rsn }: Props) {
  const { navigate } = useNavigation();
  const [period, setPeriod] = useState<GainsPeriod>("week");
  const [gains, setGains] = useState<WomGains | null>(null);
  const [achievements, setAchievements] = useState<WomAchievement[]>([]);
  const [records, setRecords] = useState<WomRecord[]>([]);
  const [nameChanges, setNameChanges] = useState<WomNameChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"gains" | "achievements" | "records" | "competitions">(
    "gains"
  );
  const [competitions, setCompetitions] = useState<WomPlayerCompetition[]>([]);
  const [competitionsLoaded, setCompetitionsLoaded] = useState(false);

  useEffect(() => {
    if (!rsn) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

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
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rsn, period]);

  // Lazy-load competitions when tab selected
  useEffect(() => {
    if (tab !== "competitions" || !rsn || competitionsLoaded) return;
    let cancelled = false;
    fetchWomCompetitions(rsn).then((data) => {
      if (cancelled) return;
      setCompetitions(data);
      setCompetitionsLoaded(true);
    });
    return () => { cancelled = true; };
  }, [tab, rsn, competitionsLoaded]);

  if (!rsn) {
    return (
      <div className="text-text-secondary text-sm">
        Enter your RSN above to track XP gains.
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

  const formatBossName = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">
          XP Tracker{" "}
          <span className="text-sm font-normal text-text-secondary">
            via Wise Old Man
          </span>
        </h2>
        {nameChanges.length > 0 && (
          <span className="text-[10px] text-text-secondary/50" title={nameChanges.map(n => `${n.oldName} → ${n.newName}`).join(", ")}>
            Previously: {nameChanges.map(n => n.oldName).join(" → ")}
          </span>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex gap-1">
          {(["gains", "achievements", "records", "competitions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`px-3 py-1.5 rounded text-xs capitalize ${
                tab === t
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "gains" && (
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                aria-pressed={period === p.id}
                className={`px-2 py-1 rounded text-xs ${
                  period === p.id
                    ? "bg-success/20 text-success"
                    : "bg-bg-secondary text-text-secondary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-1/2" />
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-2/3" />
        </div>
      )}

      {tab === "gains" && !loading && gains && (
        <div className="space-y-4">
          {skillGains.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
                Skill XP Gains
              </h3>
              <div className="bg-bg-secondary rounded-lg overflow-hidden">
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
                            className="hover:text-accent transition-colors"
                          >
                            {SKILL_NAMES[key] ?? key}
                          </button>
                        </td>
                        <td className="px-4 py-1.5 text-right text-success">
                          +{data.experience.gained.toLocaleString()}
                        </td>
                        <td className="px-4 py-1.5 text-right text-text-secondary">
                          {data.rank.gained > 0
                            ? `+${data.rank.gained.toLocaleString()}`
                            : data.rank.gained < 0
                              ? data.rank.gained.toLocaleString()
                              : "—"}
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
              <div className="bg-bg-secondary rounded-lg overflow-hidden">
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
                          {formatBossName(key)}
                        </td>
                        <td className="px-4 py-1.5 text-right text-success">
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
            <p className="text-sm text-text-secondary">
              No gains recorded for this period.
            </p>
          )}
        </div>
      )}

      {tab === "achievements" && !loading && (
        <div className="bg-bg-secondary rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
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
                  <td className="px-4 py-1.5 text-text-secondary capitalize">
                    {a.metric}
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

      {tab === "records" && !loading && (
        <div className="bg-bg-secondary rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-secondary">
              <tr className="border-b border-border text-text-secondary text-xs">
                <th scope="col" className="text-left px-4 py-2">Activity</th>
                <th scope="col" className="text-left px-4 py-2">Period</th>
                <th scope="col" className="text-right px-4 py-2">Record</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 50).map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary"
                >
                  <td className="px-4 py-1.5 font-medium capitalize">
                    {r.metric.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-1.5 text-text-secondary capitalize">
                    {r.period}
                  </td>
                  <td className="px-4 py-1.5 text-right text-success">
                    {r.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "competitions" && (
        <div>
          {!competitionsLoaded && (
            <div className="space-y-3">
              <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
              <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-1/2" />
            </div>
          )}
          {competitionsLoaded && competitions.length === 0 && (
            <p className="text-sm text-text-secondary">No competitions found for this player.</p>
          )}
          {competitionsLoaded && competitions.length > 0 && (() => {
            const now = new Date();
            const active = competitions.filter((c) => new Date(c.competition.endsAt) > now);
            const completed = competitions.filter((c) => new Date(c.competition.endsAt) <= now);
            const sorted = [...active, ...completed].sort(
              (a, b) => new Date(b.competition.startsAt).getTime() - new Date(a.competition.startsAt).getTime()
            );
            return (
              <div className="space-y-2">
                {sorted.map((pc) => {
                  const isActive = new Date(pc.competition.endsAt) > now;
                  const metric = pc.competition.metric.replace(/_/g, " ");
                  const start = new Date(pc.competition.startsAt).toLocaleDateString();
                  const end = new Date(pc.competition.endsAt).toLocaleDateString();
                  return (
                    <div
                      key={pc.competition.id}
                      className={`bg-bg-secondary rounded-lg px-4 py-3 border-l-2 ${
                        isActive ? "border-success" : "border-border/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{pc.competition.title}</span>
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success">
                                Active
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary capitalize">
                              {pc.competition.type}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-text-secondary">
                            <span className="capitalize">{metric}</span>
                            <span>{start} – {end}</span>
                            {pc.competition.group && (
                              <span className="text-accent">{pc.competition.group.name}</span>
                            )}
                          </div>
                          {pc.teamName && (
                            <div className="text-xs text-text-secondary mt-0.5">
                              Team: <span className="text-text-primary">{pc.teamName}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium tabular-nums">
                            {pc.progress.gained > 0
                              ? `+${pc.progress.gained.toLocaleString()}`
                              : pc.progress.gained.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-text-secondary">
                            Rank #{pc.rank.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-text-secondary/50">
                            {pc.competition.participantCount} participants
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
