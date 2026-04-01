import { useState, useMemo } from "react";
import { CLUE_ENTRIES, type ClueTier, type ClueType } from "../../lib/data/clues";
import { useDebounce } from "../../hooks/useDebounce";

const TYPES: (ClueType | "All")[] = ["All", "Anagram", "Cipher", "Coordinate", "Cryptic", "Map", "Emote"];
const TIERS: (ClueTier | "All")[] = ["All", "Beginner", "Easy", "Medium", "Hard", "Elite", "Master"];

const TIER_COLORS: Record<ClueTier, string> = {
  Beginner: "bg-text-secondary/20 text-text-secondary",
  Easy: "bg-success/20 text-success",
  Medium: "bg-accent/20 text-accent",
  Hard: "bg-warning/20 text-warning",
  Elite: "bg-purple-500/20 text-purple-400",
  Master: "bg-danger/20 text-danger",
};

export default function ClueHelper() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [typeFilter, setTypeFilter] = useState<ClueType | "All">("All");
  const [tierFilter, setTierFilter] = useState<ClueTier | "All">("All");

  const filtered = useMemo(() => {
    let results = CLUE_ENTRIES;
    if (typeFilter !== "All") results = results.filter((c) => c.type === typeFilter);
    if (tierFilter !== "All") results = results.filter((c) => c.tier === tierFilter);
    if (debouncedQuery.length >= 2) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(
        (c) => c.clueText.toLowerCase().includes(q) || c.solution.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
      );
    }
    return results.slice(0, 100);
  }, [debouncedQuery, typeFilter, tierFilter]);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Clue Scroll Helper</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Paste your clue text here..."
        className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-sm mb-4"
      />

      <div className="flex gap-4 mb-4">
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

      <div className="text-xs text-text-secondary mb-3">
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-2">
        {filtered.map((clue, i) => (
          <div key={i} className="bg-bg-secondary rounded-lg p-4 hover:bg-bg-tertiary transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm text-text-secondary italic">{clue.clueText}</p>
              <div className="flex gap-1.5 shrink-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${TIER_COLORS[clue.tier]}`}>
                  {clue.tier}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                  {clue.type}
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">{clue.solution}</p>
            <p className="text-xs text-text-secondary">{clue.location}</p>
            {clue.npc && <p className="text-xs text-accent mt-0.5">NPC: {clue.npc}</p>}
            {clue.challengeAnswer && <p className="text-xs text-warning mt-0.5">Answer: {clue.challengeAnswer}</p>}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-8">
          No clues found. Try a different search or filter.
        </p>
      )}
    </div>
  );
}
