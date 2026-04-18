import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchAllRecipes, type WikiRecipe } from "../../lib/api/recipes";
import type { ItemPrice } from "../../lib/api/ge";
import { useGEData } from "../../hooks/useGEData";
import { formatGp } from "../../lib/format";
import { itemIcon, skillIcon } from "../../lib/sprites";
import ErrorState from "../../components/ErrorState";
import { useNavigation } from "../../lib/NavigationContext";
import ItemTooltip from "../../components/ItemTooltip";

function getItemPrice(
  name: string,
  itemMap: Map<string, number>,
  prices: Record<string, ItemPrice>,
): number | null {
  const lower = name.toLowerCase();
  // Try exact match first
  let id = itemMap.get(lower);
  // Try common variants: "(4)", "(3)", "(2)", "(1)" for potions/consumables
  if (!id) {
    for (const suffix of ["(4)", "(3)", "(2)", "(1)", " (4)", " (3)"]) {
      id = itemMap.get(lower + suffix);
      if (id) break;
    }
  }
  // Try without trailing parenthetical: "Item (4)" → "Item"
  if (!id && lower.includes("(")) {
    id = itemMap.get(lower.replace(/\s*\([^)]*\)\s*$/, "").trim());
  }
  if (!id) return null;
  const p = prices[String(id)];
  return p?.high ?? p?.low ?? null;
}

interface RecipeCalc {
  recipe: WikiRecipe;
  materialCost: number | null;
  outputValue: number | null;
  netCost: number | null;
  costPerXp: number | null;
}

function calcRecipe(
  r: WikiRecipe,
  itemMap: Map<string, number>,
  prices: Record<string, ItemPrice>,
): RecipeCalc {
  const materials = Array.isArray(r.materials) ? r.materials : [];
  const output = Array.isArray(r.output) ? r.output : [];

  let materialCost: number | null = 0;
  for (const mat of materials) {
    if (!mat?.name) continue;
    const price = getItemPrice(mat.name, itemMap, prices);
    if (price == null) { materialCost = null; break; }
    materialCost += price * (mat.quantity ?? 1);
  }

  let outputValue: number | null = 0;
  for (const out of output) {
    if (!out?.name) continue;
    const price = getItemPrice(out.name, itemMap, prices);
    if (price != null && outputValue != null) outputValue += price * (out.quantity ?? 1);
    else outputValue = null;
  }

  const netCost =
    materialCost != null && outputValue != null
      ? materialCost - outputValue
      : materialCost;

  const costPerXp = netCost != null && r.xp > 0 ? netCost / r.xp : null;

  return { recipe: r, materialCost, outputValue, netCost, costPerXp };
}

// Curated jump-off points when the user lands cold on a 5k-recipe search.
const POPULAR_RECIPES = [
  "Shark",
  "Saradomin brew",
  "Super combat potion",
  "Rune platebody",
  "Ranarr",
  "Magic logs",
  "Yew longbow",
  "Dragonstone",
  "Prayer potion",
  "Anglerfish",
];

export default function ProductionCalc() {
  const { navigate } = useNavigation();
  const { mapping, prices, loading: geLoading, fetchIfNeeded } = useGEData();
  const [recipes, setRecipes] = useState<WikiRecipe[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WikiRecipe | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const itemMap = useMemo(() => {
    const nameToId = new Map<string, number>();
    for (const item of mapping) nameToId.set(item.name.toLowerCase(), item.id);
    return nameToId;
  }, [mapping]);

  useEffect(() => {
    let cancelled = false;
    fetchAllRecipes()
      .then((r) => {
        if (cancelled) return;
        setRecipes(r);
        setRecipesLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load recipe data";
        setLoadError(message);
        setRecipesLoading(false);
      });
    return () => { cancelled = true; };
  }, [retryCount]);

  const loading = geLoading || recipesLoading;

  const results = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    return recipes
      .filter((r) => r.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [search, recipes]);

  const calc = useMemo(
    () => (selected ? calcRecipe(selected, itemMap, prices) : null),
    [selected, itemMap, prices],
  );

  const totalMaterialCost =
    calc?.materialCost != null ? calc.materialCost * quantity : null;
  const totalOutputValue =
    calc?.outputValue != null ? calc.outputValue * quantity : null;
  const totalNet = calc?.netCost != null ? calc.netCost * quantity : null;
  const totalXp = selected ? selected.xp * quantity : 0;
  const profit = totalNet != null ? -totalNet : null;

  const handleSelect = useCallback((r: WikiRecipe) => {
    setSelected(r);
    setSearch(r.name);
    setQuantity(1);
  }, []);

  if (loadError) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-xl font-semibold mb-5">Recipe Calculator</h2>
        <ErrorState
          error={loadError}
          onRetry={() => setRetryCount((n) => n + 1)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h2 className="text-xl font-semibold mb-1">Recipe Calculator</h2>
        <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-1">Recipe Calculator</h2>
      <p className="text-xs text-text-secondary mb-4">
        {recipes.length.toLocaleString()} recipes — search any craftable item to
        see costs, XP, and profit
      </p>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (selected && e.target.value !== selected.name) setSelected(null);
        }}
        placeholder="Search recipes (e.g. Rune platebody, Shark, Prayer potion)..."
        aria-label="Search recipes"
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm mb-1"
        autoFocus
      />

      {/* Results dropdown */}
      {!selected && results.length > 0 && (
        <div className="border border-border rounded bg-bg-tertiary max-h-72 overflow-y-auto mb-4">
          {results.map((r) => (
            <button
              key={`${r.name}-${r.skill}-${r.levelReq}`}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 hover:bg-bg-secondary transition-colors flex items-center gap-2 border-b border-border/30 last:border-0"
            >
              <img
                src={itemIcon(r.name)}
                alt=""
                className="w-5 h-5 shrink-0"
                onError={(e) => {
                  const el = e.currentTarget;
                  const alt = itemIcon(`${r.name} (4)`);
                  if (el.src !== alt) { el.src = alt; }
                  else { el.style.display = "none"; }
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm">{r.name}</span>
                {r.facility && (
                  <span className="text-[10px] text-text-secondary/50 ml-1.5">
                    ({r.facility})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <img src={skillIcon(r.skill)} alt="" className="w-3.5 h-3.5" />
                <span className="text-xs text-text-secondary tabular-nums">
                  {r.levelReq}
                </span>
              </div>
              <span className="text-xs text-text-secondary tabular-nums ml-2">
                {r.xp} XP
              </span>
            </button>
          ))}
        </div>
      )}

      {search.length >= 2 && !selected && results.length === 0 && (
        <p className="text-xs text-text-secondary py-3 mb-4">
          No recipes found for "{search}"
        </p>
      )}

      {/* Selected recipe detail */}
      {selected && calc && (
        <div className="mt-4 space-y-4">
          {/* Recipe header */}
          <div className="flex items-center gap-3">
            <img
              src={itemIcon(selected.name)}
              alt=""
              className="w-8 h-8"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div>
              <h3 className="text-lg font-semibold">{selected.name}</h3>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <img src={skillIcon(selected.skill)} alt="" className="w-3.5 h-3.5" />
                <button
                  type="button"
                  onClick={() => navigate("skill-calc", { skill: selected.skill })}
                  className="hover:text-accent transition-colors"
                >
                  {selected.skill} — Level {selected.levelReq}
                </button>
                {selected.facility && (
                  <span className="text-text-secondary/50">
                    — {selected.facility}
                  </span>
                )}
                {selected.members && (
                  <span className="text-warning text-[10px]">Members</span>
                )}
                <a
                  href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(selected.name.replace(/ /g, "_"))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent/50 hover:text-accent transition-colors"
                >
                  Wiki
                </a>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div>
            <div className="section-kicker mb-2">Materials</div>
            <div className="space-y-1">
              {(Array.isArray(selected.materials) ? selected.materials : []).map((mat) => {
                const price = getItemPrice(mat.name, itemMap, prices);
                return (
                  <div
                    key={mat.name}
                    className="flex items-center gap-2 py-1 px-2 rounded hover:bg-bg-secondary transition-colors"
                  >
                    <img
                      src={itemIcon(mat.name)}
                      alt=""
                      className="w-4 h-4 shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <ItemTooltip itemName={mat.name}>
                      <button
                        type="button"
                        onClick={() => navigate("market", { query: mat.name })}
                        className="text-sm flex-1 text-left text-text-primary hover:text-accent transition-colors"
                      >
                        {mat.name}
                      </button>
                    </ItemTooltip>
                    <span className="text-xs text-text-secondary tabular-nums">
                      x{mat.quantity}
                    </span>
                    <span className="text-xs text-text-secondary tabular-nums w-16 text-right">
                      {price != null ? formatGp(price) : "—"}
                    </span>
                    <span className="text-xs text-text-secondary tabular-nums w-20 text-right">
                      {price != null ? formatGp(price * mat.quantity) : "—"}
                    </span>
                  </div>
                );
              })}
              {(!Array.isArray(selected.materials) || selected.materials.length === 0) && (
                <p className="text-xs text-text-secondary/50">No materials required</p>
              )}
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="section-kicker mb-2">Output</div>
            <div className="space-y-1">
              {(Array.isArray(selected.output) ? selected.output : []).map((out) => {
                const price = getItemPrice(out.name, itemMap, prices);
                return (
                  <div
                    key={out.name}
                    className="flex items-center gap-2 py-1 px-2 rounded"
                  >
                    <img
                      src={itemIcon(out.name)}
                      alt=""
                      className="w-4 h-4 shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span className="text-sm flex-1">{out.name}</span>
                    <span className="text-xs text-text-secondary tabular-nums">
                      x{out.quantity}
                    </span>
                    <span className="text-xs text-text-secondary tabular-nums w-16 text-right">
                      {price != null ? formatGp(price) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-unit summary */}
          <div className="flex gap-6 py-2 text-sm">
            <div>
              <span className="text-text-secondary text-xs">XP/craft</span>
              <div className="tabular-nums font-medium">{selected.xp}</div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Material cost</span>
              <div className="tabular-nums font-medium">
                {calc.materialCost != null ? formatGp(Math.round(calc.materialCost)) : "—"}
              </div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Output value</span>
              <div className="tabular-nums font-medium">
                {calc.outputValue != null ? formatGp(Math.round(calc.outputValue)) : "—"}
              </div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Net cost</span>
              <div className={`tabular-nums font-medium ${calc.netCost != null && calc.netCost < 0 ? "text-success" : ""}`}>
                {calc.netCost != null ? formatGp(Math.round(calc.netCost)) : "—"}
              </div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">GP/XP</span>
              <div className={`tabular-nums font-medium ${calc.costPerXp != null && calc.costPerXp < 0 ? "text-success" : ""}`}>
                {calc.costPerXp != null ? calc.costPerXp.toFixed(1) : "—"}
              </div>
            </div>
          </div>

          {/* Quantity calculator */}
          <div>
            <div className="section-kicker mb-2">Batch Calculator</div>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs text-text-secondary">Quantity:</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-28 bg-bg-tertiary border border-border rounded px-2 py-1 text-sm tabular-nums"
              />
              <div className="flex gap-1">
                {[10, 100, 1000, 10000].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    aria-pressed={quantity === q}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      quantity === q
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-bg-tertiary rounded-lg px-3 py-2">
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                  Total XP
                </div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">
                  {totalXp.toLocaleString()}
                </div>
              </div>
              <div className="bg-bg-tertiary rounded-lg px-3 py-2">
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                  Material Cost
                </div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">
                  {totalMaterialCost != null ? formatGp(Math.round(totalMaterialCost)) : "—"}
                </div>
              </div>
              <div className="bg-bg-tertiary rounded-lg px-3 py-2">
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                  Output Value
                </div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">
                  {totalOutputValue != null ? formatGp(Math.round(totalOutputValue)) : "—"}
                </div>
              </div>
              <div className="bg-bg-tertiary rounded-lg px-3 py-2">
                <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                  {profit != null && profit >= 0 ? "Profit" : "Loss"}
                </div>
                <div className={`text-sm font-semibold tabular-nums mt-0.5 ${
                  profit != null && profit >= 0 ? "text-success" : "text-danger"
                }`}>
                  {profit != null ? formatGp(Math.round(Math.abs(profit))) : "—"}
                </div>
              </div>
            </div>

            {calc.costPerXp != null && (
              <p className="text-xs text-text-secondary mt-2">
                Cost per XP:{" "}
                <span className={`tabular-nums font-medium ${calc.costPerXp < 0 ? "text-success" : ""}`}>
                  {calc.costPerXp.toFixed(1)} GP/XP
                </span>
                {calc.costPerXp < 0 && " (profit)"}
              </p>
            )}
          </div>
        </div>
      )}

      {!selected && search.length < 2 && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-text-secondary/50">
            Type at least 2 characters to search — or jump into one of these:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_RECIPES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setSearch(name)}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-bg-secondary/50 px-3 py-1 text-xs text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
              >
                <img
                  src={itemIcon(name)}
                  alt=""
                  className="h-3.5 w-3.5"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
