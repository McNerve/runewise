import type { ItemMapping, ItemPrice } from "../../lib/api/ge";

interface ItemDetailProps {
  item: ItemMapping;
  price?: ItemPrice;
  onClose: () => void;
}

const formatGp = (gp: number | null) => {
  if (gp == null) return "—";
  if (gp >= 1_000_000) return `${(gp / 1_000_000).toFixed(1)}M`;
  if (gp >= 1_000) return `${(gp / 1_000).toFixed(0)}K`;
  return gp.toLocaleString();
};

export default function ItemDetail({ item, price, onClose }: ItemDetailProps) {
  const margin =
    price?.high != null && price?.low != null
      ? price.high - price.low
      : null;

  const wikiUrl = `https://oldschool.runescape.wiki/w/${encodeURIComponent(item.name.replace(/ /g, "_"))}`;

  const stats: { label: string; value: string; className?: string }[] = [
    {
      label: "Buy Price",
      value: formatGp(price?.high ?? null),
      className: "text-success",
    },
    {
      label: "Sell Price",
      value: formatGp(price?.low ?? null),
      className: "text-error",
    },
    { label: "High Alch", value: formatGp(item.highalch), className: "text-warning" },
    { label: "Low Alch", value: formatGp(item.lowalch) },
    { label: "Store Value", value: formatGp(item.value) },
    { label: "Buy Limit", value: item.limit?.toLocaleString() ?? "—" },
    ...(margin != null
      ? [
          {
            label: "Margin",
            value: formatGp(margin),
            className: margin >= 0 ? "text-success" : "text-error",
          },
        ]
      : []),
  ];

  return (
    <div className="bg-bg-secondary rounded-lg p-4 sticky top-0 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-text-secondary hover:text-text-primary"
      >
        ✕
      </button>

      <div className="flex items-center gap-3 mb-4">
        <img
          src={`https://oldschool.runescape.wiki/images/${item.icon}`}
          alt={item.name}
          className="w-8 h-8"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <h3 className="text-lg font-semibold">{item.name}</h3>
        {item.members && (
          <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
            P2P
          </span>
        )}
      </div>

      <p className="text-xs text-text-secondary italic mb-4">
        {item.examine}
      </p>

      <div className="space-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between text-sm">
            <span className="text-text-secondary">{stat.label}</span>
            <span className={stat.className}>{stat.value}</span>
          </div>
        ))}
      </div>

      <a
        href={wikiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block text-center text-sm text-accent hover:underline"
      >
        View on Wiki
      </a>
    </div>
  );
}
