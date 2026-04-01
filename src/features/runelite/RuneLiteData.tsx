import { useState, useEffect, useMemo } from "react";
import { isTauri } from "../../lib/env";
import {
  checkRuneLiteExists,
  readProfiles,
  readLootTracker,
  type RuneLiteProfile,
  type LootEntry,
} from "../../lib/runelite/reader";
import { formatGp } from "../../lib/format";

type Status = "checking" | "not-desktop" | "not-found" | "found";

interface AggregatedBoss {
  name: string;
  totalKills: number;
  totalValue: number;
}

export default function RuneLiteData() {
  const [status, setStatus] = useState<Status>(() =>
    isTauri ? "checking" : "not-desktop"
  );
  const [profiles, setProfiles] = useState<RuneLiteProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [lootEntries, setLootEntries] = useState<LootEntry[]>([]);
  const [lootLoading, setLootLoading] = useState(false);
  const [tab, setTab] = useState<"loot" | "info">("loot");

  useEffect(() => {
    if (!isTauri) return;
    checkRuneLiteExists()
      .then(async (exists) => {
        if (exists) {
          setStatus("found");
          const p = await readProfiles();
          setProfiles(p);
          if (p.length > 0) setSelectedProfile(p[0].id);
        } else {
          setStatus("not-found");
        }
      })
      .catch(() => setStatus("not-found"));
  }, []);

  useEffect(() => {
    if (!selectedProfile || status !== "found") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setLootLoading(true);
    readLootTracker(selectedProfile)
      .then(setLootEntries)
      .finally(() => setLootLoading(false));
  }, [selectedProfile, status]);

  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedBoss>();
    for (const entry of lootEntries) {
      const existing = map.get(entry.name);
      const entryValue = entry.drops.reduce(
        (sum, d) => sum + d.price * d.quantity,
        0
      );
      if (existing) {
        existing.totalKills += entry.kills;
        existing.totalValue += entryValue;
      } else {
        map.set(entry.name, {
          name: entry.name,
          totalKills: entry.kills,
          totalValue: entryValue,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => b.totalValue - a.totalValue
    );
  }, [lootEntries]);

  const totalGp = aggregated.reduce((s, b) => s + b.totalValue, 0);
  const totalKills = aggregated.reduce((s, b) => s + b.totalKills, 0);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">RuneLite Integration</h2>

      {status === "checking" && (
        <div className="bg-bg-secondary rounded-lg p-6 text-center">
          <p className="text-sm text-text-secondary animate-pulse">
            Checking for RuneLite...
          </p>
        </div>
      )}

      {status === "not-desktop" && (
        <div className="bg-bg-secondary rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-2">Desktop Only</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            RuneLite integration reads local files from your computer. Download
            RuneWise for macOS or Windows to use this feature.
          </p>
        </div>
      )}

      {status === "not-found" && (
        <div className="bg-bg-secondary rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-2">RuneLite Not Found</p>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Could not find the RuneLite data directory at{" "}
            <code className="text-accent">~/.runelite/</code>.
          </p>
          <p className="text-xs text-text-secondary">
            Make sure RuneLite is installed and has been launched at least once.
          </p>
        </div>
      )}

      {status === "found" && (
        <div className="space-y-4">
          {/* Profile selector */}
          {profiles.length > 1 && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-text-secondary">Profile</label>
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="bg-bg-secondary border border-border rounded px-3 py-1.5 text-sm"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-secondary rounded-lg p-4 text-center">
              <div className="text-xs text-text-secondary mb-1">
                Total Loot Value
              </div>
              <div className="text-xl font-bold text-success">
                {formatGp(totalGp)}
              </div>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4 text-center">
              <div className="text-xs text-text-secondary mb-1">
                Total Kills
              </div>
              <div className="text-xl font-bold text-text-primary">
                {totalKills.toLocaleString()}
              </div>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4 text-center">
              <div className="text-xs text-text-secondary mb-1">
                Sources Tracked
              </div>
              <div className="text-xl font-bold text-text-primary">
                {aggregated.length}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setTab("loot")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                tab === "loot"
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              Loot Tracker
            </button>
            <button
              onClick={() => setTab("info")}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                tab === "info"
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              Info
            </button>
          </div>

          {tab === "loot" && (
            <>
              {lootLoading && (
                <p className="text-sm text-text-secondary animate-pulse">
                  Loading loot data...
                </p>
              )}

              {!lootLoading && aggregated.length === 0 && (
                <div className="bg-bg-secondary rounded-lg p-6 text-center">
                  <p className="text-sm text-text-secondary">
                    No loot tracker data found. Make sure the Loot Tracker
                    plugin is enabled in RuneLite.
                  </p>
                </div>
              )}

              {!lootLoading && aggregated.length > 0 && (
                <div className="bg-bg-secondary rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary text-xs">
                        <th className="text-left px-4 py-2">Source</th>
                        <th className="text-right px-4 py-2">Kills</th>
                        <th className="text-right px-4 py-2">Total Value</th>
                        <th className="text-right px-4 py-2">GP/Kill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregated.map((boss) => (
                        <tr
                          key={boss.name}
                          className="border-b border-border/50 hover:bg-bg-tertiary transition-colors"
                        >
                          <td className="px-4 py-1.5 font-medium">
                            {boss.name}
                          </td>
                          <td className="px-4 py-1.5 text-right text-text-secondary">
                            {boss.totalKills.toLocaleString()}
                          </td>
                          <td className="px-4 py-1.5 text-right text-success">
                            {formatGp(boss.totalValue)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-success">
                            {formatGp(
                              boss.totalKills > 0
                                ? Math.round(boss.totalValue / boss.totalKills)
                                : 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === "info" && (
            <div className="bg-bg-secondary rounded-lg p-4 space-y-3">
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Data Directory
                </div>
                <code className="text-sm text-accent">~/.runelite/</code>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Profiles Found
                </div>
                <div className="text-sm">{profiles.length}</div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                RuneWise reads loot tracker data from RuneLite's local profile
                storage. Make sure the Loot Tracker plugin is enabled and set to
                write locally. Data is read-only — RuneWise never modifies your
                RuneLite files.
              </p>
              <div className="mt-3 p-2 rounded bg-bg-tertiary">
                <p className="text-[10px] text-text-secondary/70 leading-relaxed">
                  <strong className="text-text-secondary">Privacy:</strong> RuneWise only reads loot tracker data. It never accesses
                  account credentials, email addresses, or authentication tokens. Profile names
                  containing email addresses are automatically redacted.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
