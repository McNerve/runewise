import { useMemo } from "react";
import { CONSTRUCTION_ITEMS, CONSTRUCTION_CATEGORIES } from "../../../lib/data/construction-items";
import { formatGp } from "../../../lib/format";
import type { ItemPrice } from "../../../lib/api/ge";

interface Props {
  prices: Record<string, ItemPrice>;
  xpNeeded: number;
  currentLevel: number;
}

export default function ConstructionPlanner({
  prices,
  xpNeeded,
  currentLevel,
}: Props) {
  const items = useMemo(() => {
    return CONSTRUCTION_ITEMS.filter(
      (item) => item.levelReq <= Math.max(currentLevel, 99)
    ).map((item) => {
      const actions = Math.ceil(xpNeeded / item.xp);
      let costPerAction = 0;
      const materialCosts: string[] = [];

      for (const mat of item.materials) {
        const price =
          prices[String(mat.itemId)]?.high ??
          prices[String(mat.itemId)]?.low ??
          0;
        const matCost = price * mat.quantity;
        costPerAction += matCost;
        if (price > 0) {
          materialCosts.push(`${mat.quantity}× ${mat.name} (${formatGp(price)})`);
        } else {
          materialCosts.push(`${mat.quantity}× ${mat.name}`);
        }
      }

      const totalCost = costPerAction * actions;
      const gpPerXp = costPerAction > 0 ? costPerAction / item.xp : 0;

      return {
        ...item,
        actions,
        costPerAction,
        totalCost,
        gpPerXp,
        materialCosts,
        meetsLevel: currentLevel >= item.levelReq,
      };
    });
  }, [prices, xpNeeded, currentLevel]);

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
        Construction Planner
      </h3>

      {CONSTRUCTION_CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        if (catItems.length === 0) return null;

        return (
          <div key={cat} className="mb-4">
            <div className="section-kicker mb-2">{cat}</div>
            <div className="bg-bg-tertiary rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-xs">
                    <th className="text-left px-4 py-2">Item</th>
                    <th className="text-right px-3 py-2">Lvl</th>
                    <th className="text-right px-3 py-2">XP</th>
                    <th className="text-right px-3 py-2">GP/XP</th>
                    <th className="text-right px-3 py-2">Actions</th>
                    <th className="text-right px-4 py-2">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item) => (
                    <tr
                      key={item.name}
                      className={`border-b border-border/50 hover:bg-bg-secondary transition-colors ${
                        !item.meetsLevel ? "opacity-40" : ""
                      }`}
                      title={item.materialCosts.join("\n")}
                    >
                      <td className="px-4 py-1.5">
                        <span className="font-medium">{item.name}</span>
                        <span className="block text-[10px] text-text-secondary/50">
                          {item.materials.map((m) => `${m.quantity}× ${m.name}`).join(", ")}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-secondary text-xs">
                        {item.levelReq}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                        {item.xp.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-secondary text-xs tabular-nums">
                        {item.gpPerXp > 0 ? item.gpPerXp.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-accent font-medium tabular-nums">
                        {item.actions.toLocaleString()}
                      </td>
                      <td className="px-4 py-1.5 text-right text-warning tabular-nums">
                        {item.totalCost > 0 ? formatGp(item.totalCost) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
