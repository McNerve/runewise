import { useState, useEffect } from "react";
import { useNavigation } from "../../lib/NavigationContext";
import {
  fetchWomGains,
  fetchWomAchievements,
  fetchWomRecords,
  type WomGains,
  type WomAchievement,
  type WomRecord,
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
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"gains" | "achievements" | "records">(
    "gains"
  );

  useEffect(() => {
    if (!rsn) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    Promise.all([
      fetchWomGains(rsn, period),
      fetchWomAchievements(rsn),
      fetchWomRecords(rsn),
    ])
      .then(([g, a, r]) => {
        if (cancelled) return;
        setGains(g);
        setAchievements(a);
        setRecords(r);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rsn, period]);

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
      <h2 className="text-xl font-semibold mb-4">
        XP Tracker{" "}
        <span className="text-sm font-normal text-text-secondary">
          via Wise Old Man
        </span>
      </h2>

      <div className="flex gap-4 mb-4">
        <div className="flex gap-1">
          {(["gains", "achievements", "records"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
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
        <p className="text-sm text-text-secondary">Loading data...</p>
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
                      <th className="text-left px-4 py-2">Skill</th>
                      <th className="text-right px-4 py-2">XP Gained</th>
                      <th className="text-right px-4 py-2">Rank Change</th>
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
                      <th className="text-left px-4 py-2">Boss</th>
                      <th className="text-right px-4 py-2">Kills</th>
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
                <th className="text-left px-4 py-2">Achievement</th>
                <th className="text-left px-4 py-2">Skill</th>
                <th className="text-right px-4 py-2">Date</th>
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
                <th className="text-left px-4 py-2">Activity</th>
                <th className="text-left px-4 py-2">Period</th>
                <th className="text-right px-4 py-2">Record</th>
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
    </div>
  );
}
