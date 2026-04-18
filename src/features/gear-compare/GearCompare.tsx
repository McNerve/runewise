import { useState, useMemo } from "react";
import {
  fetchAllEquipment,
  searchEquipment,
  type WikiEquipment,
  type EquipmentSlot,
} from "../../lib/api/equipment";
import { itemIcon, NAV_ICONS } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import ItemTooltip from "../../components/ItemTooltip";
import { useAsyncData } from "../../hooks/useAsyncData";

const SLOTS: EquipmentSlot[] = [
  "head", "cape", "neck", "ammo", "weapon", "2h", "shield",
  "body", "legs", "hands", "feet", "ring",
];

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: "Head", cape: "Cape", neck: "Neck", ammo: "Ammo",
  weapon: "Weapon", "2h": "2-Handed", shield: "Shield",
  body: "Body", legs: "Legs", hands: "Hands", feet: "Feet", ring: "Ring",
};

type SortKey = "name" | "attackStab" | "attackSlash" | "attackCrush" | "attackMagic" | "attackRanged" |
  "defenceStab" | "defenceSlash" | "defenceCrush" | "defenceMagic" | "defenceRanged" |
  "strengthBonus" | "rangedStrength" | "magicDamage" | "prayerBonus";

const STAT_COLUMNS: { key: SortKey; label: string; short: string }[] = [
  { key: "attackStab", label: "Stab Atk", short: "Stab" },
  { key: "attackSlash", label: "Slash Atk", short: "Slash" },
  { key: "attackCrush", label: "Crush Atk", short: "Crush" },
  { key: "attackMagic", label: "Magic Atk", short: "Mag" },
  { key: "attackRanged", label: "Ranged Atk", short: "Rng" },
  { key: "strengthBonus", label: "Melee Str", short: "Str" },
  { key: "rangedStrength", label: "Ranged Str", short: "RStr" },
  { key: "magicDamage", label: "Magic Dmg", short: "MDmg" },
  { key: "prayerBonus", label: "Prayer", short: "Pray" },
];

function StatCell({ value }: { value: number }) {
  if (value === 0) {
    return (
      <td className="px-2 py-1.5 text-right tabular-nums text-xs">
        <span className="text-text-secondary/30">&mdash;</span>
      </td>
    );
  }
  return (
    <td
      className={`px-2 py-1.5 text-right tabular-nums text-xs ${
        value > 0 ? "text-success" : "text-danger"
      }`}
    >
      {value > 0 ? `+${value}` : String(value)}
    </td>
  );
}

/** Collapse crystal weapon colour variants — detect by name suffix matching known clans */
const CRYSTAL_VARIANT_RE = /\s*\((Iorwerth|Trahaearn|Cadarn|Crwys|Meilyr|Amlodd|Ithell)\)$/i;

function statKey(item: WikiEquipment): string {
  return STAT_COLUMNS.map((c) => item[c.key]).join(",");
}

interface CollapsedRow {
  primary: WikiEquipment;
  variants: WikiEquipment[];
}

function collapseVariants(items: WikiEquipment[]): CollapsedRow[] {
  const rows: CollapsedRow[] = [];
  const consumed = new Set<string>();

  for (const item of items) {
    const key = `${item.name}:${item.version ?? ""}`;
    if (consumed.has(key)) continue;

    // Is this a crystal variant?
    const variantMatch = item.name.match(CRYSTAL_VARIANT_RE);
    if (variantMatch) {
      // Find the canonical name (no clan suffix)
      const baseName = item.name.replace(CRYSTAL_VARIANT_RE, "").trim();
      const baseKey = statKey(item);
      // Group all matching variants (same stat vector)
      const siblings = items.filter((other) => {
        const otherBase = other.name.replace(CRYSTAL_VARIANT_RE, "").trim();
        return otherBase === baseName && statKey(other) === baseKey;
      });
      if (siblings.length > 1) {
        siblings.forEach((s) => consumed.add(`${s.name}:${s.version ?? ""}`));
        // Use the Iorwerth (first alphabetically) as primary, or the base name item
        const primary = siblings[0];
        const rest = siblings.slice(1);
        rows.push({ primary: { ...primary, name: baseName }, variants: rest });
        continue;
      }
    }

    consumed.add(key);
    rows.push({ primary: item, variants: [] });
  }
  return rows;
}

export default function GearCompare() {
  const { navigate } = useNavigation();
  const { data, loading, error, retry } = useAsyncData(fetchAllEquipment, []);
  const allEquipment = useMemo(() => data ?? [], [data]);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>("weapon");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("strengthBonus");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<WikiEquipment[]>([]);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return searchEquipment(allEquipment, query, selectedSlot, 500)
      .sort((a, b) => {
        const aVal = a[sortKey] as number;
        const bVal = b[sortKey] as number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        return 0;
      })
      .slice(0, 100);
  }, [allEquipment, query, selectedSlot, sortKey, sortAsc]);

  const collapsedRows = useMemo(() => collapseVariants(filtered), [filtered]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function toggleSelected(item: WikiEquipment) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.name === item.name && s.version === item.version);
      if (exists) return prev.filter((s) => s !== exists);
      if (prev.length >= 3) return [...prev.slice(1), item];
      return [...prev, item];
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Gear Compare</h2>
      <p className="text-sm text-text-secondary mb-5">Compare equipment stats side by side. Browse by slot and sort by any stat.</p>

      {/* Slot selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            onClick={() => {
              setSelectedSlot(slot);
              setQuery("");
            }}
            aria-pressed={selectedSlot === slot}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              selectedSlot === slot
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-bg-tertiary text-text-secondary border border-transparent hover:border-border"
            }`}
          >
            {SLOT_LABELS[slot]}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${SLOT_LABELS[selectedSlot].toLowerCase()} items...`}
        aria-label={`Search ${SLOT_LABELS[selectedSlot].toLowerCase()} items`}
        className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors mb-4"
      />

      {/* Comparison strip */}
      {selected.length > 0 && (
        <div className="mb-4">
          <div className="section-kicker mb-2">
            Comparing {selected.length} item{selected.length !== 1 ? "s" : ""}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {selected.map((item, i) => (
              <div key={`${item.name}-${i}`} className="bg-bg-tertiary rounded-lg p-3 relative">
                <button
                  onClick={() => setSelected((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove ${item.name} from comparison`}
                  className="absolute top-1.5 right-1.5 text-text-secondary/40 hover:text-text-primary text-xs"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={itemIcon(item.name)}
                    alt=""
                    className="w-6 h-6"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <ItemTooltip itemName={item.name}><span className="text-sm font-medium truncate cursor-default">{item.name}</span></ItemTooltip>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {STAT_COLUMNS.map((col) => {
                    const val = item[col.key] as number;
                    if (val === 0) return null;
                    return (
                      <div key={col.key} className="flex justify-between">
                        <span className="text-text-secondary">{col.short}</span>
                        <span className={val > 0 ? "text-success" : "text-danger"}>
                          {val > 0 ? `+${val}` : val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("dps-calc")}
            className="mt-2 text-xs text-accent hover:underline"
          >
            Test in DPS Calculator →
          </button>
        </div>
      )}

      {/* Items table */}
      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : loading ? (
        <EmptyState
          icon={NAV_ICONS["gear-compare"]}
          title="Loading equipment data..."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={NAV_ICONS["gear-compare"]}
          title={`No ${SLOT_LABELS[selectedSlot].toLowerCase()} items found`}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky-thead">
              <tr className="border-b border-border">
                <th scope="col" className="px-2 py-2 text-xs text-text-secondary font-normal w-8" />
                <th
                  scope="col"
                  className="px-2 py-2 text-xs text-text-secondary font-normal cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("name")}
                >
                  Item {sortKey === "name" && (sortAsc ? "↑" : "↓")}
                </th>
                {STAT_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-2 py-2 text-xs text-text-secondary font-normal text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort(col.key)}
                    title={col.label}
                  >
                    {col.short} {sortKey === col.key && (sortAsc ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {collapsedRows.map(({ primary, variants }) => {
                const isSelected = selected.some(
                  (s) => s.name === primary.name && s.version === primary.version
                );
                const hasVariants = variants.length > 0;
                const variantKey = primary.name;
                const isExpanded = expandedVariant === variantKey;
                return (
                  <>
                  <tr
                    key={`${primary.name}:${primary.version ?? ""}`}
                    onClick={() => toggleSelected(primary)}
                    className={`border-b border-border/30 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-accent/8"
                        : "even:bg-bg-primary/20 hover:bg-bg-secondary/50"
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      <img
                        src={itemIcon(primary.name)}
                        alt=""
                        className="w-5 h-5"
                        onError={(e) => {
                          const el = e.currentTarget;
                          const detail = itemIcon(`${primary.name} detail`);
                          if (el.src !== detail) el.src = detail;
                          else el.style.display = "none";
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <ItemTooltip itemName={primary.name}><span className="cursor-default">{primary.name}</span></ItemTooltip>
                        {hasVariants && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setExpandedVariant(isExpanded ? null : variantKey); }}
                            className="text-[10px] text-accent/70 hover:text-accent border border-accent/20 rounded px-1 py-0.5 transition-colors"
                            title={isExpanded ? "Hide variants" : `+${variants.length} colour variant${variants.length > 1 ? "s" : ""}`}
                          >
                            {isExpanded ? "▲" : `+${variants.length} variants`}
                          </button>
                        )}
                      </div>
                    </td>
                    {STAT_COLUMNS.map((col) => (
                      <StatCell key={col.key} value={primary[col.key] as number} />
                    ))}
                  </tr>
                  {hasVariants && isExpanded && variants.map((v) => (
                    <tr
                      key={`variant:${v.name}:${v.version ?? ""}`}
                      onClick={() => toggleSelected(v)}
                      className="border-b border-border/20 cursor-pointer bg-bg-primary/10 hover:bg-bg-secondary/40 transition-colors"
                    >
                      <td className="px-2 py-1 pl-4">
                        <img src={itemIcon(v.name)} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      </td>
                      <td className="px-2 py-1 text-xs text-text-secondary pl-4">
                        <ItemTooltip itemName={v.name}><span className="cursor-default">{v.name}</span></ItemTooltip>
                      </td>
                      {STAT_COLUMNS.map((col) => (
                        <StatCell key={col.key} value={v[col.key] as number} />
                      ))}
                    </tr>
                  ))}
                  </>
                );
              })}
            </tbody>
          </table>
          <div className="text-xs text-text-secondary/40 mt-2 text-right">
            {collapsedRows.length} item{collapsedRows.length !== filtered.length ? ` (${filtered.length} total, variants collapsed)` : ""} · Click rows to compare (max 3)
          </div>
        </div>
      )}
    </div>
  );
}
