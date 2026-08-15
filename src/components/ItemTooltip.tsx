import { type ReactNode, useState, memo } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { fetchMapping, fetchLatestPrices, type ItemMapping, type ItemPrice } from "../lib/api/ge";
import { fetchWikiSummary, type WikiPageSummary } from "../lib/wiki/lookup";
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
  const [wiki, setWiki] = useState<WikiPageSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  function handleOpen(open: boolean) {
    if (!open || loaded) return;
    Promise.all([
      ensureData(),
      fetchWikiSummary(itemName).catch(() => null),
    ]).then(([{ mapping, prices }, summary]) => {
      const match = mapping.get(itemName.toLowerCase());
      if (match) {
        setItem(match);
        setPrice(prices[String(match.id)] ?? null);
      }
      if (summary) setWiki(summary);
      setLoaded(true);
    });
  }

  return (
    <Tooltip.Root delayDuration={200} onOpenChange={handleOpen}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Content
        className="item-tooltip-content"
        sideOffset={8}
        side="top"
        collisionPadding={8}
        style={{ transformOrigin: "var(--radix-tooltip-content-transform-origin)" }}
      >
        {item || wiki ? (
          <div className="wiki-hover-card-inner">
            {(wiki?.image || item) && (
              <img
                src={
                  wiki?.image ??
                  `${WIKI_IMG}/${encodeIconFilename(item?.icon ?? `${itemName}.png`)}`
                }
                alt=""
                className="wiki-hover-card-img"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div className="wiki-hover-card-body">
              <div className="wiki-hover-card-title">{item?.name ?? wiki?.title ?? itemName}</div>
              {(wiki?.summary || item?.examine) && (
                <p className="wiki-hover-card-extract">
                  {wiki?.summary ?? item?.examine}
                </p>
              )}
              <div className="wiki-hover-card-facts">
                {price?.high != null && <span>GE {formatGp(price.high)}</span>}
                {item?.highalch != null && <span>Alch {formatGp(item.highalch)}</span>}
                {item?.limit != null && <span>Limit {item.limit.toLocaleString()}</span>}
                {item?.members && <span>Members</span>}
                {!item &&
                  wiki?.fields.slice(0, 3).map((f) => (
                    <span key={f.label}>
                      {f.label} {f.value}
                    </span>
                  ))}
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
