import { useState } from "react";
import { COX_ROOMS, COX_UNIQUES, type RaidRoom } from "./data/cox";
import { TOB_ROOMS, TOB_UNIQUES } from "./data/tob";
import { TOA_ROOMS, TOA_UNIQUES } from "./data/toa";
import { itemIcon } from "../../lib/sprites";
import RaidLootCalc from "./components/RaidLootCalc";

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

import type { RaidUnique } from "./data/cox";

function RaidContent({
  rooms,
  uniques,
  lootDescription,
  expandedRoom,
  onToggleRoom,
}: {
  rooms: RaidRoom[];
  uniques: RaidUnique[];
  lootDescription: string;
  expandedRoom: string | null;
  onToggleRoom: (name: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="section-kicker mb-3">Rooms ({rooms.length})</div>
        <div className="grid grid-cols-1 gap-2">
          {rooms.map((room) => (
            <RoomCard
              key={room.name}
              room={room}
              expanded={expandedRoom === room.name}
              onToggle={() => onToggleRoom(room.name)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="section-kicker mb-3">Unique Rewards</div>
        <p className="text-xs text-text-secondary mb-3">{lootDescription}</p>
        <div className="space-y-1">
          {uniques.map((item) => (
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
        <>
          <RaidContent
            rooms={COX_ROOMS}
            uniques={COX_UNIQUES}
            lootDescription="CoX uses a points-based system. Each player earns points from damaging bosses and completing tasks. Unique drop chance scales with total team points. At 30,000 personal points, each unique has approximately a 1/34.5 chance to appear."
            expandedRoom={expandedRoom}
            onToggleRoom={(name) => setExpandedRoom(expandedRoom === name ? null : name)}
          />
          <RaidLootCalc
            uniques={COX_UNIQUES}
            raidName="raid"
            inputLabel="Personal points"
            inputDefault={30000}
            inputDescription="Points earned per raid"
            calculateRate={(points) => Math.max(1, 867500 / points)}
          />
        </>
      )}

      {tab === "tob" && (
        <>
          <RaidContent
            rooms={TOB_ROOMS}
            uniques={TOB_UNIQUES}
            lootDescription="ToB uses an MVP-based reward system. The player who deals the most damage across all rooms receives a weighted chance at unique drops. Each completion has approximately a 1/86 chance for a unique."
            expandedRoom={expandedRoom}
            onToggleRoom={(name) => setExpandedRoom(expandedRoom === name ? null : name)}
          />
          <RaidLootCalc
            uniques={TOB_UNIQUES}
            raidName="raid"
            inputLabel="Team size"
            inputDefault={4}
            inputDescription="Players in team"
            calculateRate={(teamSize) => 86 * Math.max(1, teamSize)}
          />
        </>
      )}
      {tab === "toa" && (
        <>
          <RaidContent
            rooms={TOA_ROOMS}
            uniques={TOA_UNIQUES}
            lootDescription="ToA uses an invocation-based system. Higher invocation levels increase difficulty and unique drop rates. At 150 invocations, each unique has approximately a 1/48 chance. Expert mode (300+) significantly improves rates."
            expandedRoom={expandedRoom}
            onToggleRoom={(name) => setExpandedRoom(expandedRoom === name ? null : name)}
          />
          <RaidLootCalc
            uniques={TOA_UNIQUES}
            raidName="raid"
            inputLabel="Invocation level"
            inputDefault={150}
            inputDescription="Higher = better rates"
            calculateRate={(invocation) => Math.max(1, 48 * (150 / Math.max(1, invocation)))}
          />
        </>
      )}
    </div>
  );
}
