import { useState, useEffect } from "react";
import { searchMonsters, fetchDropTable, type DropItem } from "../../lib/api/wiki";
import { useDebounce } from "../../hooks/useDebounce";

export default function DropTable() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { name: string; drops: DropItem[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    searchMonsters(debouncedQuery).then((results) => {
      if (!cancelled) {
        setSuggestions(results);
        setShowSuggestions(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const selectMonster = async (name: string) => {
    setSelectedMonster(name);
    setQuery(name);
    setShowSuggestions(false);
    setLoading(true);
    const data = await fetchDropTable(name);
    setCategories(data.categories);
    setLoading(false);
  };

  const rarityColor = (rarity: string) => {
    const r = rarity.toLowerCase();
    if (r.includes("always")) return "text-text-primary";
    if (r.includes("1/1") && !r.includes("1/1,") && !r.includes("1/10"))
      return "text-text-primary";
    if (r.includes("common") || r.startsWith("1/")) {
      const match = rarity.match(/1\/([\d,]+)/);
      if (match) {
        const denom = parseInt(match[1].replace(/,/g, ""));
        if (denom <= 16) return "text-text-secondary";
        if (denom <= 128) return "text-accent";
        if (denom <= 512) return "text-warning";
        return "text-danger";
      }
      return "text-text-secondary";
    }
    if (r.includes("uncommon")) return "text-accent";
    if (r.includes("rare")) return "text-warning";
    if (r.includes("very rare")) return "text-danger";
    return "text-text-secondary";
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Monster Drop Tables</h2>

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedMonster(null);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search monsters..."
          className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-lg overflow-hidden z-10 shadow-lg">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => selectMonster(name)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <p className="text-sm text-text-secondary">Loading drop table...</p>
      )}

      {selectedMonster && !loading && categories.length === 0 && (
        <p className="text-sm text-text-secondary">
          No drop table found for {selectedMonster}.
        </p>
      )}

      {categories.map((cat) => (
        <div key={cat.name} className="mb-4">
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            {cat.name}
          </h3>
          <div className="bg-bg-secondary rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th className="text-left px-4 py-2">Item</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Rate</th>
                  <th className="text-right px-4 py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {cat.drops.map((drop, i) => (
                  <tr
                    key={`${drop.name}-${i}`}
                    className="border-b border-border/50 hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-4 py-1.5 font-medium">{drop.name}</td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">
                      {drop.quantity}
                    </td>
                    <td
                      className={`px-4 py-1.5 text-right ${rarityColor(drop.rarity)}`}
                    >
                      {drop.rarity}
                    </td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">
                      {drop.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
