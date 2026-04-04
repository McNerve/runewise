import { useState, useEffect, useMemo } from "react";
import { isTauri } from "../../lib/env";
import {
  checkRuneLiteExists,
  getRuneLiteStatus,
  readProfiles,
  readLootTracker,
  type RuneLiteProfile,
  type LootEntry,
  type RuneLiteStatus,
} from "../../lib/runelite/reader";
import { formatGp } from "../../lib/format";
import { useGEData } from "../../hooks/useGEData";

type Status = "checking" | "not-desktop" | "not-found" | "found";

interface AggregatedBoss {
  name: string;
  totalKills: number;
  totalValue: number;
}

const LOCAL_ITEM_FALLBACKS: Record<number, { name: string; price: number }> = {
  995: { name: "Coins", price: 1 },
};

export default function RuneLiteData() {
  const { mapping, prices, fetchIfNeeded } = useGEData();
  const [status, setStatus] = useState<Status>(() =>
    isTauri ? "checking" : "not-desktop"
  );
  const [profiles, setProfiles] = useState<RuneLiteProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [lootEntries, setLootEntries] = useState<LootEntry[]>([]);
  const [lootLoading, setLootLoading] = useState(false);
  const [tab, setTab] = useState<"loot" | "info">("loot");
  const [pathInfo, setPathInfo] = useState<RuneLiteStatus | null>(null);

  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  const itemNames = useMemo(() => {
    const next = new Map<number, string>();
    for (const item of mapping) next.set(item.id, item.name);
    return next;
  }, [mapping]);

  useEffect(() => {
    if (!isTauri) return;
    checkRuneLiteExists()
      .then(async (exists) => {
        const statusInfo = await getRuneLiteStatus();
        setPathInfo(statusInfo);
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
        (sum, d) => {
          const fallback = LOCAL_ITEM_FALLBACKS[d.id];
          const currentPrice =
            prices[String(d.id)]?.high ??
            prices[String(d.id)]?.low ??
            d.price ??
            fallback?.price ??
            0;
          return sum + currentPrice * d.quantity;
        },
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
  }, [lootEntries, prices]);

  const topDrops = useMemo(() => {
    const drops = new Map<number, { id: number; quantity: number; value: number }>();
    for (const entry of lootEntries) {
      for (const drop of entry.drops) {
        const fallback = LOCAL_ITEM_FALLBACKS[drop.id];
        const currentPrice =
          prices[String(drop.id)]?.high ??
          prices[String(drop.id)]?.low ??
          drop.price ??
          fallback?.price ??
          0;
        const existing = drops.get(drop.id);
        if (existing) {
          existing.quantity += drop.quantity;
          existing.value += currentPrice * drop.quantity;
        } else {
          drops.set(drop.id, {
            id: drop.id,
            quantity: drop.quantity,
            value: currentPrice * drop.quantity,
          });
        }
      }
    }

    return Array.from(drops.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [lootEntries, prices]);

  const totalGp = aggregated.reduce((s, b) => s + b.totalValue, 0);
  const totalKills = aggregated.reduce((s, b) => s + b.totalKills, 0);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">RuneLite Integration</h2>

      {status === "checking" && (
        <div className="py-6 text-center">
          <p className="text-sm text-text-secondary animate-pulse">
            Checking for RuneLite...
          </p>
        </div>
      )}

      {status === "not-desktop" && (
        <div className="py-6 text-center">
          <p className="text-lg font-semibold mb-2">Desktop Only</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            RuneLite integration reads local files from your computer. Download
            RuneWise for macOS or Windows to use this feature.
          </p>
        </div>
      )}

      {status === "not-found" && (
        <div className="py-6 text-center">
          <p className="text-lg font-semibold mb-2">RuneLite Not Found</p>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Could not find a RuneLite profile manifest in{" "}
            <code className="text-accent">~/.runelite/</code>.
          </p>
          {pathInfo?.checkedPaths?.length ? (
            <div className="mb-3 space-y-1 p-3 text-left">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">
                Checked paths
              </div>
              {pathInfo.checkedPaths.map((path) => (
                <div key={path} className="break-all text-xs text-text-secondary">
                  {path}
                </div>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-text-secondary">
            Make sure RuneLite has been launched at least once and has created a
            profile under either <code>profiles2</code> or <code>profiles</code>.
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
            <div className="text-center">
              <div className="text-xs text-text-secondary mb-1">
                Total Loot Value
              </div>
              <div className="text-xl font-bold text-success">
                {formatGp(totalGp)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-secondary mb-1">
                Total Kills
              </div>
              <div className="text-xl font-bold text-text-primary">
                {totalKills.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
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
                <div className="py-6 text-center">
                  <p className="text-sm text-text-secondary">
                    No supported loot data was found. RuneWise currently reads
                    RuneLite loot tracker logs and bossing-info loot JSON files.
                  </p>
                </div>
              )}

              {!lootLoading && aggregated.length > 0 && (
                <div className="space-y-4">
                  <div className="overflow-hidden">
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

                  {topDrops.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Top Looted Items</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {topDrops.map((drop) => (
                          <div
                            key={drop.id}
                            className="flex items-center justify-between px-3 py-2"
                          >
                            <div>
                              <div className="text-sm font-medium">
                                {itemNames.get(drop.id) ??
                                  LOCAL_ITEM_FALLBACKS[drop.id]?.name ??
                                  `Unknown item (${drop.id})`}
                              </div>
                              <div className="text-[11px] text-text-secondary">
                                x{drop.quantity.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-success">
                              {formatGp(drop.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "info" && (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Data Directory
                </div>
                <code className="text-sm text-accent">~/.runelite/</code>
              </div>
              {pathInfo?.directory ? (
                <div>
                  <div className="text-xs text-text-secondary mb-1">
                    Active Profile Root
                  </div>
                  <code className="text-sm text-accent break-all">
                    {pathInfo.directory}
                  </code>
                </div>
              ) : null}
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Profiles Found
                </div>
                <div className="text-sm">{profiles.length}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Loot Formats
                </div>
                <div className="text-sm text-text-secondary">
                  RuneLite loot-tracker logs and bossing-info boss-loot JSON
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                RuneWise reads loot tracker data from RuneLite's local profile
                storage. Data is read-only — RuneWise never modifies your
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
