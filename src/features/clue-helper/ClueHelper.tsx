import { useEffect, useMemo, useState } from "react";
import type { ClueEntry, ClueTier, ClueType } from "../../lib/data/clues";
import { CLUE_TIERS } from "../../lib/data/clues";
import { useDebounce } from "../../hooks/useDebounce";
import EmptyState from "../../components/EmptyState";
import { NAV_ICONS } from "../../lib/sprites";

const TYPES: (ClueType | "All")[] = ["All", "Anagram", "Cipher", "Coordinate", "Cryptic", "Map", "Emote"];
const TIERS: (ClueTier | "All")[] = ["All", "Beginner", "Easy", "Medium", "Hard", "Elite", "Master"];

const TIER_COLORS: Record<ClueTier, string> = {
  Beginner: "text-text-secondary border-text-secondary/30",
  Easy: "text-success border-success/30",
  Medium: "text-accent border-accent/30",
  Hard: "text-warning border-warning/30",
  Elite: "text-purple-400 border-purple-400/30",
  Master: "text-danger border-danger/30",
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

export default function ClueHelper() {
  const [clues, setClues] = useState<ClueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [typeFilter, setTypeFilter] = useState<ClueType | "All">("All");
  const [tierFilter, setTierFilter] = useState<ClueTier | "All">("All");

  useEffect(() => {
    let cancelled = false;

    import("../../lib/data/clues").then((module) => {
      if (cancelled) return;
      setClues(module.CLUE_ENTRIES);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
    return results.slice(0, 100);
  }, [clues, debouncedQuery, typeFilter, tierFilter]);

  // Group by tier
  const grouped = useMemo(() => {
    const map = new Map<ClueTier, ClueEntry[]>();
    for (const tier of CLUE_TIERS) map.set(tier, []);
    for (const clue of filtered) {
      map.get(clue.tier)?.push(clue);
    }
    return map;
  }, [filtered]);

  const q = debouncedQuery.length >= 2 ? debouncedQuery : "";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold">Clue Scroll Helper</h2>
        <span className="text-xs text-text-secondary">
          {filtered.length} / {clues.length} clues
        </span>
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
              <div className={`flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider ${TIER_COLORS[tier].split(" ")[0]}`}>
                <span>{tier}</span>
                <span className={`px-1.5 py-0.5 rounded ${TIER_BADGE[tier]}`}>{tierClues.length}</span>
              </div>
              <div className="space-y-2">
                {tierClues.map((clue, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 hover:bg-bg-tertiary transition-colors ${TIER_COLORS[tier].split(" ")[1]} ${TIER_BG[tier]}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm text-text-secondary italic leading-relaxed">
                        {highlight(clue.text, q)}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary shrink-0">
                        {clue.type}
                      </span>
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
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={NAV_ICONS["clue-helper"]}
          title="No clues found"
          description="Try a different search or filter."
        />
      )}
    </div>
  );
}
