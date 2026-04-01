import { itemIcon } from "../../../lib/sprites";

export type EquipmentSlot = "head" | "cape" | "neck" | "ammo" | "weapon" | "body" | "shield" | "legs" | "hands" | "feet" | "ring";

export interface EquippedItem {
  name: string;
  itemId: number;
  slot: EquipmentSlot;
}

interface EquipmentGridProps {
  equipped: Partial<Record<EquipmentSlot, EquippedItem>>;
  onSlotClick: (slot: EquipmentSlot) => void;
}

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: "Head",
  cape: "Cape",
  neck: "Neck",
  ammo: "Ammo",
  weapon: "Weapon",
  body: "Body",
  shield: "Shield",
  legs: "Legs",
  hands: "Hands",
  feet: "Feet",
  ring: "Ring",
};

function Slot({
  slot,
  item,
  onClick,
}: {
  slot: EquipmentSlot;
  item?: EquippedItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={item ? item.name : SLOT_LABELS[slot]}
      className="w-10 h-10 rounded border border-border bg-bg-tertiary hover:border-accent/50 transition-colors flex items-center justify-center"
    >
      {item ? (
        <img
          src={itemIcon(item.name)}
          alt={item.name}
          className="w-7 h-7"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            if (e.currentTarget.nextElementSibling)
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
          }}
        />
      ) : null}
      <span
        className={`text-[8px] text-text-secondary/30 ${item ? "hidden" : "block"}`}
      >
        {SLOT_LABELS[slot]}
      </span>
    </button>
  );
}

export default function EquipmentGrid({ equipped, onSlotClick }: EquipmentGridProps) {
  return (
    <div className="inline-grid gap-1" style={{
      gridTemplateColumns: "repeat(4, 40px)",
      gridTemplateRows: "repeat(4, 40px)",
    }}>
      {/* Row 1: _ Head _ _ */}
      <div />
      <Slot slot="head" item={equipped.head} onClick={() => onSlotClick("head")} />
      <div />
      <div />

      {/* Row 2: Cape Neck Ammo _ */}
      <Slot slot="cape" item={equipped.cape} onClick={() => onSlotClick("cape")} />
      <Slot slot="neck" item={equipped.neck} onClick={() => onSlotClick("neck")} />
      <Slot slot="ammo" item={equipped.ammo} onClick={() => onSlotClick("ammo")} />
      <div />

      {/* Row 3: Weapon Body Shield _ */}
      <Slot slot="weapon" item={equipped.weapon} onClick={() => onSlotClick("weapon")} />
      <Slot slot="body" item={equipped.body} onClick={() => onSlotClick("body")} />
      <Slot slot="shield" item={equipped.shield} onClick={() => onSlotClick("shield")} />
      <div />

      {/* Row 4: Hands Legs Feet Ring */}
      <Slot slot="hands" item={equipped.hands} onClick={() => onSlotClick("hands")} />
      <Slot slot="legs" item={equipped.legs} onClick={() => onSlotClick("legs")} />
      <Slot slot="feet" item={equipped.feet} onClick={() => onSlotClick("feet")} />
      <Slot slot="ring" item={equipped.ring} onClick={() => onSlotClick("ring")} />
    </div>
  );
}
