import { useState, useMemo } from "react";
import { itemIcon } from "../../../lib/sprites";
import type { EquipmentSlot, EquippedItem } from "./EquipmentGrid";

interface GearItem {
  name: string;
  itemId: number;
  slot: EquipmentSlot;
}

interface GearSelectorProps {
  slot: EquipmentSlot;
  items: GearItem[];
  onSelect: (item: EquippedItem | null) => void;
  onClose: () => void;
}

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: "Head", cape: "Cape", neck: "Neck", ammo: "Ammo",
  weapon: "Weapon", body: "Body", shield: "Shield", legs: "Legs",
  hands: "Hands", feet: "Feet", ring: "Ring",
};

export default function GearSelector({ slot, items, onSelect, onClose }: GearSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const slotItems = items.filter((i) => i.slot === slot);
    if (!query.trim()) return slotItems;
    const q = query.toLowerCase();
    return slotItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, slot, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-bg-secondary rounded-xl border border-border shadow-2xl w-80 max-h-[60vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border">
          <div className="text-xs text-text-secondary mb-2">
            Select {SLOT_LABELS[slot]}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gear..."
            className="w-full bg-bg-tertiary border border-border rounded px-3 py-1.5 text-sm"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => onSelect(null)}
            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            (Empty)
          </button>
          {filtered.map((item) => (
            <button
              key={item.itemId}
              onClick={() => onSelect({ name: item.name, itemId: item.itemId, slot: item.slot })}
              className="w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary transition-colors flex items-center gap-2"
            >
              <img
                src={itemIcon(item.name)}
                alt=""
                className="w-5 h-5 shrink-0"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-sm text-text-secondary/50 text-center">
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
