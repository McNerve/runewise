import { useState, useEffect, useCallback } from "react";
import { fetchWomGains } from "../../lib/api/wom";
import { loadJSON, saveJSON } from "../../lib/localStorage";
import type { View } from "../../lib/features";

const CACHE_KEY = "runewise_session_widget";
const POLL_INTERVAL = 5 * 60 * 1000; // 5 min
const COLLAPSED_KEY = "runewise_session_widget_collapsed";

// Heuristic skill → likely activity lookup table
const SKILL_ACTIVITIES: Record<string, { label: string; destinations: string[]; view: View; viewParams?: Record<string, string> }> = {
  ranged: { label: "Ranging", destinations: ["Zulrah", "Nex", "Chambers of Xeric"], view: "bosses", viewParams: { boss: "Zulrah" } },
  magic: { label: "Maging", destinations: ["Barrows", "Corrupted Gauntlet", "Muspah"], view: "bosses", viewParams: { boss: "Barrows" } },
  slayer: { label: "Slayer training", destinations: ["Slayer task"], view: "slayer" },
  mining: { label: "Mining", destinations: ["Motherlode Mine", "Gem rocks", "Blast Mine"], view: "skill-calc", viewParams: { skill: "Mining" } },
  woodcutting: { label: "Woodcutting", destinations: ["Teaks", "Mahogany Homes", "Redwood trees"], view: "skill-calc", viewParams: { skill: "Woodcutting" } },
  fishing: { label: "Fishing", destinations: ["Barbarian Fishing", "Anglerfish", "Infernal Eel"], view: "skill-calc", viewParams: { skill: "Fishing" } },
  agility: { label: "Agility training", destinations: ["Seers' Village course", "Ardougne rooftop", "Hallowed Sepulchre"], view: "skill-calc", viewParams: { skill: "Agility" } },
  thieving: { label: "Thieving", destinations: ["Pyramid Plunder", "Blackjacking", "Artefacts"], view: "skill-calc", viewParams: { skill: "Thieving" } },
  herblore: { label: "Herblore training", destinations: ["Potions", "Karambwans"], view: "skill-calc", viewParams: { skill: "Herblore" } },
  crafting: { label: "Crafting", destinations: ["Crafting training"], view: "skill-calc", viewParams: { skill: "Crafting" } },
  prayer: { label: "Prayer training", destinations: ["Chaos altar", "Gilded altar"], view: "skill-calc", viewParams: { skill: "Prayer" } },
  runecraft: { label: "Runecrafting", destinations: ["Ourania altar", "Blood runes", "ZMI"], view: "skill-calc", viewParams: { skill: "Runecraft" } },
  attack: { label: "Melee combat", destinations: ["Slayer", "Nightmare Zone", "ToA"], view: "bosses" },
  strength: { label: "Melee training", destinations: ["Nightmare Zone", "Bandits", "Slayer"], view: "bosses" },
  defence: { label: "Defence training", destinations: ["Slayer", "Combat training"], view: "bosses" },
  hitpoints: { label: "Combat", destinations: ["Slayer", "Bossing"], view: "bosses" },
  construction: { label: "Construction training", destinations: ["Mahogany Homes", "Tithe Farm"], view: "skill-calc", viewParams: { skill: "Construction" } },
  farming: { label: "Farming runs", destinations: ["Farm runs", "Tithe Farm"], view: "timers" },
  hunter: { label: "Hunter training", destinations: ["Maniacal Monkeys", "Black chinchompas"], view: "skill-calc", viewParams: { skill: "Hunter" } },
  fletching: { label: "Fletching", destinations: ["Bow stringing", "Fletching darts"], view: "skill-calc", viewParams: { skill: "Fletching" } },
  cooking: { label: "Cooking", destinations: ["Karambwans", "Anglerfish"], view: "skill-calc", viewParams: { skill: "Cooking" } },
  firemaking: { label: "Firemaking", destinations: ["Wintertodt", "Bonfires"], view: "skill-calc", viewParams: { skill: "Firemaking" } },
  smithing: { label: "Smithing", destinations: ["Blast Furnace", "Gold smelting"], view: "skill-calc", viewParams: { skill: "Smithing" } },
};

interface CachedResult {
  activity: string | null;
  suggestion: string;
  ctaLabel: string;
  ctaView: View;
  ctaParams?: Record<string, string>;
  timestamp: number;
}

interface Props {
  rsn: string;
  onNavigate: (view: View, params?: Record<string, string>) => void;
}

function getRecentTool(): { label: string; view: View } {
  try {
    const raw = localStorage.getItem("runewise_tool_usage");
    if (!raw) return { label: "Skill Calculator", view: "skill-calc" };
    const map = JSON.parse(raw) as Record<string, number>;
    const sorted = Object.entries(map).sort(([, a], [, b]) => b - a);
    const top = sorted[0]?.[0] as View | undefined;
    if (!top) return { label: "Skill Calculator", view: "skill-calc" };
    const labels: Partial<Record<View, string>> = {
      bosses: "Boss Guides", "dps-calc": "DPS Calculator", "skill-calc": "Skill Calculator",
      "money-making": "Money Making", raids: "Raid Guides", slayer: "Slayer Helper",
    };
    return { label: labels[top] ?? "Home", view: top };
  } catch {
    return { label: "Skill Calculator", view: "skill-calc" };
  }
}

export default function SessionWidget({ rsn, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(() => loadJSON<boolean>(COLLAPSED_KEY, true));
  const [result, setResult] = useState<CachedResult | null>(() => loadJSON<CachedResult | null>(CACHE_KEY, null));
  const [loading, setLoading] = useState(false);

  const persistCollapsed = (val: boolean) => {
    setCollapsed(val);
    saveJSON(COLLAPSED_KEY, val);
  };

  const poll = useCallback(async () => {
    if (!rsn) return;
    setLoading(true);
    try {
      const gains = await fetchWomGains(rsn, "day");
      const skillEntries = Object.entries(gains.skills)
        .map(([skill, data]) => ({ skill, gained: data.experience.gained }))
        .filter((e) => e.gained > 0)
        .sort((a, b) => b.gained - a.gained);

      let res: CachedResult;

      if (skillEntries.length === 0) {
        const recent = getRecentTool();
        res = {
          activity: null,
          suggestion: `Welcome back — jump into ${recent.label}`,
          ctaLabel: `Open ${recent.label}`,
          ctaView: recent.view,
          timestamp: Date.now(),
        };
      } else {
        const top = skillEntries[0]!;
        const skillKey = top.skill.toLowerCase();
        const info = SKILL_ACTIVITIES[skillKey];
        const gained = (top.gained / 1000).toFixed(0);

        if (info) {
          const dest = info.destinations[0] ?? info.label;
          res = {
            activity: `${info.label} (+${gained}k ${top.skill} XP)`,
            suggestion: `Likely at ${dest}. Check GP/hr or guides.`,
            ctaLabel: info.view === "bosses" ? "Open Boss Guide" : info.view === "slayer" ? "Open Slayer Helper" : "Open Guide",
            ctaView: info.view,
            ctaParams: info.viewParams,
            timestamp: Date.now(),
          };
        } else {
          res = {
            activity: `Training ${top.skill} (+${gained}k XP)`,
            suggestion: `Check the Skill Calculator for ${top.skill} methods.`,
            ctaLabel: "Open Skill Calculator",
            ctaView: "skill-calc",
            ctaParams: { skill: top.skill },
            timestamp: Date.now(),
          };
        }
      }

      setResult(res);
      saveJSON(CACHE_KEY, res);
    } catch {
      // silently keep last result
    } finally {
      setLoading(false);
    }
  }, [rsn]);

  useEffect(() => {
    if (!rsn) return;
    // Only refetch if cache is stale (older than poll interval)
    const stale = !result || Date.now() - result.timestamp > POLL_INTERVAL;
    if (stale) poll();

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [rsn, poll]); // eslint-disable-line react-hooks/exhaustive-deps

  // No RSN set
  if (!rsn) {
    return (
      <div className="mx-2 mb-2 rounded-lg border border-border/30 bg-bg-tertiary/40 px-3 py-2.5">
        <div className="text-[11px] text-text-secondary/60 mb-1.5 font-medium uppercase tracking-wider">Session</div>
        <p className="text-xs text-text-secondary/70 leading-relaxed">Set your RSN to enable session hints.</p>
        <button
          onClick={() => onNavigate("settings")}
          className="mt-2 text-[11px] text-accent hover:text-accent-hover transition-colors"
        >
          Go to Settings →
        </button>
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2 rounded-lg border border-border/30 bg-bg-tertiary/40 overflow-hidden">
      <button
        onClick={() => persistCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-bg-secondary/30 transition-colors"
      >
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary/60">Session</span>
        <div className="flex items-center gap-1.5">
          {loading && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
          <svg
            className={`w-3 h-3 text-text-secondary/40 transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3">
          {result ? (
            <>
              {result.activity && (
                <div className="mb-1.5">
                  <div className="text-[10px] text-text-secondary/50 uppercase tracking-wider mb-0.5">Currently</div>
                  <div className="text-xs text-text-primary font-medium leading-snug">{result.activity}</div>
                </div>
              )}
              <p className="text-[11px] text-text-secondary/80 leading-relaxed mb-2">{result.suggestion}</p>
              <button
                onClick={() => onNavigate(result.ctaView, result.ctaParams)}
                className="w-full rounded bg-accent/15 text-accent text-[11px] font-medium px-2 py-1.5 hover:bg-accent/25 transition-colors text-center"
              >
                {result.ctaLabel}
              </button>
            </>
          ) : (
            <p className="text-[11px] text-text-secondary/60 leading-relaxed">
              {loading ? "Loading activity..." : "No recent activity detected."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
