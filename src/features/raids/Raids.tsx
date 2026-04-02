import { useState } from "react";
import { COX_ROOMS, COX_UNIQUES, type RaidRoom } from "./data/cox";
import { itemIcon } from "../../lib/sprites";

type RaidTab = "cox" | "tob" | "toa";

const TYPE_COLORS: Record<string, string> = {
  combat: "border-danger/30 bg-danger/5",
  puzzle: "border-accent/30 bg-accent/5",
  boss: "border-warning/30 bg-warning/5",
};

const TYPE_LABELS: Record<string, string> = {
  combat: "Combat",
  puzzle: "Puzzle",
  boss: "Final Boss",
};

function RoomCard({
  room,
  expanded,
  onToggle,
}: {
  room: RaidRoom;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${TYPE_COLORS[room.type] ?? "border-border"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{room.name}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-secondary/50">
          {TYPE_LABELS[room.type] ?? room.type}
        </span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {room.mechanics}
      </p>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-border/20">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/40 mb-1">
            Tips
          </div>
          <p className="text-xs text-text-secondary/80 leading-relaxed">
            {room.tips}
          </p>
        </div>
      )}
    </button>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-text-secondary">
      <div className="text-lg font-medium mb-2">{label}</div>
      <p className="text-sm text-text-secondary/60">
        Room guides and loot tables coming soon.
      </p>
    </div>
  );
}

export default function Raids() {
  const [tab, setTab] = useState<RaidTab>("cox");
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-5">Raids</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { id: "cox" as const, label: "Chambers of Xeric" },
          { id: "tob" as const, label: "Theatre of Blood" },
          { id: "toa" as const, label: "Tombs of Amascut" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setExpandedRoom(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cox" && (
        <div className="space-y-6">
          {/* Rooms */}
          <div>
            <div className="section-kicker mb-3">
              Rooms ({COX_ROOMS.length})
            </div>
            <div className="grid grid-cols-1 gap-2">
              {COX_ROOMS.map((room) => (
                <RoomCard
                  key={room.name}
                  room={room}
                  expanded={expandedRoom === room.name}
                  onToggle={() =>
                    setExpandedRoom(
                      expandedRoom === room.name ? null : room.name
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* Loot */}
          <div>
            <div className="section-kicker mb-3">Unique Rewards</div>
            <p className="text-xs text-text-secondary mb-3">
              CoX uses a points-based system. Each player earns points from
              damaging bosses and completing tasks. Unique drop chance scales
              with total team points. At 30,000 personal points, each unique
              has approximately a 1/34.5 chance to appear.
            </p>
            <div className="space-y-1">
              {COX_UNIQUES.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 py-1.5 border-b border-border/15"
                >
                  <img
                    src={itemIcon(item.name)}
                    alt=""
                    className="w-5 h-5 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className="text-sm flex-1">{item.name}</span>
                  <span className="text-xs text-text-secondary tabular-nums">
                    {item.rateDescription}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "tob" && <ComingSoon label="Theatre of Blood" />}
      {tab === "toa" && <ComingSoon label="Tombs of Amascut" />}
    </div>
  );
}
