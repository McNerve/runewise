import { type ReactNode, useState, memo } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { fetchMapping, fetchLatestPrices, type ItemMapping, type ItemPrice } from "../lib/api/ge";
import { formatGp } from "../lib/format";
import { encodeIconFilename, WIKI_IMG } from "../lib/sprites";

let mappingCache: Map<string, ItemMapping> | null = null;

async function ensureData() {
  if (!mappingCache) {
    const items = await fetchMapping();
    mappingCache = new Map(items.map((i) => [i.name.toLowerCase(), i]));
  }
  const prices = await fetchLatestPrices();
  return { mapping: mappingCache, prices };
}

interface Props {
  itemName: string;
  children: ReactNode;
}

export default memo(function ItemTooltip({ itemName, children }: Props) {
  const [item, setItem] = useState<ItemMapping | null>(null);
  const [price, setPrice] = useState<ItemPrice | null>(null);
  const [loaded, setLoaded] = useState(false);

  function handleOpen(open: boolean) {
    if (!open || loaded) return;
    ensureData().then(({ mapping, prices }) => {
      const match = mapping.get(itemName.toLowerCase());
      if (match) {
        setItem(match);
        setPrice(prices[String(match.id)] ?? null);
      }
      setLoaded(true);
    });
  }

  return (
    <Tooltip.Root delayDuration={200} onOpenChange={handleOpen}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Content className="item-tooltip-content" sideOffset={6} side="top" collisionPadding={8}>
        {item ? (
          <div className="flex gap-3 items-start">
            <img
              src={`${WIKI_IMG}/${encodeIconFilename(item.icon)}`}
              alt=""
              className="w-8 h-8 shrink-0 mt-0.5"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="min-w-0">
              <div className="font-semibold text-text-primary text-xs">{item.name}</div>
              {item.examine && (
                <div className="text-[10px] text-text-secondary/60 mt-0.5 italic">{item.examine}</div>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px]">
                {price?.high != null && (
                  <span>
                    <span className="text-text-secondary/50">GE: </span>
                    <span className="text-success font-medium">{formatGp(price.high)}</span>
                  </span>
                )}
                {item.highalch != null && (
                  <span>
                    <span className="text-text-secondary/50">Alch: </span>
                    <span className="text-warning font-medium">{formatGp(item.highalch)}</span>
                  </span>
                )}
                {item.limit != null && (
                  <span>
                    <span className="text-text-secondary/50">Limit: </span>
                    <span className="text-text-primary">{item.limit.toLocaleString()}</span>
                  </span>
                )}
                {item.members && (
                  <span className="text-accent">P2P</span>
                )}
              </div>
            </div>
          </div>
        ) : loaded ? (
          <div className="text-[10px] text-text-secondary">No data for {itemName}</div>
        ) : (
          <div className="flex gap-2 items-center w-32">
            <div className="w-6 h-6 rounded bg-bg-tertiary/50 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 rounded bg-bg-tertiary/50 animate-pulse w-full" />
              <div className="h-2 rounded bg-bg-tertiary/50 animate-pulse w-2/3" />
            </div>
          </div>
        )}
        <Tooltip.Arrow className="fill-[var(--color-bg-tertiary)]" />
      </Tooltip.Content>
    </Tooltip.Root>
  );
});
