import { useEffect, useState, useMemo } from "react";
import {
  fetchAllSpells,
  getSpellsByBook,
  type Spellbook,
  type WikiSpell,
} from "../../lib/api/spells";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { TableSkeleton } from "../../components/Skeleton";
import WikiImage from "../../components/WikiImage";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useGEData } from "../../hooks/useGEData";
import { useNavigation } from "../../lib/NavigationContext";
import { formatGp } from "../../lib/format";
import { WIKI_IMG } from "../../lib/sprites";

const BOOKS: { id: Spellbook; label: string; description: string }[] = [
  { id: "normal", label: "Standard", description: "Core combat & utility" },
  { id: "ancient", label: "Ancient", description: "Multi-target & freezes" },
  { id: "lunar", label: "Lunar", description: "Skilling & support" },
  { id: "arceuus", label: "Arceuus", description: "Necromancy & thralls" },
];

const BOOK_ACCENT: Record<Spellbook, string> = {
  normal: "border-accent/50 bg-accent/10 text-accent",
  ancient: "border-[#a855f7]/50 bg-[#a855f7]/10 text-[#a855f7]",
  lunar: "border-[#06b6d4]/50 bg-[#06b6d4]/10 text-[#06b6d4]",
  arceuus: "border-success/50 bg-success/10 text-success",
};

const RUNE_COLORS: Record<string, string> = {
  air: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  water: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  earth: "bg-amber-600/15 text-amber-500 border-amber-600/30",
  fire: "bg-red-500/15 text-red-400 border-red-500/30",
  mind: "bg-orange-400/15 text-orange-300 border-orange-400/30",
  body: "bg-blue-300/15 text-blue-200 border-blue-300/30",
  cosmic: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  chaos: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  nature: "bg-green-500/15 text-green-400 border-green-500/30",
  law: "bg-indigo-400/15 text-indigo-300 border-indigo-400/30",
  death: "bg-gray-400/15 text-gray-300 border-gray-400/30",
  blood: "bg-red-600/15 text-red-500 border-red-600/30",
  soul: "bg-purple-400/15 text-purple-300 border-purple-400/30",
  wrath: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  astral: "bg-pink-400/15 text-pink-300 border-pink-400/30",
};

function getRuneColor(rune: string): string {
  const lower = rune.toLowerCase();
  for (const [key, cls] of Object.entries(RUNE_COLORS)) {
    if (lower.includes(key)) return cls;
  }
  return "bg-bg-tertiary text-text-secondary border-border/50";
}

interface RuneCost {
  name: string;
  amount: number;
}

function parseRunesFromCost(cost: string): RuneCost[] {
  // Format: <sup>4</sup>[[File:Air rune.png|Air|link=Air rune]]  <sup>5</sup>[[File:Fire rune.png|Fire|link=Fire rune]]
  const results: RuneCost[] = [];
  const pattern = /<sup>(\d+)<\/sup>\s*\[\[File:[^|]*\|([^|]*)\|/g;
  let match;
  while ((match = pattern.exec(cost)) !== null) {
    results.push({ amount: parseInt(match[1]), name: match[2].trim() });
  }
  return results;
}

function parseRunes(runes: unknown, cost: unknown): RuneCost[] {
  try {
    // Best source: json.cost HTML with amounts + names
    if (typeof cost === "string" && cost.includes("<sup>")) {
      const parsed = parseRunesFromCost(cost);
      if (parsed.length > 0) return parsed;
    }

    // Fallback: uses_material array (names only, no amounts)
    if (Array.isArray(runes)) {
      return runes
        .filter((r): r is string => typeof r === "string")
        .map((name) => ({ amount: 1, name: name.replace(/ rune$/i, "").trim() }))
        .filter((r) => r.name.length > 0 && r.name !== "None" && !r.name.includes("see article"));
    }

    // String fallback
    if (typeof runes === "string" && runes) {
      const clean = runes.replace(/<[^>]*>/g, "").replace(/\[\[[^\]]*\]\]/g, "");
      const parts = clean.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      return parts.map((part) => {
        const m = part.match(/^(\d+)\s*x?\s*(.+)/i);
        if (m) return { amount: parseInt(m[1]), name: m[2].replace(/ rune$/i, "").trim() };
        return { amount: 1, name: part.replace(/ rune$/i, "").trim() };
      }).filter((r) => r.name.length > 0 && r.name.length < 30);
    }

    return [];
  } catch {
    return [];
  }
}

function RunePills({ runes }: { runes: RuneCost[] }) {
  if (runes.length === 0) return <span className="text-text-secondary/40">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {runes.map((rune) => (
        <span
          key={rune.name}
          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getRuneColor(rune.name)}`}
        >
          {rune.amount}× {rune.name}
        </span>
      ))}
    </div>
  );
}

function spellIcon(spell: WikiSpell): string {
  let name = spell.name;
  // Fix specific spells with non-standard icon names
  if (name.startsWith("Enchant Crossbow Bolt")) name = "Enchant Crossbow Bolt";
  if (name === "Hunter Kit (spell)") name = "Hunter Kit";
  return `${WIKI_IMG}/${name.replace(/ /g, "_").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29")}.png`;
}

export default function Spells() {
  const { navigate } = useNavigation();
  const { data, loading, error, retry } = useAsyncData(fetchAllSpells, []);
  const { mapping, prices, fetchIfNeeded } = useGEData();
  const allSpells = useMemo(() => data ?? [], [data]);
  const [activeBook, setActiveBook] = useState<Spellbook>("normal");
  const [query, setQuery] = useState("");
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const runePrice = useMemo(() => {
    const idByName = new Map<string, number>();
    for (const item of mapping) idByName.set(item.name.toLowerCase(), item.id);
    return (runeName: string): number | null => {
      const key = runeName.toLowerCase().includes("rune")
        ? runeName.toLowerCase()
        : `${runeName.toLowerCase()} rune`;
      const id = idByName.get(key);
      if (!id) return null;
      const p = prices[String(id)];
      return p?.high ?? p?.low ?? null;
    };
  }, [mapping, prices]);

  function totalCost(runes: RuneCost[]): number | null {
    if (runes.length === 0) return null;
    let total = 0;
    let anyKnown = false;
    for (const r of runes) {
      const price = runePrice(r.name);
      if (price != null) {
        total += price * r.amount;
        anyKnown = true;
      }
    }
    return anyKnown ? total : null;
  }

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

  const showDamage = spells.some((s) => s.damage);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Spells</h2>
        <p className="max-w-2xl text-sm text-text-secondary">
          Browse all {allSpells.length || 224} spells across 4 spellbooks. View rune costs, XP, damage, and level requirements.
        </p>
      </div>

      {/* Book tabs */}
      <div className="flex flex-wrap gap-2">
        {BOOKS.map((book) => (
          <button
            key={book.id}
            onClick={() => { setActiveBook(book.id); setQuery(""); }}
            aria-pressed={activeBook === book.id}
            className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
              activeBook === book.id
                ? BOOK_ACCENT[book.id]
                : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
            }`}
          >
            {activeBook === book.id && (
              <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-current opacity-60" />
            )}
            <div className="text-xs font-semibold">
              {book.label} ({bookCounts[book.id] ?? 0})
            </div>
            <div className={`hidden sm:block text-[11px] ${
              activeBook === book.id ? "opacity-60" : "text-text-secondary/60"
            }`}>
              {book.description}
            </div>
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
        className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm"
      />

      {/* Content */}
      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : loading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : spells.length === 0 ? (
        <EmptyState
          title="No spells found"
          description={query ? `No spells match "${query}".` : "No spells in this spellbook."}
        />
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th scope="col" className="text-left px-4 py-2">Spell</th>
                <th scope="col" className="text-right px-4 py-2">Level</th>
                <th scope="col" className="text-right px-4 py-2">XP</th>
                {showDamage && (
                  <th scope="col" className="text-right px-4 py-2">Max Hit</th>
                )}
                <th scope="col" className="text-left px-4 py-2">Rune Cost</th>
                <th scope="col" className="text-right px-4 py-2">Cost</th>
                <th scope="col" className="text-left px-4 py-2">Type</th>
                <th scope="col" className="text-center px-4 py-2">Members</th>
              </tr>
            </thead>
            <tbody>
              {spells.map((spell) => {
                const runes = parseRunes(spell.runes, spell.cost);
                const isExpanded = expandedSpell === spell.name;
                return (
                  <tr
                    key={spell.name}
                    onClick={() => setExpandedSpell(isExpanded ? null : spell.name)}
                    className={`border-b border-border/30 cursor-pointer transition-colors ${
                      isExpanded ? "bg-accent/5" : "even:bg-bg-primary/25 hover:bg-bg-secondary/40"
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 font-medium">
                        <WikiImage
                          src={spellIcon(spell)}
                          alt={spell.name}
                          className="w-6 h-6 shrink-0"
                          fallback={spell.name[0]}
                        />
                        {spell.name}
                      </div>
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          {runes.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-1">Rune Cost</div>
                              <RunePills runes={runes} />
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate("wiki", { page: spell.name.replace(/ /g, "_") }); }}
                              className="rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1 text-[11px] text-text-secondary hover:text-accent transition"
                            >
                              Open Wiki
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-text-secondary align-top">
                      {spell.level}
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-text-secondary align-top">
                      {spell.xp > 0 ? spell.xp : "—"}
                    </td>
                    {showDamage && (
                      <td className="px-4 py-2 text-right text-xs tabular-nums align-top">
                        {spell.damage ? (
                          <span className="text-danger font-medium">{spell.damage}</span>
                        ) : (
                          <span className="text-text-secondary/40">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2 align-top">
                      {!isExpanded && <RunePills runes={runes} />}
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-text-secondary align-top">
                      {(() => {
                        const cost = totalCost(runes);
                        return cost == null ? <span className="text-text-secondary/40">—</span> : formatGp(cost);
                      })()}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary align-top">
                      {spell.type || "—"}
                    </td>
                    <td className="px-4 py-2 text-center text-xs align-top">
                      {spell.members ? (
                        <span className="text-warning">P2P</span>
                      ) : (
                        <span className="text-success">F2P</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-text-secondary/40 text-right">
        {spells.length} spells · Data from OSRS Wiki
      </div>
    </div>
  );
}
