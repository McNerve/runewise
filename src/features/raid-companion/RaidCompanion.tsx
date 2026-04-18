import { useState, useRef, useEffect, useCallback } from "react";
import { COX_ROOMS } from "../raids/data/cox";
import { TOB_ROOMS } from "../raids/data/tob";
import { TOA_ROOMS } from "../raids/data/toa";
import { loadJSON, saveJSON } from "../../lib/localStorage";

const RUNS_KEY = "runewise_raid_runs";

interface RaidRun {
  id: string;
  raidId: "cox" | "tob" | "toa";
  date: string;
  splits: { room: string; splitMs: number }[];
  totalMs: number;
}

const RAIDS = [
  { id: "cox" as const, label: "Chambers of Xeric", rooms: COX_ROOMS },
  { id: "tob" as const, label: "Theatre of Blood", rooms: TOB_ROOMS },
  { id: "toa" as const, label: "Tombs of Amascut", rooms: TOA_ROOMS },
];

// Wiki-approximate average times per raid (ms), room-by-room order
const WIKI_AVERAGES: Record<string, number[]> = {
  cox: [180000, 120000, 150000, 240000, 180000, 210000, 150000, 120000, 90000, 90000, 60000, 300000],
  tob: [210000, 240000, 180000, 270000, 360000],
  toa: [180000, 120000, 150000, 240000, 180000, 210000, 360000],
};

function formatTime(ms: number): string {
  if (ms < 0) return "-";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
}

function loadRuns(): RaidRun[] {
  return loadJSON<RaidRun[]>(RUNS_KEY, []);
}

function saveRuns(runs: RaidRun[]) {
  saveJSON(RUNS_KEY, runs);
}

export default function RaidCompanion() {
  const [raidId, setRaidId] = useState<"cox" | "tob" | "toa">("cox");
  const [runs, setRuns] = useState<RaidRun[]>(loadRuns);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [splits, setSplits] = useState<{ room: string; splitMs: number }[]>([]);
  const [lastSplitTime, setLastSplitTime] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const raid = RAIDS.find((r) => r.id === raidId)!;
  const rooms = raid.rooms;
  const completedRooms = splits.map((s) => s.room);
  const nextRoom = rooms.find((r) => !completedRooms.includes(r.name));

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - (startTime ?? Date.now()));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, startTime]);

  const startRun = useCallback(() => {
    const now = Date.now();
    setRunning(true);
    setStartTime(now);
    setLastSplitTime(now);
    setElapsed(0);
    setSplits([]);
  }, []);

  const recordSplit = useCallback((roomName: string) => {
    const now = Date.now();
    const splitMs = now - (lastSplitTime ?? now);
    setLastSplitTime(now);
    setSplits((prev) => [...prev, { room: roomName, splitMs }]);
  }, [lastSplitTime]);

  const saveRun = useCallback(() => {
    if (!startTime || splits.length === 0) return;
    const now = Date.now();
    const run: RaidRun = {
      id: `${now}`,
      raidId,
      date: new Date(now).toISOString(),
      splits,
      totalMs: now - startTime,
    };
    const updated = [run, ...runs].slice(0, 50); // keep last 50 runs
    setRuns(updated);
    saveRuns(updated);
    setRunning(false);
    setStartTime(null);
    setElapsed(0);
    setSplits([]);
  }, [raidId, runs, splits, startTime]);

  const discardRun = useCallback(() => {
    setRunning(false);
    setStartTime(null);
    setElapsed(0);
    setSplits([]);
  }, []);

  const deleteRun = useCallback((id: string) => {
    setRuns((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveRuns(updated);
      return updated;
    });
  }, []);

  // Compute PBs per room and overall
  const raidRuns = runs.filter((r) => r.raidId === raidId);

  const pbByRoom = rooms.reduce<Record<string, number>>((acc, room) => {
    const times = raidRuns
      .map((r) => r.splits.find((s) => s.room === room.name)?.splitMs)
      .filter((t): t is number => t != null && t > 0);
    if (times.length > 0) acc[room.name] = Math.min(...times);
    return acc;
  }, {});

  const pbTotal = raidRuns.length > 0 ? Math.min(...raidRuns.map((r) => r.totalMs)) : null;

  const wikiAvgs = WIKI_AVERAGES[raidId] ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Raid Companion</h2>
        <p className="text-sm text-text-secondary mt-1">Log split times room-by-room and track your PBs.</p>
      </div>

      {/* Raid selector */}
      <div className="flex gap-2 flex-wrap">
        {RAIDS.map((r) => (
          <button
            key={r.id}
            onClick={() => { if (!running) setRaidId(r.id); }}
            disabled={running && raidId !== r.id}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
              raidId === r.id
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70 disabled:opacity-40"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Timer + controls */}
      <div className="bg-bg-tertiary rounded-xl p-4 flex items-center gap-4 flex-wrap">
        <div className="tabular-nums text-3xl font-bold text-text-primary min-w-[100px]">
          {formatTime(running ? elapsed : 0)}
        </div>
        {!running ? (
          <button
            onClick={startRun}
            className="bg-success/80 hover:bg-success text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Start Run
          </button>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {nextRoom && (
              <button
                onClick={() => recordSplit(nextRoom.name)}
                className="bg-accent hover:bg-accent-hover text-on-accent px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Split: {nextRoom.name}
              </button>
            )}
            {splits.length === rooms.length && (
              <button
                onClick={saveRun}
                className="bg-success/80 hover:bg-success text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Save Run
              </button>
            )}
            {splits.length > 0 && splits.length < rooms.length && (
              <button
                onClick={saveRun}
                className="border border-border text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Save Partial
              </button>
            )}
            <button
              onClick={discardRun}
              className="bg-danger/15 text-danger hover:bg-danger/25 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Discard
            </button>
          </div>
        )}
        {pbTotal && (
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Overall PB</div>
            <div className="text-lg font-bold text-warning">{formatTime(pbTotal)}</div>
          </div>
        )}
      </div>

      {/* Live splits */}
      {running && splits.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-2">Current Run</div>
          <div className="space-y-1">
            {splits.map(({ room, splitMs }) => (
              <div key={room} className="flex items-center justify-between text-sm bg-bg-tertiary/60 rounded px-3 py-1.5">
                <span className="text-text-primary">{room}</span>
                <span className="text-success tabular-nums">{formatTime(splitMs)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room PB table */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-2">
          Room Times ({raidRuns.length} run{raidRuns.length !== 1 ? "s" : ""})
        </div>
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="px-4 py-2 text-left">Room</th>
                <th className="px-4 py-2 text-right">Your PB</th>
                <th className="px-4 py-2 text-right">Wiki Avg</th>
                <th className="px-4 py-2 text-right">vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, i) => {
                const pb = pbByRoom[room.name];
                const avg = wikiAvgs[i];
                const diff = pb != null && avg != null ? pb - avg : null;
                return (
                  <tr key={room.name} className="border-b border-border/40 even:bg-bg-primary/20">
                    <td className="px-4 py-2 font-medium">{room.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-text-secondary">
                      {pb != null ? formatTime(pb) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-text-secondary/60">
                      {avg != null ? formatTime(avg) : "—"}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums text-xs ${diff == null ? "" : diff <= 0 ? "text-success" : "text-danger"}`}>
                      {diff == null ? "—" : `${diff > 0 ? "+" : ""}${formatTime(Math.abs(diff))}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent runs */}
      {raidRuns.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-2">Recent Runs</div>
          <div className="space-y-2">
            {raidRuns.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center justify-between bg-bg-tertiary/60 rounded-lg px-4 py-2.5">
                <div>
                  <span className="text-sm tabular-nums font-semibold">{formatTime(run.totalMs)}</span>
                  <span className="ml-3 text-xs text-text-secondary/60">
                    {new Date(run.date).toLocaleDateString()} · {run.splits.length}/{rooms.length} rooms
                  </span>
                </div>
                <button
                  onClick={() => deleteRun(run.id)}
                  className="text-text-secondary/40 hover:text-danger text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {raidRuns.length === 0 && !running && (
        <div className="py-8 text-center text-text-secondary/50 text-sm">
          No runs recorded yet. Hit "Start Run" to begin tracking.
        </div>
      )}
    </div>
  );
}
