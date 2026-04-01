import { useState, useMemo } from "react";
import { STAR_TIERS, STAR_SITES } from "../../lib/data/stars";

export default function ShootingStars() {
  const [regionFilter, setRegionFilter] = useState("All");
  const [siteQuery, setSiteQuery] = useState("");

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
    for (const site of filteredSites) {
      (groups[site.region] ??= []).push(site);
    }
    return groups;
  }, [filteredSites]);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-2">Shooting Stars</h2>
      <p className="text-xs text-text-secondary mb-4">
        Reference guide for star tiers and landing sites. Live star tracking is not available (07.gg API discontinued).
      </p>

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
              <tr
                key={tier.tier}
                className="border-b border-border/50 even:bg-bg-primary/30 hover:bg-bg-tertiary transition-colors"
              >
                <td className="px-4 py-1.5 font-medium">
                  <span
                    className={
                      tier.tier >= 8
                        ? "text-warning"
                        : tier.tier >= 6
                          ? "text-accent"
                          : "text-text-primary"
                    }
                  >
                    T{tier.tier}
                  </span>
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
            <div className="text-xs text-text-secondary/50 uppercase tracking-wider px-1 mb-1">
              {region}
            </div>
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
    </div>
  );
}
