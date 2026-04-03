import { useCallback, useEffect, useState } from "react";
import Overview from "../overview/Overview";
import { fetchHiscores, type HiscoreData, type HiscoreSkill } from "../../lib/api/hiscores";
import { useNavigation } from "../../lib/NavigationContext";
import EmptyState from "../../components/EmptyState";
import { NAV_ICONS, SKILL_ICONS } from "../../lib/sprites";

type Mode = "lookup" | "compare";

function StatCompare({
  left,
  right,
  leftRsn,
  rightRsn,
}: {
  left: HiscoreData;
  right: HiscoreData;
  leftRsn: string;
  rightRsn: string;
}) {
  const getRight = (name: string): HiscoreSkill | undefined =>
    right.skills.find((s) => s.name === name);

  return (
    <div>
      <div className="section-kicker mb-3">Skill Comparison</div>
      <div className="bg-bg-secondary rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th scope="col" className="text-left px-4 py-2">Skill</th>
              <th scope="col" className="text-right px-3 py-2">{leftRsn}</th>
              <th scope="col" className="text-center px-2 py-2">Diff</th>
              <th scope="col" className="text-right px-3 py-2">{rightRsn}</th>
            </tr>
          </thead>
          <tbody>
            {left.skills.map((skill) => {
              const other = getRight(skill.name);
              const otherLevel = other?.level ?? 1;
              const diff = skill.level - otherLevel;
              return (
                <tr
                  key={skill.name}
                  className="border-b border-border/30 hover:bg-bg-tertiary transition-colors"
                >
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-2">
                      {SKILL_ICONS[skill.name] && (
                        <img
                          src={SKILL_ICONS[skill.name]}
                          alt=""
                          className="w-4 h-4"
                        />
                      )}
                      <span className="text-xs">{skill.name}</span>
                    </div>
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums font-medium ${
                      diff > 0 ? "text-success" : diff < 0 ? "text-text-secondary" : ""
                    }`}
                  >
                    {skill.level}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {diff !== 0 && (
                      <span
                        className={`text-[10px] font-medium tabular-nums ${
                          diff > 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums font-medium ${
                      diff < 0 ? "text-success" : diff > 0 ? "text-text-secondary" : ""
                    }`}
                  >
                    {otherLevel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* XP summary */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { rsn: leftRsn, data: left },
          { rsn: rightRsn, data: right },
        ].map(({ rsn, data }) => {
          const totalXp = data.skills.reduce((s, sk) => s + sk.xp, 0);
          const totalLevel = data.skills.reduce((s, sk) => s + sk.level, 0);
          return (
            <div
              key={rsn}
              className="bg-bg-secondary rounded-lg px-4 py-3"
            >
              <div className="text-xs font-medium text-text-primary mb-1">
                {rsn}
              </div>
              <div className="text-xs text-text-secondary">
                Total level:{" "}
                <span className="text-text-primary font-medium tabular-nums">
                  {totalLevel.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-text-secondary">
                Total XP:{" "}
                <span className="text-text-primary font-medium tabular-nums">
                  {totalXp.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayerLookup() {
  const { params } = useNavigation();
  const [mode, setMode] = useState<Mode>("lookup");
  const [query, setQuery] = useState(params.query ?? "");
  const [lookupRsn, setLookupRsn] = useState("");
  const [data, setData] = useState<HiscoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compare state
  const [leftQuery, setLeftQuery] = useState("");
  const [rightQuery, setRightQuery] = useState("");
  const [leftData, setLeftData] = useState<{
    rsn: string;
    data: HiscoreData;
  } | null>(null);
  const [rightData, setRightData] = useState<{
    rsn: string;
    data: HiscoreData;
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const handleLookup = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchHiscores(trimmed);
      setData(result);
      setLookupRsn(trimmed);
    } catch (lookupError) {
      setData(null);
      setLookupRsn(trimmed);
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Failed to look up player"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompare = useCallback(async () => {
    const l = leftQuery.trim();
    const r = rightQuery.trim();
    if (!l || !r) return;
    if (l.toLowerCase() === r.toLowerCase()) {
      setCompareError("Enter two different player names to compare.");
      return;
    }

    setCompareLoading(true);
    setCompareError(null);
    setLeftData(null);
    setRightData(null);

    const [lResult, rResult] = await Promise.allSettled([
      fetchHiscores(l),
      fetchHiscores(r),
    ]);

    if (lResult.status === "fulfilled") {
      setLeftData({ rsn: l, data: lResult.value });
    }
    if (rResult.status === "fulfilled") {
      setRightData({ rsn: r, data: rResult.value });
    }

    const failures: string[] = [];
    if (lResult.status === "rejected") failures.push(l);
    if (rResult.status === "rejected") failures.push(r);
    if (failures.length > 0) {
      setCompareError(`Could not find: ${failures.join(", ")}`);
    }

    setCompareLoading(false);
  }, [leftQuery, rightQuery]);

  useEffect(() => {
    if (!params.query) return;
    if (params.query === lookupRsn) return;
    setQuery(params.query);
    void handleLookup(params.query);
  }, [handleLookup, lookupRsn, params.query]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Player Lookup
            </h2>
            <p className="max-w-2xl text-sm text-text-secondary">
              {mode === "compare"
                ? "Compare two players side-by-side."
                : "Inspect any OSRS player on demand without overwriting your saved RuneWise profile."}
            </p>
          </div>
          <div className="flex gap-1">
            {(
              [
                { id: "lookup", label: "Lookup" },
                { id: "compare", label: "Compare" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  mode === m.id
                    ? "bg-accent text-white"
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "lookup" ? (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleLookup(query);
              }}
              className="mt-4 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search any player..."
                aria-label="Search player by RSN"
                className="flex-1 rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm outline-none transition focus:border-accent"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? "Looking up..." : "Lookup player"}
              </button>
            </form>

            {error ? (
              <div className="mt-3">
                <EmptyState
                  icon={NAV_ICONS.lookup}
                  title={`Could not find "${lookupRsn}"`}
                  description={error}
                />
              </div>
            ) : null}

            {!lookupRsn && !loading && !error ? (
              <div className="mt-5">
                <EmptyState
                  icon={NAV_ICONS.lookup}
                  title="Search for a player"
                  description="Look up any player to open a full profile snapshot. Your saved RSN in the command bar stays untouched."
                />
              </div>
            ) : null}

            {loading && lookupRsn ? (
              <div className="py-8 space-y-3">
                <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
                <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-1/2" />
                <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-2/3" />
              </div>
            ) : null}

            {data && lookupRsn ? (
              <Overview hiscores={data} rsn={lookupRsn} />
            ) : null}
          </>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleCompare();
              }}
              className="mt-4 flex flex-col gap-3 md:flex-row"
            >
              <input
                type="text"
                value={leftQuery}
                onChange={(e) => setLeftQuery(e.target.value)}
                placeholder="Player 1..."
                aria-label="Search player 1 by RSN"
                className="flex-1 rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm outline-none transition focus:border-accent"
              />
              <span className="self-center text-xs text-text-secondary/50">
                vs
              </span>
              <input
                type="text"
                value={rightQuery}
                onChange={(e) => setRightQuery(e.target.value)}
                placeholder="Player 2..."
                aria-label="Search player 2 by RSN"
                className="flex-1 rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm outline-none transition focus:border-accent"
              />
              <button
                type="submit"
                disabled={
                  compareLoading || !leftQuery.trim() || !rightQuery.trim()
                }
                className="rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
              >
                {compareLoading ? "Comparing..." : "Compare"}
              </button>
            </form>

            {compareError && (
              <div className="mt-3 text-xs text-danger bg-danger/8 rounded-lg px-4 py-2.5">
                {compareError}
              </div>
            )}

            {!leftData && !rightData && !compareLoading && !compareError && (
              <div className="mt-5">
                <EmptyState
                  icon={NAV_ICONS.lookup}
                  title="Compare two players"
                  description="Enter two RSNs to see their skills side-by-side with level differences highlighted."
                />
              </div>
            )}

            {leftData && rightData && (
              <div className="mt-5 max-w-2xl">
                <StatCompare
                  left={leftData.data}
                  right={rightData.data}
                  leftRsn={leftData.rsn}
                  rightRsn={rightData.rsn}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
