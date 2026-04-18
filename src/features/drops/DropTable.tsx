import { useState, useEffect } from "react";
import { searchMonsters, fetchDropTable, type DropItem } from "../../lib/api/wiki";
import { fetchLatestPrices, fetchMapping, type ItemPrice } from "../../lib/api/ge";
import { formatGp } from "../../lib/format";
import { itemIcon } from "../../lib/sprites";
import { useDebounce } from "../../hooks/useDebounce";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import { findBossByName } from "../../lib/data/bosses";

function RarityBar({ rarity }: { rarity: string }) {
  // Match patterns like "1/128", "~1/115", "~8/115"
  const match = rarity.match(/~?(\d+)\/([\d,]+)/);
  if (!match) return null;
  const numerator = parseInt(match[1]);
  const denominator = parseInt(match[2].replace(/,/g, ""));
  const rate = denominator / numerator; // effective 1-in-X rate
  // Use log scale for better visual distribution
  const width = Math.max(5, Math.min(100, (1 / rate) * 5000));
  const color = rate <= 16 ? "bg-text-secondary" : rate <= 128 ? "bg-accent" : rate <= 512 ? "bg-warning" : "bg-danger";
  return (
    <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-1">
      <div className={`rounded-full h-1.5 ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function DropTable() {
  const { params, navigate } = useNavigation();
  const [query, setQuery] = useState(params.monster ?? "");
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { name: string; drops: DropItem[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prices, setPrices] = useState<Record<string, ItemPrice>>({});
  const [itemMap, setItemMap] = useState<Map<string, number>>(new Map());
  const selectedBoss = selectedMonster ? findBossByName(selectedMonster) : null;

  useEffect(() => {
    Promise.all([fetchLatestPrices(), fetchMapping()]).then(([p, mapping]) => {
      setPrices(p);
      const nameToId = new Map<string, number>();
      for (const item of mapping) {
        nameToId.set(item.name.toLowerCase(), item.id);
      }
      setItemMap(nameToId);
    });
  }, []);

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

  // Auto-load if navigated with a monster param
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from nav params
    if (params.monster) selectMonster(params.monster);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Loot & Drops</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Search monsters, inspect wiki drop tables, and jump into related combat workflows.
          </p>
        </div>
        {selectedMonster ? (
          <div className="flex flex-wrap gap-2">
            {selectedBoss ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("bosses", { boss: selectedBoss.name, tab: "drops" })}
                  className="rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  Open Boss Workspace
                </button>
                <button
                  type="button"
                  onClick={() => navigate("bosses", { boss: selectedBoss.name, tab: "tasks" })}
                  className="rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  Combat Tasks
                </button>
                <button
                  type="button"
                  onClick={() => navigate("dps-calc", { monster: selectedBoss.name })}
                  className="rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                  DPS
                </button>
              </>
            ) : null}
            <a
              href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(selectedMonster.replace(/ /g, "_"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
            >
              Open Wiki
            </a>
          </div>
        ) : null}
      </div>

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
          className="w-full bg-bg-tertiary border border-border rounded-lg px-4 py-2.5 text-sm"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-tertiary border border-border rounded-lg overflow-hidden z-10 shadow-lg">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => selectMonster(name)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors"
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
          <div className="bg-bg-tertiary rounded-lg overflow-hidden">
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
                    className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-secondary transition-colors"
                  >
                    <td className="px-4 py-1.5 font-medium">
                      <button
                        onClick={() => navigate("market", { query: drop.name })}
                        className="hover:text-accent transition-colors text-left flex items-center gap-2"
                      >
                        <WikiImage
                          src={itemIcon(drop.name)}
                          alt=""
                          className="w-5 h-5 shrink-0"
                          fallback={drop.name[0]}
                        />
                        {drop.name}
                      </button>
                    </td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">
                      {drop.quantity}
                    </td>
                    <td
                      className={`px-4 py-1.5 text-right ${rarityColor(drop.rarity)}`}
                    >
                      {drop.rarity}
                      <RarityBar rarity={drop.rarity} />
                    </td>
                    <td className="px-4 py-1.5 text-right text-success">
                      {(() => {
                        const itemId = itemMap.get(drop.name.toLowerCase());
                        const price = itemId ? prices[String(itemId)] : null;
                        const gePrice = price?.high ?? price?.low ?? null;
                        return gePrice != null ? formatGp(gePrice) : (drop.price || "\u2014");
                      })()}
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
