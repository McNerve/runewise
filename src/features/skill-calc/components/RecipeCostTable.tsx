import { useMemo } from "react";
import { formatGp } from "../../../lib/format";
import { itemIcon } from "../../../lib/sprites";
import type { HerbloreRecipe } from "../../../lib/data/herblore-recipes";
import type { CraftingRecipe } from "../../../lib/data/crafting-recipes";
import type { ItemPrice } from "../../../lib/api/ge";
import ItemTooltip from "../../../components/ItemTooltip";

type Recipe = HerbloreRecipe | CraftingRecipe;

interface RecipeCostTableProps {
  recipes: Recipe[];
  prices: Record<string, ItemPrice>;
  currentLevel: number;
  xpNeeded: number;
}

function getPrice(
  prices: Record<string, ItemPrice>,
  itemId: number
): number | null {
  const p = prices[String(itemId)];
  return p?.high ?? p?.low ?? null;
}

function isHerblore(r: Recipe): r is HerbloreRecipe {
  return "herbId" in r;
}

export default function RecipeCostTable({
  recipes,
  prices,
  currentLevel,
  xpNeeded,
}: RecipeCostTableProps) {
  const rows = useMemo(() => {
    return recipes
      .filter((r) => r.levelReq <= currentLevel + 10) // show slightly above level too
      .map((r) => {
        const actions = Math.ceil(xpNeeded / r.xp);
        let costPerAction: number | null = null;
        let productValue: number | null = null;

        if (isHerblore(r)) {
          const herbPrice = getPrice(prices, r.herbId);
          const secPrice = getPrice(prices, r.secondaryId);
          if (herbPrice != null && secPrice != null) {
            costPerAction = herbPrice + secPrice;
          }
          productValue = getPrice(prices, r.productId);
        } else {
          const matPrice = getPrice(prices, r.materialId);
          if (matPrice != null) {
            costPerAction = matPrice * r.materialQty;
          }
          productValue = getPrice(prices, r.productId);
        }

        const netCost =
          costPerAction != null
            ? costPerAction - (productValue ?? 0)
            : null;
        const totalCost = netCost != null ? netCost * actions : null;
        const costPerXp = netCost != null ? netCost / r.xp : null;
        const meetsLevel = r.levelReq <= currentLevel;

        return { recipe: r, actions, costPerAction, productValue, netCost, totalCost, costPerXp, meetsLevel };
      })
      .sort((a, b) => (a.costPerXp ?? Infinity) - (b.costPerXp ?? Infinity));
  }, [recipes, prices, currentLevel, xpNeeded]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="section-kicker mb-2">Recipe Calculator</div>
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
          {rows.map(({ recipe: r, actions, netCost, totalCost, costPerXp, meetsLevel }) => (
            <tr
              key={r.name}
              className={`border-b border-border/50 even:bg-bg-primary/25 hover:bg-bg-tertiary transition-colors ${!meetsLevel ? "opacity-40" : ""}`}
            >
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <img
                    src={itemIcon(r.name)}
                    alt=""
                    className="w-4 h-4 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <ItemTooltip itemName={r.name}><span className="text-sm cursor-default">{r.name}</span></ItemTooltip>
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
      <p className="text-[10px] text-text-secondary/40 mt-1">
        Green values indicate profit. Cost = ingredients − product sale value.
      </p>
    </div>
  );
}
