import { useEffect, useMemo, useState } from "react";
import type { ClueEntry, ClueTier, ClueType } from "../../lib/data/clues";
import { CLUE_TIERS } from "../../lib/data/clues";
import { useDebounce } from "../../hooks/useDebounce";
import EmptyState from "../../components/EmptyState";
import { NAV_ICONS } from "../../lib/sprites";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import { useNavigation } from "../../lib/NavigationContext";

const TYPES: (ClueType | "All")[] = ["All", "Anagram", "Cipher", "Coordinate", "Cryptic", "Map", "Emote"];
const TIERS: (ClueTier | "All")[] = ["All", "Beginner", "Easy", "Medium", "Hard", "Elite", "Master"];

const TIER_TEXT_COLORS: Record<ClueTier, string> = {
  Beginner: "text-text-secondary",
  Easy: "text-success",
  Medium: "text-accent",
  Hard: "text-warning",
  Elite: "text-purple-400",
  Master: "text-danger",
};

const TIER_BORDER_COLORS: Record<ClueTier, string> = {
  Beginner: "border-text-secondary/30",
  Easy: "border-success/30",
  Medium: "border-accent/30",
  Hard: "border-warning/30",
  Elite: "border-purple-400/30",
  Master: "border-danger/30",
};

const TIER_BG: Record<ClueTier, string> = {
  Beginner: "bg-text-secondary/5",
  Easy: "bg-success/5",
  Medium: "bg-accent/5",
  Hard: "bg-warning/5",
  Elite: "bg-purple-500/5",
  Master: "bg-danger/5",
};

const TIER_BADGE: Record<ClueTier, string> = {
  Beginner: "bg-text-secondary/15 text-text-secondary",
  Easy: "bg-success/15 text-success",
  Medium: "bg-accent/15 text-accent",
  Hard: "bg-warning/15 text-warning",
  Elite: "bg-purple-500/15 text-purple-400",
  Master: "bg-danger/15 text-danger",
};

const CLUE_COMPLETED_KEY = "runewise_completed_clues";

function highlight(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-warning/30 text-text-primary rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function clueKey(clue: ClueEntry): string {
  return `${clue.tier}:${clue.type}:${clue.text}`;
}

export default function ClueHelper() {
  const { navigate } = useNavigation();
  const [clues, setClues] = useState<ClueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [typeFilter, setTypeFilter] = useState<ClueType | "All">("All");
  const [tierFilter, setTierFilter] = useState<ClueTier | "All">("All");
  const [visibleCount, setVisibleCount] = useState(50);
  const [completedClues, setCompletedClues] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(CLUE_COMPLETED_KEY, []))
  );
  const [hideCompleted, setHideCompleted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("../../lib/data/clues").then((module) => {
      if (cancelled) return;
      setClues(module.CLUE_ENTRIES);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [debouncedQuery, typeFilter, tierFilter, hideCompleted]);

  function toggleClue(key: string) {
    setCompletedClues((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveJSON(CLUE_COMPLETED_KEY, [...next]);
      return next;
    });
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }).catch(() => {});
  }

  const filtered = useMemo(() => {
    let results = clues;
    if (typeFilter !== "All") results = results.filter((c) => c.type === typeFilter);
    if (tierFilter !== "All") results = results.filter((c) => c.tier === tierFilter);
    if (debouncedQuery.length >= 2) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(
        (c) => c.text.toLowerCase().includes(q) || c.solution.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
      );
    }
    if (hideCompleted) results = results.filter((c) => !completedClues.has(clueKey(c)));
    return results;
  }, [clues, debouncedQuery, typeFilter, tierFilter, hideCompleted, completedClues]);

  // Paginated results (no hard 100 cap)
  const pagedFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  // Group by tier
  const grouped = useMemo(() => {
    const map = new Map<ClueTier, ClueEntry[]>();
    for (const tier of CLUE_TIERS) map.set(tier, []);
    for (const clue of pagedFiltered) {
      map.get(clue.tier)?.push(clue);
    }
    return map;
  }, [pagedFiltered]);

  const q = debouncedQuery.length >= 2 ? debouncedQuery : "";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold">Clue Scroll Helper</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="accent-accent"
            />
            Hide completed
          </label>
          <span className="text-xs text-text-secondary">
            {filtered.length} / {clues.length} clues
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mb-4 px-4 py-3 text-sm text-text-secondary">
          Loading clue reference data...
        </div>
      ) : null}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Paste your clue text here..."
        className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-sm mb-4"
        autoFocus={false}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                typeFilter === t ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                tierFilter === t ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {CLUE_TIERS.map((tier) => {
          const tierClues = grouped.get(tier) ?? [];
          if (tierClues.length === 0) return null;
          return (
            <div key={tier}>
              <div className={`flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider ${TIER_TEXT_COLORS[tier]}`}>
                <span>{tier}</span>
                <span className={`px-1.5 py-0.5 rounded ${TIER_BADGE[tier]}`}>{tierClues.length}</span>
              </div>
              <div className="space-y-2">
                {tierClues.map((clue) => {
                  const key = clueKey(clue);
                  const done = completedClues.has(key);
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-4 hover:bg-bg-tertiary transition-colors ${TIER_BORDER_COLORS[tier]} ${TIER_BG[tier]} ${done ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {/* Completion checkbox */}
                        <button
                          onClick={() => toggleClue(key)}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors mt-0.5 ${
                            done
                              ? "bg-success/20 border-success text-success"
                              : "border-border hover:border-accent"
                          }`}
                        >
                          {done && "✓"}
                        </button>
                        <p className="flex-1 text-sm text-text-secondary italic leading-relaxed">
                          {highlight(clue.text, q)}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Wiki link for Coordinate/Map clues */}
                          {(clue.type === "Coordinate" || clue.type === "Map") && (
                            <button
                              onClick={() => navigate("wiki", { search: clue.text })}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-accent hover:bg-accent/15 transition-colors"
                              title="Look up in Wiki"
                            >
                              wiki
                            </button>
                          )}
                          {/* Copy solution */}
                          <button
                            onClick={() => copyToClipboard(clue.solution, key)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary transition-colors"
                            title="Copy solution"
                          >
                            {copiedKey === key ? "✓" : "copy"}
                          </button>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                            {clue.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-text-primary mb-1">
                        {highlight(clue.solution, q)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {highlight(clue.location, q)}
                      </p>
                      {clue.npc && (
                        <p className="text-xs text-accent mt-1">NPC: {clue.npc}</p>
                      )}
                      {clue.challengeAnswer && (
                        <p className="text-xs text-warning mt-0.5 font-medium">
                          Challenge answer: {clue.challengeAnswer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more pagination */}
      {filtered.length > visibleCount && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setVisibleCount((n) => n + 50)}
            className="px-4 py-2 rounded text-sm bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={NAV_ICONS["clue-helper"]}
          title="No clues found"
          description={
            debouncedQuery.length >= 2
              ? `No clues match "${debouncedQuery}". Try a shorter phrase, different keywords, or check the type/tier filters.`
              : hideCompleted
              ? "All clues in this filter are marked complete. Uncheck \"Hide completed\" to see them."
              : "Try a different search or filter."
          }
        />
      )}
    </div>
  );
}
