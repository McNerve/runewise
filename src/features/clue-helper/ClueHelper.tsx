import { useEffect, useMemo, useState } from "react";
import type { ClueEntry, ClueTier, ClueType } from "../../lib/data/clues";
import { CLUE_TIERS } from "../../lib/data/clues";
import { useDebounce } from "../../hooks/useDebounce";
import EmptyState from "../../components/EmptyState";
import { NAV_ICONS } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import { TableSkeleton } from "../../components/Skeleton";

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

const TIER_ACTIVE_BORDER: Record<ClueTier, string> = {
  Beginner: "border-text-secondary/50",
  Easy: "border-success/50",
  Medium: "border-accent/50",
  Hard: "border-warning/50",
  Elite: "border-purple-400/50",
  Master: "border-danger/50",
};

const TIER_ACTIVE_BG: Record<ClueTier, string> = {
  Beginner: "bg-text-secondary/10",
  Easy: "bg-success/10",
  Medium: "bg-accent/10",
  Hard: "bg-warning/10",
  Elite: "bg-purple-500/10",
  Master: "bg-danger/10",
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

  useEffect(() => {
    setVisibleCount(50);
  }, [debouncedQuery, typeFilter, tierFilter]);

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
    return results;
  }, [clues, debouncedQuery, typeFilter, tierFilter]);

  const pagedFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

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
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Clue Helper</h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          Search 729 clue scroll solutions across all tiers. Paste your clue text to find the answer instantly.
        </p>
      </div>

      {/* Progress Dashboard */}
      {!loading && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          {CLUE_TIERS.map((tier) => {
            const total = clues.filter((c) => c.tier === tier).length;
            return (
              <div key={tier} className="rounded-xl border border-border/60 bg-bg-primary/45 px-3 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">{tier}</div>
                <div className={`text-lg font-semibold ${TIER_TEXT_COLORS[tier]}`}>{total}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Paste your clue text here to find the solution..."
        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-sm mb-5 placeholder:text-text-secondary/50"
      />

      {/* Tier Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TIERS.map((t) => {
          const isAll = t === "All";
          const active = tierFilter === t;
          const tierColor = !isAll ? t as ClueTier : null;
          return (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`relative rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? tierColor
                    ? `${TIER_ACTIVE_BORDER[tierColor]} ${TIER_ACTIVE_BG[tierColor]} ${TIER_TEXT_COLORS[tierColor]}`
                    : "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-bg-primary/50 text-text-secondary hover:border-border hover:bg-bg-primary/70"
              }`}
            >
              {active && (
                <div className={`absolute -bottom-px left-3 right-3 h-0.5 rounded-full ${
                  tierColor ? `bg-current` : "bg-accent"
                }`} />
              )}
              {t}
            </button>
          );
        })}
      </div>

      {/* Type Filter Pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
              typeFilter === t
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <span className="text-xs text-text-secondary">
          {filtered.length} / {clues.length} clues
        </span>
      </div>

      {/* Loading State */}
      {loading && <TableSkeleton rows={8} cols={3} />}

      {/* Clue Groups */}
      <div className="space-y-5">
        {CLUE_TIERS.map((tier) => {
          const tierClues = grouped.get(tier) ?? [];
          if (tierClues.length === 0) return null;
          return (
            <div key={tier} className="rounded-xl border border-border/60 overflow-hidden">
              <div className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${TIER_TEXT_COLORS[tier]} ${TIER_BG[tier]} border-b ${TIER_BORDER_COLORS[tier]}`}>
                <span>{tier}</span>
                <span className={`px-1.5 py-0.5 rounded ${TIER_BADGE[tier]}`}>{tierClues.length}</span>
              </div>
              <div className="divide-y divide-border/30">
                {tierClues.map((clue) => {
                  const key = clueKey(clue);
                  return (
                    <div
                      key={key}
                      className="p-4 hover:bg-bg-tertiary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Clue text */}
                          <p className="text-sm text-text-secondary italic leading-relaxed mb-1">
                            {highlight(clue.text, q)}
                          </p>

                          {/* Solution */}
                          <p className="text-sm font-semibold text-text-primary mb-1">
                            {highlight(clue.solution, q)}
                          </p>

                          {/* Location */}
                          <p className="text-xs text-text-secondary">
                            {highlight(clue.location, q)}
                          </p>

                          {/* NPC */}
                          {clue.npc && (
                            <p className="text-xs text-accent mt-1">NPC: {clue.npc}</p>
                          )}

                          {/* Challenge answer */}
                          {clue.challengeAnswer && (
                            <div className="mt-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
                              <p className="text-xs text-warning font-medium">
                                Challenge answer: {clue.challengeAnswer}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => navigate("wiki", { search: clue.text })}
                            className="rounded-lg border border-border bg-bg-primary/60 px-2 py-1 text-[10px] font-medium text-accent transition hover:border-accent/40"
                            title="Look up in Wiki"
                          >
                            Wiki
                          </button>
                          <button
                            onClick={() => copyToClipboard(clue.solution, key)}
                            className="rounded-lg border border-border bg-bg-primary/60 px-2 py-1 text-[10px] font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                            title="Copy solution"
                          >
                            {copiedKey === key ? "\u2713 Copied" : "Copy"}
                          </button>
                          <span className={`rounded-lg border px-2 py-1 text-[10px] font-medium ${TIER_BADGE[tier]} border-current/20`}>
                            {clue.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More */}
      {filtered.length > visibleCount && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setVisibleCount((n) => n + 50)}
            className="rounded-xl border border-border bg-bg-primary/60 px-5 py-2.5 text-sm font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={NAV_ICONS["clue-helper"]}
          title="No clues found"
          description={
            debouncedQuery.length >= 2
              ? `No clues match "${debouncedQuery}". Try a shorter phrase, different keywords, or check the type/tier filters.`
              : "Try a different search or filter."
          }
        />
      )}
    </div>
  );
}
