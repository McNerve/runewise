import { useMemo } from "react";
import { formatGp } from "../../../lib/format";
import { itemIcon } from "../../../lib/sprites";
import type { WikiRecipe } from "../../../lib/api/recipes";
import type { ItemPrice } from "../../../lib/api/ge";

interface WikiRecipeTableProps {
  recipes: WikiRecipe[];
  prices: Record<string, ItemPrice>;
  itemMap: Map<string, number>;
  currentLevel: number;
  xpNeeded: number;
}

function getItemPrice(
  name: string,
  itemMap: Map<string, number>,
  prices: Record<string, ItemPrice>
): number | null {
  const id = itemMap.get(name.toLowerCase());
  if (!id) return null;
  const p = prices[String(id)];
  return p?.high ?? p?.low ?? null;
}

export default function WikiRecipeTable({
  recipes,
  prices,
  itemMap,
  currentLevel,
  xpNeeded,
}: WikiRecipeTableProps) {
  const rows = useMemo(() => {
    if (xpNeeded <= 0) return [];

    return recipes
      .filter((r) => r.levelReq <= currentLevel + 10)
      .map((r) => {
        const actions = Math.ceil(xpNeeded / r.xp);

        // Calculate material cost
        let materialCost: number | null = 0;
        for (const mat of r.materials) {
          const price = getItemPrice(mat.name, itemMap, prices);
          if (price == null) {
            materialCost = null;
            break;
          }
          materialCost += price * mat.quantity;
        }

        // Calculate output value
        let outputValue = 0;
        for (const out of r.output) {
          const price = getItemPrice(out.name, itemMap, prices);
          if (price != null) outputValue += price * out.quantity;
        }

        const netCost = materialCost != null ? materialCost - outputValue : null;
        const totalCost = netCost != null ? netCost * actions : null;
        const costPerXp = netCost != null && r.xp > 0 ? netCost / r.xp : null;
        const meetsLevel = r.levelReq <= currentLevel;

        return { recipe: r, actions, netCost, totalCost, costPerXp, meetsLevel };
      })
      .sort((a, b) => (a.costPerXp ?? Infinity) - (b.costPerXp ?? Infinity));
  }, [recipes, prices, itemMap, currentLevel, xpNeeded]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="section-kicker mb-2">Recipe Calculator ({rows.length} recipes)</div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-text-secondary text-xs">
            <th className="text-left px-3 py-2">Recipe</th>
            <th className="text-right px-3 py-2">Lvl</th>
            <th className="text-right px-3 py-2">XP</th>
            <th className="text-right px-3 py-2">Cost/ea</th>
            <th className="text-right px-3 py-2">GP/XP</th>
            <th className="text-right px-3 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map(({ recipe: r, actions, netCost, totalCost, costPerXp, meetsLevel }) => (
            <tr
              key={r.name}
              className={`border-b border-border/50 hover:bg-bg-tertiary transition-colors ${!meetsLevel ? "opacity-40" : ""}`}
            >
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <img
                    src={itemIcon(r.name)}
                    alt=""
                    className="w-4 h-4 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className="text-sm truncate">{r.name}</span>
                  {r.facility && (
                    <span className="text-[9px] text-text-secondary/40 truncate">
                      ({r.facility})
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-1.5 text-right text-xs text-text-secondary tabular-nums">
                {r.levelReq}
              </td>
              <td className="px-3 py-1.5 text-right text-xs text-text-secondary tabular-nums">
                {r.xp}
              </td>
              <td className={`px-3 py-1.5 text-right text-xs tabular-nums ${
                netCost != null && netCost < 0 ? "text-success" : "text-text-secondary"
              }`}>
                {netCost != null ? formatGp(Math.round(netCost)) : "—"}
              </td>
              <td className={`px-3 py-1.5 text-right text-xs tabular-nums ${
                costPerXp != null && costPerXp < 0 ? "text-success" : "text-text-secondary"
              }`}>
                {costPerXp != null ? `${costPerXp.toFixed(1)}` : "—"}
              </td>
              <td className={`px-3 py-1.5 text-right text-xs tabular-nums ${
                totalCost != null && totalCost < 0 ? "text-success" : "text-text-secondary"
              }`}>
                {totalCost != null ? formatGp(Math.round(totalCost)) : "—"}
                <div className="text-[10px] text-text-secondary/50">
                  {actions.toLocaleString()} crafts
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 30 && (
        <p className="text-[10px] text-text-secondary/40 mt-1">
          Showing top 30 of {rows.length} recipes (sorted by GP/XP)
        </p>
      )}
      <p className="text-[10px] text-text-secondary/40 mt-1">
        Green values indicate profit. Cost = materials − product sale value.
      </p>
    </div>
  );
}
