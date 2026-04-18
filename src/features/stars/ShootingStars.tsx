import { useState, useEffect, useMemo, useRef } from "react";
import {
  STAR_TIERS,
  STAR_SITES,
  STARDUST_REWARDS,
  type StarSite,
  findStarSiteMatch,
  getRankedTeleportsForLocation,
  getRankedTeleportsForLocationFromSites,
  getStarLocationBadge,
  getStarLocationMap,
} from "../../lib/data/stars";
import WikiImage from "../../components/WikiImage";
import { fetchLiveStars, type LiveStar } from "../../lib/api/stars";
import { fetchStarLandingSites } from "../../lib/api/stars-reference";
import { useNavigation } from "../../lib/NavigationContext";

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

function StarLocationPreview({
  locationName,
  site,
  large = false,
}: {
  locationName: string;
  site: StarSite | null;
  large?: boolean;
}) {
  const previewName = site?.name ?? locationName;
  const mapSrc = getStarLocationMap(previewName);
  const fallback = getStarLocationBadge(locationName);

  if (site?.mapPreview) {
    const targetWidth = large ? 320 : 80;
    const targetHeight = large ? 160 : 56;
    const scale = Math.min(
      targetWidth / site.mapPreview.width,
      targetHeight / site.mapPreview.height
    );

    return (
      <div
        className="relative overflow-hidden bg-bg-primary/40"
        style={{ width: targetWidth, height: targetHeight }}
      >
        <div
          style={{
            width: site.mapPreview.width,
            height: site.mapPreview.height,
            backgroundImage: site.mapPreview.backgroundImage,
            backgroundPosition: site.mapPreview.backgroundPosition,
            backgroundRepeat: site.mapPreview.backgroundRepeat,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    );
  }

  if (mapSrc) {
    return (
      <WikiImage
        src={mapSrc}
        alt=""
        className={large ? "h-40 w-full object-cover" : "h-14 w-20 object-cover"}
        fallback={fallback}
      />
    );
  }

  return (
    <span className={`flex items-center justify-center rounded-xl bg-bg-primary text-xs font-semibold tracking-[0.16em] text-text-secondary ${large ? "h-40 w-full" : "h-14 w-20"}`}>
      {fallback}
    </span>
  );
}

export default function ShootingStars() {
  const { navigate } = useNavigation();
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<Tab>("live");
  const [stars, setStars] = useState<LiveStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState<LiveStar | null>(null);
  const userDismissedRef = useRef(false);
  const [referenceSites, setReferenceSites] = useState<StarSite[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    fetchStarLandingSites()
      .then((sites) => {
        if (!cancelled && sites.length > 0) {
          setReferenceSites(sites);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
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
  const effectiveSites = referenceSites.length > 0 ? referenceSites : STAR_SITES;
  const regions = useMemo(
    () => ["All", ...Array.from(new Set(effectiveSites.map((s) => s.region))).sort()],
    [effectiveSites]
  );
  const filteredSites = useMemo(() => {
    let sites = effectiveSites;
    if (regionFilter !== "All") sites = sites.filter((s) => s.region === regionFilter);
    if (siteQuery.length >= 2) {
      const q = siteQuery.toLowerCase();
      sites = sites.filter((s) => s.name.toLowerCase().includes(q));
    }
    return sites;
  }, [effectiveSites, regionFilter, siteQuery]);
  const groupedSites = useMemo(() => {
    const groups: Record<string, typeof filteredSites> = {};
    for (const site of filteredSites) (groups[site.region] ??= []).push(site);
    return groups;
  }, [filteredSites]);

  const topStar = sortedStars[0] ?? null;
  const activeCount = sortedStars.filter((star) => star._est.seconds > 0).length;
  const urgentCount = sortedStars.filter((star) => star._est.seconds > 0 && star._est.seconds < 10 * 60).length;
  const highTierCount = sortedStars.filter((star) => star.tier >= 7 && star._est.seconds > 0).length;

  const bestTeleport = topStar
    ? (referenceSites.length > 0
        ? getRankedTeleportsForLocationFromSites(
            topStar.calledLocation,
            referenceSites,
            topStar.locationKey
          )
        : getRankedTeleportsForLocation(topStar.calledLocation))[0]
    : null;

  useEffect(() => {
    if (!selectedStar && topStar && !userDismissedRef.current) {
      setSelectedStar(topStar);
    }
  }, [selectedStar, topStar]);

  function openStarDetails(star: LiveStar) {
    userDismissedRef.current = false;
    setSelectedStar(star);
    if (window.innerWidth < 1280) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-5 space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-hero font-semibold tracking-tight">Star Helper</h2>
          {tab === "live" && !loading && (
            <span className="text-[11px] text-text-secondary/50">
              {activeCount} active · refreshes every 30s
            </span>
          )}
        </div>
        <p className="max-w-2xl text-sm text-text-secondary">
          Track active shooting stars across all worlds. Data from Star Miners crowdsource API.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setTab("live")}
          aria-pressed={tab === "live"}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            tab === "live" ? "bg-accent text-on-accent" : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          Live Tracker
        </button>
        <button
          onClick={() => setTab("reference")}
          aria-pressed={tab === "reference"}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            tab === "reference" ? "bg-accent text-on-accent" : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          Reference
        </button>
      </div>

      {/* Live Tracker Tab */}
      {tab === "live" && (
        <>
          {!loading && sortedStars.length > 0 && (
            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <div className="px-4 py-3">
                <div className="section-kicker">Active Stars</div>
                <div className="mt-1 text-lg font-semibold text-text-primary">{activeCount}</div>
              </div>
              <div className="px-4 py-3">
                <div className="section-kicker">Urgent</div>
                <div className={`mt-1 text-lg font-semibold ${urgentCount > 0 ? "text-warning" : "text-text-primary"}`}>
                  {urgentCount}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="section-kicker">High Tier</div>
                <div className="mt-1 text-lg font-semibold text-text-primary">{highTierCount}</div>
              </div>
              <div className="px-4 py-3">
                <div className="section-kicker">Best Right Now</div>
                <div className="mt-1 truncate text-sm font-semibold text-text-primary">
                  {topStar ? `T${topStar.tier} · W${topStar.world}` : "—"}
                </div>
              </div>
            </div>
          )}

          {!loading && topStar && (
            <div className="mb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="section-kicker">Best Star Right Now</div>
                  <h3 className="mt-2 text-h4 font-semibold tracking-tight">
                    {topStar.calledLocation}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    World {topStar.world} · Tier {topStar.tier} · spotted {timeAgo(topStar.calledAt)}
                  </p>
                  {bestTeleport ? (
                    <p className="mt-2 text-sm text-text-secondary">
                      Best teleport: <span className="font-medium text-text-primary">{bestTeleport.label}</span>
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openStarDetails(topStar)}
                    className="rounded-xl bg-accent px-3 py-2 text-xs font-medium text-on-accent transition hover:bg-accent-hover"
                  >
                    Open Details
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("wiki", { query: topStar.calledLocation })}
                    className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                  >
                    Wiki Lookup
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4" />
          )}

          {!loading && stars.length === 0 && (
            <div className="bg-bg-tertiary rounded-lg p-6 text-center">
              <p className="text-sm text-text-secondary">No active stars reported right now.</p>
              <p className="text-xs text-text-secondary/50 mt-1">Data from Star Miners crowdsource API</p>
            </div>
          )}

          {!loading && sortedStars.length > 0 && (
            <div className={selectedStar ? "grid gap-4 xl:grid-cols-[1fr_320px]" : ""}>
            <div className="space-y-1.5">
              {sortedStars.map((star) => {
                const est = star._est;
                const isExpired = est.seconds <= 0;
                const isSelected = selectedStar?.world === star.world && selectedStar?.calledAt === star.calledAt;
                const matchedSite =
                  referenceSites.length > 0
                    ? findStarSiteMatch(star.calledLocation, referenceSites, star.locationKey)
                    : null;
                return (
                  <button
                    key={`${star.world}-${star.calledAt}`}
                    onClick={() => {
                      if (isSelected) {
                        userDismissedRef.current = true;
                        setSelectedStar(null);
                        return;
                      }
                      openStarDetails(star);
                    }}
                    className={`w-full rounded-2xl bg-bg-tertiary px-4 py-3 text-left transition-colors ${
                      isExpired ? "opacity-40" : "hover:bg-bg-secondary"
                    } ${isSelected ? "ring-1 ring-accent" : ""}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="hidden overflow-hidden rounded-xl border border-border/70 bg-bg-primary/50 sm:block">
                          <StarLocationPreview
                            locationName={star.calledLocation}
                            site={matchedSite}
                          />
                        </span>
                        <span className={`text-lg font-bold ${tierColor(star.tier)}`}>
                          T{star.tier}
                        </span>
                        <span className="bg-bg-tertiary px-2 py-0.5 rounded text-xs">
                          W{star.world}
                        </span>
                        <span className="truncate text-sm font-medium">{star.calledLocation}</span>
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
              const est = estimateRemaining(selectedStar);
              const wikiSearch = encodeURIComponent(selectedStar.calledLocation.split("(")[0].trim());
              const starTier = STAR_TIERS.find(t => t.tier === selectedStar.tier);
              const matchedSite =
                referenceSites.length > 0
                  ? findStarSiteMatch(
                      selectedStar.calledLocation,
                      referenceSites,
                      selectedStar.locationKey
                    )
                  : null;
              const teleports =
                referenceSites.length > 0
                  ? getRankedTeleportsForLocationFromSites(
                      selectedStar.calledLocation,
                      referenceSites,
                      selectedStar.locationKey
                    )
                  : getRankedTeleportsForLocation(selectedStar.calledLocation);
              const best = teleports[0] ?? null;
              return (
                <div ref={detailRef} className="sticky top-0 h-fit">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{selectedStar.calledLocation}</h3>
                    <button
                      onClick={() => { userDismissedRef.current = true; setSelectedStar(null); }}
                      aria-label="Dismiss star detail"
                      className="text-text-secondary hover:text-text-primary text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-4 overflow-hidden rounded-2xl border border-border/70 bg-bg-primary/50">
                    <StarLocationPreview
                      locationName={selectedStar.calledLocation}
                      site={matchedSite}
                      large
                    />
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
                      <span>{starTier?.miningLevel ?? "?"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">XP/Dust</span>
                      <span>{starTier?.xpPerStardust ?? "?"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Dust/Layer</span>
                      <span>{starTier?.stardustPerLayer ?? "?"}</span>
                    </div>
                    {best ? (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-text-secondary">Best Teleport</span>
                        <span className="text-right font-medium text-text-primary">{best.label}</span>
                      </div>
                    ) : null}
                  </div>

                  {teleports.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-2">
                        How to Get There
                      </h4>
                      <div className="space-y-1.5">
                        {teleports.map((teleport, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span
                              className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                                teleport.priority === "best"
                                  ? "bg-accent/15 text-accent"
                                  : teleport.priority === "good"
                                    ? "bg-warning/15 text-warning"
                                    : "bg-bg-tertiary text-text-secondary"
                              }`}
                            >
                              {teleport.priority}
                            </span>
                            <span>{teleport.label}</span>
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

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("wiki", { query: selectedStar.calledLocation })}
                      className="rounded-xl bg-accent px-3 py-2 text-xs font-medium text-on-accent transition hover:bg-accent-hover"
                    >
                      Open Wiki Lookup
                    </button>
                    <a
                      href={`https://oldschool.runescape.wiki/w/Special:Search?search=${wikiSearch}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                    >
                      Wiki Map
                    </a>
                  </div>
                  <p className="mt-3 text-[10px] text-text-secondary/45">
                    Map preview from OSRS Wiki map tiles.
                  </p>
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
          <div className="mb-6 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-left px-4 py-2">Tier</th>
                  <th scope="col" className="text-right px-4 py-2">Mining Lvl</th>
                  <th scope="col" className="text-right px-4 py-2">XP/Dust</th>
                  <th scope="col" className="text-right px-4 py-2">Dust/Layer</th>
                  <th scope="col" className="text-right px-4 py-2">Layer Time</th>
                </tr>
              </thead>
              <tbody>
                {STAR_TIERS.map((tier) => (
                  <tr key={tier.tier} className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-secondary transition-colors">
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
          <div className="mb-6 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs">
                  <th scope="col" className="text-left px-4 py-2">Reward</th>
                  <th scope="col" className="text-right px-4 py-2">Cost</th>
                  <th scope="col" className="text-right px-4 py-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {STARDUST_REWARDS.map((r) => (
                  <tr key={r.name} className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-secondary transition-colors">
                    <td className="px-4 py-1.5 font-medium">{r.name}</td>
                    <td className="px-4 py-1.5 text-right text-warning">{r.cost.toLocaleString()}</td>
                    <td className="px-4 py-1.5 text-right text-text-secondary">×{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celestial ring */}
          <div className="mb-6">
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
              aria-label="Search landing sites"
              className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
            />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary"
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
                <div className="divide-y divide-border/30">
                  {sites.map((site) => (
                    <button
                      key={site.name}
                      type="button"
                      onClick={() => navigate("wiki", { query: site.name })}
                      className="w-full px-4 py-2 text-left text-sm text-text-primary transition-colors hover:bg-bg-secondary"
                    >
                      {site.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredSites.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-text-secondary">
                No landing sites match your current filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
