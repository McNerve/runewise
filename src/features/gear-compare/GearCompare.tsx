import { useState, useEffect, useMemo } from "react";
import {
  fetchAllEquipment,
  searchEquipment,
  type WikiEquipment,
  type EquipmentSlot,
} from "../../lib/api/equipment";
import { itemIcon } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";

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
  return (
    <td
      className={`px-2 py-1.5 text-right tabular-nums text-xs ${
        value > 0
          ? "text-success"
          : value < 0
            ? "text-danger"
            : "text-text-secondary/40"
      }`}
    >
      {value > 0 ? `+${value}` : value === 0 ? "0" : String(value)}
    </td>
  );
}

export default function GearCompare() {
  const { navigate } = useNavigation();
  const [allEquipment, setAllEquipment] = useState<WikiEquipment[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>("weapon");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("strengthBonus");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<WikiEquipment[]>([]);

  useEffect(() => {
    fetchAllEquipment().then(setAllEquipment);
  }, []);

  const filtered = useMemo(() => {
    const results = searchEquipment(allEquipment, query, selectedSlot, 200);
    return results.sort((a, b) => {
      const aVal = a[sortKey] as number;
      const bVal = b[sortKey] as number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [allEquipment, query, selectedSlot, sortKey, sortAsc]);

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
      <h2 className="text-xl font-semibold mb-5">Gear Compare</h2>

      {/* Slot selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            onClick={() => {
              setSelectedSlot(slot);
              setQuery("");
            }}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              selectedSlot === slot
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-bg-secondary text-text-secondary border border-transparent hover:border-border"
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
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm mb-4"
      />

      {/* Comparison strip */}
      {selected.length > 0 && (
        <div className="mb-4">
          <div className="section-kicker mb-2">
            Comparing {selected.length} item{selected.length !== 1 ? "s" : ""}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {selected.map((item, i) => (
              <div key={`${item.name}-${i}`} className="bg-bg-secondary rounded-lg p-3 relative">
                <button
                  onClick={() => setSelected((prev) => prev.filter((_, j) => j !== i))}
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
                  <span className="text-sm font-medium truncate">{item.name}</span>
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
      {allEquipment.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          Loading equipment data...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          No {SLOT_LABELS[selectedSlot].toLowerCase()} items found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-xs text-text-secondary font-normal w-8" />
                <th
                  className="px-2 py-2 text-xs text-text-secondary font-normal cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort("name")}
                >
                  Item {sortKey === "name" && (sortAsc ? "↑" : "↓")}
                </th>
                {STAT_COLUMNS.map((col) => (
                  <th
                    key={col.key}
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
              {filtered.map((item) => {
                const isSelected = selected.some(
                  (s) => s.name === item.name && s.version === item.version
                );
                return (
                  <tr
                    key={`${item.name}:${item.version ?? ""}`}
                    onClick={() => toggleSelected(item)}
                    className={`border-b border-border/30 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-accent/8"
                        : "hover:bg-bg-secondary/50"
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      <img
                        src={itemIcon(item.name)}
                        alt=""
                        className="w-5 h-5"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-sm">
                      {item.name}
                      {item.version && (
                        <span className="text-text-secondary/50 ml-1 text-xs">
                          ({item.version})
                        </span>
                      )}
                    </td>
                    {STAT_COLUMNS.map((col) => (
                      <StatCell key={col.key} value={item[col.key] as number} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="text-xs text-text-secondary/40 mt-2 text-right">
            {filtered.length} items · Click rows to compare (max 3)
          </div>
        </div>
      )}
    </div>
  );
}
