import { useState } from "react";
import { COX_ROOMS, COX_UNIQUES, type RaidRoom } from "./data/cox";
import { TOB_ROOMS, TOB_UNIQUES } from "./data/tob";
import { TOA_ROOMS, TOA_UNIQUES } from "./data/toa";
import { itemIcon } from "../../lib/sprites";
import RaidLootCalc from "./components/RaidLootCalc";
import { useNavigation } from "../../lib/NavigationContext";

type RaidTab = "cox" | "tob" | "toa";

const TYPE_COLORS: Record<string, string> = {
  combat: "border-danger/30 bg-danger/5",
  puzzle: "border-accent/30 bg-accent/5",
  boss: "border-warning/30 bg-warning/5",
};

const TYPE_BADGE: Record<string, string> = {
  combat: "bg-danger/15 text-danger",
  puzzle: "bg-accent/15 text-accent",
  boss: "bg-warning/15 text-warning",
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
      className={`w-full text-left rounded-lg border p-4 transition-colors ${TYPE_COLORS[room.type] ?? "border-border"} hover:brightness-110`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-semibold">{room.name}</span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide shrink-0 ${TYPE_BADGE[room.type] ?? "bg-bg-tertiary text-text-secondary"}`}>
          {TYPE_LABELS[room.type] ?? room.type}
        </span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {room.mechanics}
      </p>
      <div
        className={`overflow-hidden transition-all duration-200 ${expanded ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"}`}
      >
        <div className="pt-3 border-t border-border/20">
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-1.5 font-semibold">
            Tips
          </div>
          <p className="text-xs text-text-secondary/85 leading-relaxed">
            {room.tips}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end mt-2">
        <span className="text-[10px] text-text-secondary/40">
          {expanded ? "▲ collapse" : "▼ tips"}
        </span>
      </div>
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
  onNavigateMarket,
}: {
  rooms: RaidRoom[];
  uniques: RaidUnique[];
  lootDescription: string;
  expandedRoom: string | null;
  onToggleRoom: (name: string) => void;
  onNavigateMarket: (name: string) => void;
}) {
  const combatRooms = rooms.filter((r) => r.type === "combat");
  const puzzleRooms = rooms.filter((r) => r.type === "puzzle");
  const bossRooms = rooms.filter((r) => r.type === "boss");

  const sections = [
    { label: "Combat", color: "text-danger", rooms: combatRooms },
    { label: "Puzzle", color: "text-accent", rooms: puzzleRooms },
    { label: "Final Boss", color: "text-warning", rooms: bossRooms },
  ].filter((s) => s.rooms.length > 0);

  return (
    <div className="space-y-6">
      {sections.map(({ label, color, rooms: sectionRooms }) => (
        <div key={label}>
          <div className={`section-kicker mb-3 ${color}`}>
            {label} ({sectionRooms.length})
          </div>
          <div className="grid grid-cols-1 gap-2">
            {sectionRooms.map((room) => (
              <RoomCard
                key={room.name}
                room={room}
                expanded={expandedRoom === room.name}
                onToggle={() => onToggleRoom(room.name)}
              />
            ))}
          </div>
        </div>
      ))}

      <div>
        <div className="section-kicker mb-2">Unique Rewards</div>
        <p className="text-xs text-text-secondary mb-3">{lootDescription}</p>
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th scope="col" className="px-4 py-2 text-left">Item</th>
                <th scope="col" className="px-4 py-2 text-right">Drop Rate</th>
              </tr>
            </thead>
            <tbody>
              {uniques.map((item) => (
                <tr key={item.name} className="border-b border-border/50 even:bg-bg-primary/25">
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onNavigateMarket(item.name)}
                      className="flex items-center gap-2.5 text-left text-text-primary transition hover:text-accent"
                    >
                      <img
                        src={itemIcon(item.name)}
                        alt=""
                        className="w-6 h-6 shrink-0 object-contain"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right text-text-secondary tabular-nums">
                    {item.rateDescription}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const RAID_TABS = [
  { id: "cox" as const, label: "Chambers of Xeric", short: "CoX", rooms: COX_ROOMS },
  { id: "tob" as const, label: "Theatre of Blood", short: "ToB", rooms: TOB_ROOMS },
  { id: "toa" as const, label: "Tombs of Amascut", short: "ToA", rooms: TOA_ROOMS },
];

export default function Raids() {
  const { navigate } = useNavigation();
  const [tab, setTab] = useState<RaidTab>("cox");
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const activeRaid = RAID_TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Raid Guides</h2>
            <p className="max-w-2xl text-sm text-text-secondary">
              Quick reference for raid rooms, mechanics, and loot. Click any room for tips.
              For full strategies, gear setups, and wiki content, use{" "}
              <button
                type="button"
                onClick={() => navigate("bosses", { boss: activeRaid.label })}
                className="text-accent hover:underline"
              >
                Boss Guides
              </button>.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-secondary/60">
            {activeRaid.rooms.length} rooms — {activeRaid.rooms.filter((r) => r.type === "combat").length} combat, {activeRaid.rooms.filter((r) => r.type === "puzzle").length} puzzle, {activeRaid.rooms.filter((r) => r.type === "boss").length} boss
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {RAID_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setExpandedRoom(null); }}
            aria-pressed={tab === t.id}
            className={`relative rounded-xl border px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
            }`}
          >
            {tab === t.id && (
              <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
            )}
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
            onNavigateMarket={(name) => navigate("market", { query: name })}
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
            onNavigateMarket={(name) => navigate("market", { query: name })}
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
            onNavigateMarket={(name) => navigate("market", { query: name })}
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
