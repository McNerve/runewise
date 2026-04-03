import { useState, useMemo } from "react";
import {
  fetchAllSpells,
  getSpellsByBook,
  type Spellbook,
} from "../../lib/api/spells";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { useAsyncData } from "../../hooks/useAsyncData";
import { NAV_ICONS } from "../../lib/sprites";

const BOOKS: { id: Spellbook; label: string }[] = [
  { id: "normal", label: "Standard" },
  { id: "ancient", label: "Ancient" },
  { id: "lunar", label: "Lunar" },
  { id: "arceuus", label: "Arceuus" },
];

const BOOK_COLORS: Record<Spellbook, string> = {
  normal: "#3b82f6",
  ancient: "#a855f7",
  lunar: "#06b6d4",
  arceuus: "#22c55e",
};

export default function Spells() {
  const { data, loading, error, retry } = useAsyncData(fetchAllSpells, []);
  const allSpells = data ?? [];
  const [activeBook, setActiveBook] = useState<Spellbook>("normal");
  const [query, setQuery] = useState("");

  const spells = useMemo(() => {
    let filtered = getSpellsByBook(allSpells, activeBook);
    if (query.trim()) {
      const lower = query.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(lower));
    }
    return filtered;
  }, [allSpells, activeBook, query]);

  const bookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const book of BOOKS) {
      counts[book.id] = getSpellsByBook(allSpells, book.id).length;
    }
    return counts;
  }, [allSpells]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-5">Spellbook</h2>

      {/* Book selector */}
      <div className="flex gap-2 mb-4">
        {BOOKS.map((book) => (
          <button
            key={book.id}
            onClick={() => { setActiveBook(book.id); setQuery(""); }}
            aria-pressed={activeBook === book.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeBook === book.id
                ? "text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
            style={
              activeBook === book.id
                ? { backgroundColor: BOOK_COLORS[book.id] }
                : undefined
            }
          >
            {book.label} ({bookCounts[book.id] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search spells..."
        aria-label="Search spells"
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm mb-4"
      />

      {/* Spell table */}
      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : loading ? (
        <EmptyState
          icon={NAV_ICONS.spells}
          title="Loading spells..."
        />
      ) : spells.length === 0 ? (
        <EmptyState
          icon={NAV_ICONS.spells}
          title="No spells found"
          description="Try a different search term."
        />
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs">
              <th scope="col" className="px-3 py-2 text-left">Spell</th>
              <th scope="col" className="px-3 py-2 text-right">Level</th>
              <th scope="col" className="px-3 py-2 text-right">XP</th>
              {spells.some((s) => s.damage) && (
                <th scope="col" className="px-3 py-2 text-right">Max Hit</th>
              )}
              <th scope="col" className="px-3 py-2 text-left">Type</th>
              <th scope="col" className="px-3 py-2 text-center">Members</th>
            </tr>
          </thead>
          <tbody>
            {spells.map((spell) => (
              <tr
                key={spell.name}
                className="border-b border-border/30 hover:bg-bg-secondary/30 transition-colors"
              >
                <td className="px-3 py-2 text-sm font-medium">{spell.name}</td>
                <td className="px-3 py-2 text-right text-xs tabular-nums text-text-secondary">
                  {spell.level}
                </td>
                <td className="px-3 py-2 text-right text-xs tabular-nums text-text-secondary">
                  {spell.xp > 0 ? spell.xp : "—"}
                </td>
                {spells.some((s) => s.damage) && (
                  <td className="px-3 py-2 text-right text-xs tabular-nums">
                    {spell.damage ? (
                      <span className="text-danger">{spell.damage}</span>
                    ) : (
                      <span className="text-text-secondary/40">—</span>
                    )}
                  </td>
                )}
                <td className="px-3 py-2 text-xs text-text-secondary">
                  {spell.type || "—"}
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {spell.members ? (
                    <span className="text-warning">P2P</span>
                  ) : (
                    <span className="text-success">F2P</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="text-xs text-text-secondary/40 mt-2 text-right">
        {spells.length} spells · Data from OSRS Wiki
      </div>
    </div>
  );
}
