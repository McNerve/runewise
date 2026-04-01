import { useState, useEffect, useMemo } from "react";
import { STAR_TIERS, STAR_SITES, STARDUST_REWARDS, getTeleportsForLocation } from "../../lib/data/stars";
import { fetchLiveStars, type LiveStar } from "../../lib/api/stars";

type Tab = "live" | "reference";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// Estimate how long a star lasts based on tier (multi-player average)
const ESTIMATED_DURATION_MINS: Record<number, number> = {
  1: 15, 2: 20, 3: 25, 4: 30, 5: 35, 6: 40, 7: 45, 8: 50, 9: 55,
};

function estimateRemaining(star: LiveStar): { text: string; seconds: number; estimated: boolean } {
  const now = Math.floor(Date.now() / 1000);

  // Use actual maxTime if available
  if (star.maxTime) {
    const remaining = star.maxTime - now;
    if (remaining <= 0) return { text: "Ended", seconds: remaining, estimated: false };
    const mins = Math.floor(remaining / 60);
    return { text: mins < 60 ? `~${mins}m left` : `~${Math.floor(mins / 60)}h ${mins % 60}m left`, seconds: remaining, estimated: false };
  }

  // Estimate: stars typically last ~45-55 min from landing, called shortly after
  const durationMins = ESTIMATED_DURATION_MINS[star.tier] ?? 40;
  const elapsed = now - star.calledAt;
  const remaining = durationMins * 60 - elapsed;
  if (remaining <= 0) return { text: "Likely ended", seconds: remaining, estimated: true };
  const mins = Math.floor(remaining / 60);
  return { text: `~${mins}m left`, seconds: remaining, estimated: true };
}

function tierColor(tier: number): string {
  if (tier >= 8) return "text-warning";
  if (tier >= 6) return "text-accent";
  return "text-text-primary";
}

export default function ShootingStars() {
  const [tab, setTab] = useState<Tab>("live");
  const [stars, setStars] = useState<LiveStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState<LiveStar | null>(null);

  // Reference tab state
  const [regionFilter, setRegionFilter] = useState("All");
  const [siteQuery, setSiteQuery] = useState("");

  // Fetch live stars
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchLiveStars().then((data) => {
        if (!cancelled) {
          setStars(data);
          setLoading(false);
        }
      });
    };
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Sort stars by estimated time remaining (most time left first)
  const sortedStars = useMemo(() =>
    [...stars]
      .map((s) => ({ ...s, _est: estimateRemaining(s) }))
      .filter((s) => s._est.seconds > -300) // hide stars ended 5+ min ago
      .sort((a, b) => b._est.seconds - a._est.seconds),
    [stars]
  );

  // Reference tab
  const regions = useMemo(
    () => ["All", ...Array.from(new Set(STAR_SITES.map((s) => s.region))).sort()],
    []
  );
  const filteredSites = useMemo(() => {
    let sites = STAR_SITES;
    if (regionFilter !== "All") sites = sites.filter((s) => s.region === regionFilter);
    if (siteQuery.length >= 2) {
      const q = siteQuery.toLowerCase();
      sites = sites.filter((s) => s.name.toLowerCase().includes(q));
    }
    return sites;
  }, [regionFilter, siteQuery]);
  const groupedSites = useMemo(() => {
    const groups: Record<string, typeof filteredSites> = {};
    for (const site of filteredSites) (groups[site.region] ??= []).push(site);
    return groups;
  }, [filteredSites]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">Shooting Stars</h2>
        {tab === "live" && !loading && (
          <span className="text-[10px] text-text-secondary/50">
            {stars.length} active · refreshes every 30s
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setTab("live")}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            tab === "live" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
          }`}
        >
          Live Tracker
        </button>
        <button
          onClick={() => setTab("reference")}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            tab === "reference" ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
          }`}
        >
          Reference
        </button>
      </div>

      {/* Live Tracker Tab */}
      {tab === "live" && (
        <>
          {loading && (
            <p className="text-sm text-text-secondary animate-pulse">Loading live stars...</p>
          )}

          {!loading && stars.length === 0 && (
            <div className="bg-bg-secondary rounded-lg p-6 text-center">
              <p className="text-sm text-text-secondary">No active stars reported right now.</p>
              <p className="text-xs text-text-secondary/50 mt-1">Data from Star Miners crowdsource API</p>
            </div>
          )}

          {!loading && sortedStars.length > 0 && (
            <div className={selectedStar ? "grid grid-cols-[1fr_300px] gap-4" : ""}>
            <div className="space-y-1.5">
              {sortedStars.map((star) => {
                const est = star._est;
                const isExpired = est.seconds <= 0;
                const isSelected = selectedStar?.world === star.world && selectedStar?.calledAt === star.calledAt;
                return (
                  <button
                    key={`${star.world}-${star.calledAt}`}
                    onClick={() => setSelectedStar(isSelected ? null : star)}
                    className={`w-full text-left bg-bg-secondary rounded-lg px-4 py-3 transition-colors ${
                      isExpired ? "opacity-40" : "hover:bg-bg-tertiary"
                    } ${isSelected ? "ring-1 ring-accent" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${tierColor(star.tier)}`}>
                          T{star.tier}
                        </span>
                        <span className="bg-bg-tertiary px-2 py-0.5 rounded text-xs">
                          W{star.world}
                        </span>
                        <span className="text-sm font-medium">{star.calledLocation}</span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        isExpired ? "text-danger" : est.seconds < 600 ? "text-warning" : "text-success"
                      }`}>
                        {est.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-text-secondary/60">
                      <span>Spotted {timeAgo(star.calledAt)}</span>
                      {est.estimated && <span>(estimated)</span>}
                      {star.calledBy !== "anonymous" && (
                        <span>by {star.calledBy}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selectedStar && (() => {
              const teleports = getTeleportsForLocation(selectedStar.calledLocation);
              const est = estimateRemaining(selectedStar);
              const wikiSearch = encodeURIComponent(selectedStar.calledLocation.split("(")[0].trim());
              return (
                <div className="bg-bg-secondary rounded-lg p-4 sticky top-0 h-fit">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{selectedStar.calledLocation}</h3>
                    <button
                      onClick={() => setSelectedStar(null)}
                      className="text-text-secondary hover:text-text-primary text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Tier</span>
                      <span className={`font-bold ${tierColor(selectedStar.tier)}`}>T{selectedStar.tier}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">World</span>
                      <span>{selectedStar.world}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Time Left</span>
                      <span className={est.seconds <= 0 ? "text-danger" : "text-success"}>{est.text}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Mining Lvl</span>
                      <span>{STAR_TIERS.find(t => t.tier === selectedStar.tier)?.miningLevel ?? "?"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">XP/Dust</span>
                      <span>{STAR_TIERS.find(t => t.tier === selectedStar.tier)?.xpPerStardust ?? "?"}</span>
                    </div>
                  </div>

                  {teleports.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-2">
                        How to Get There
                      </h4>
                      <div className="space-y-1.5">
                        {teleports.map((tp, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-accent mt-0.5 shrink-0">→</span>
                            <span>{tp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {teleports.length === 0 && (
                    <p className="text-xs text-text-secondary/50 mb-4">
                      No teleport data for this location yet.
                    </p>
                  )}

                  <a
                    href={`https://oldschool.runescape.wiki/w/Special:Search?search=${wikiSearch}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    View on Wiki Map →
                  </a>
                </div>
              );
            })()}
            </div>
          )}

          <p className="text-[10px] text-text-secondary/40 mt-4 text-center">
            Data provided by Star Miners crowdsource
          </p>
        </>
      )}

      {/* Reference Tab */}
      {tab === "reference" && (
        <>
          {/* Tier table */}
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Star Tiers
          </h3>
          <div className="bg-bg-secondary rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th className="text-left px-4 py-2">Tier</th>
                  <th className="text-right px-4 py-2">Mining Lvl</th>
                  <th className="text-right px-4 py-2">XP/Dust</th>
                  <th className="text-right px-4 py-2">Dust/Layer</th>
                  <th className="text-right px-4 py-2">Layer Time</th>
                </tr>
              </thead>
              <tbody>
                {STAR_TIERS.map((tier) => (
                  <tr key={tier.tier} className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary transition-colors">
                    <td className="px-4 py-1.5 font-medium">
                      <span className={tierColor(tier.tier)}>T{tier.tier}</span>
                    </td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">{tier.miningLevel}</td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">{tier.xpPerStardust}</td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">{tier.stardustPerLayer}</td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">{tier.layerDuration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stardust shop */}
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Stardust Shop
          </h3>
          <div className="bg-bg-secondary rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th className="text-left px-4 py-2">Reward</th>
                  <th className="text-right px-4 py-2">Cost</th>
                  <th className="text-right px-4 py-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {STARDUST_REWARDS.map((r) => (
                  <tr key={r.name} className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary transition-colors">
                    <td className="px-4 py-1.5 font-medium">{r.name}</td>
                    <td className="px-4 py-1.5 text-right text-warning">{r.cost.toLocaleString()}</td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">×{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celestial ring */}
          <div className="bg-bg-secondary rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-accent mb-2">Celestial Ring</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Provides an invisible +4 Mining level boost when charged with stardust (10 stardust per charge, 1 charge per ore mined).
              Cost: 2,000 stardust.
            </p>
          </div>

          {/* Landing sites */}
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
            Landing Sites ({filteredSites.length})
          </h3>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={siteQuery}
              onChange={(e) => setSiteQuery(e.target.value)}
              placeholder="Search sites..."
              className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm"
            />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary"
            >
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {Object.entries(groupedSites).map(([region, sites]) => (
              <div key={region}>
                <div className="text-xs text-text-secondary/50 uppercase tracking-wider px-1 mb-1">{region}</div>
                <div className="bg-bg-secondary rounded-lg divide-y divide-border/30">
                  {sites.map((site) => (
                    <div key={site.name} className="px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors">
                      {site.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
