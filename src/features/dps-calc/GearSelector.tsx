import { useState, useEffect, useMemo } from "react";
import {
  fetchAllEquipment,
  searchEquipment,
  type WikiEquipment,
  type EquipmentSlot,
} from "../../lib/api/equipment";
import { itemIcon } from "../../lib/sprites";
import ItemTooltip from "../../components/ItemTooltip";

interface Props {
  slot: EquipmentSlot | "2h";
  onSelect: (item: WikiEquipment | null) => void;
  onClose: () => void;
}

export default function GearSelector({ slot, onSelect, onClose }: Props) {
  const [allEquipment, setAllEquipment] = useState<WikiEquipment[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEquipment().then((eq) => {
      setAllEquipment(eq);
      setLoading(false);
    });
  }, []);

  const results = useMemo(() => {
    if (slot === "weapon") {
      // For weapon slot, search both "weapon" and "2h" items
      const weapons = searchEquipment(allEquipment, query, "weapon" as EquipmentSlot, 40);
      const twoHanders = searchEquipment(allEquipment, query, "2h" as EquipmentSlot, 40);
      const combined = [...weapons, ...twoHanders];
      if (query.trim()) return combined.slice(0, 40);
      return combined.sort((a, b) => (b.strengthBonus + b.rangedStrength) - (a.strengthBonus + a.rangedStrength)).slice(0, 40);
    }
    return searchEquipment(allEquipment, query, slot as EquipmentSlot, 40);
  }, [allEquipment, query, slot]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold capitalize">
            Select {slot === "2h" ? "2-Handed" : slot}
          </span>
          <button
            onClick={onClose}
            aria-label="Close gear selector"
            className="text-text-secondary hover:text-text-primary transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-2 border-b border-border">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search equipment..."
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="space-y-2 px-4 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-bg-tertiary/50 animate-pulse" />
                  <div className="flex-1 h-4 rounded bg-bg-tertiary/50 animate-pulse" />
                </div>
              ))}
            </div>
          )}
          {!loading && (
            <>
              <button
                onClick={() => onSelect(null)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-secondary text-sm text-text-secondary transition-colors border-b border-border/30"
              >
                <span className="w-6 h-6 flex items-center justify-center text-xs text-text-secondary/50">—</span>
                Unequip slot
              </button>
              {results.map((item) => (
                <button
                  key={`${item.name}:${item.version ?? ""}`}
                  onClick={() => onSelect(item)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-secondary transition-colors"
                >
                  <img
                    src={itemIcon(item.version ? `${item.name}_${item.version}` : item.name)}
                    alt=""
                    className="w-6 h-6 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = itemIcon(item.name);
                    }}
                  />
                  <div className="flex-1 text-left min-w-0">
                    <ItemTooltip itemName={item.name}>
                      <div className="text-sm truncate cursor-default">
                        {item.name}
                        {item.version && (
                          <span className="text-text-secondary/50 ml-1 text-xs">({item.version})</span>
                        )}
                      </div>
                    </ItemTooltip>
                    <div className="text-[10px] text-text-secondary/60 tabular-nums">
                      {item.attackStab !== 0 && `Stab ${item.attackStab > 0 ? "+" : ""}${item.attackStab} `}
                      {item.attackSlash !== 0 && `Slash ${item.attackSlash > 0 ? "+" : ""}${item.attackSlash} `}
                      {item.attackCrush !== 0 && `Crush ${item.attackCrush > 0 ? "+" : ""}${item.attackCrush} `}
                      {item.strengthBonus !== 0 && `Str ${item.strengthBonus > 0 ? "+" : ""}${item.strengthBonus} `}
                      {item.attackRanged !== 0 && `Rng ${item.attackRanged > 0 ? "+" : ""}${item.attackRanged} `}
                      {item.rangedStrength !== 0 && `RStr ${item.rangedStrength > 0 ? "+" : ""}${item.rangedStrength} `}
                      {item.attackMagic !== 0 && `Mag ${item.attackMagic > 0 ? "+" : ""}${item.attackMagic} `}
                      {item.magicDamage !== 0 && `MDmg ${item.magicDamage > 0 ? "+" : ""}${item.magicDamage}% `}
                      {item.prayerBonus !== 0 && `Pray ${item.prayerBonus > 0 ? "+" : ""}${item.prayerBonus}`}
                    </div>
                  </div>
                </button>
              ))}
              {results.length === 0 && !loading && (
                <div className="py-8 text-center text-sm text-text-secondary">No items found.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
