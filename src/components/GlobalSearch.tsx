import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigation, type View } from "../lib/NavigationContext";
import { BOSSES } from "../lib/data/bosses";
import { NAV_ICONS, skillIcon, bossIcon } from "../lib/sprites";
import { isMac } from "../lib/env";

interface SearchResult {
  name: string;
  category: string;
  view: View;
  params?: Record<string, string>;
  icon?: string;
}

const SKILLS = [
  "Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic",
  "Runecraft", "Hitpoints", "Crafting", "Mining", "Smithing", "Fishing",
  "Cooking", "Firemaking", "Woodcutting", "Agility", "Herblore", "Thieving",
  "Fletching", "Slayer", "Farming", "Construction", "Hunter", "Sailing",
];

const PAGES: SearchResult[] = [
  { name: "Overview", category: "Page", view: "overview", icon: NAV_ICONS.overview },
  { name: "XP Tracker", category: "Page", view: "tracker", icon: NAV_ICONS.tracker },
  { name: "Skill Calculators", category: "Page", view: "skill-calc", icon: NAV_ICONS["skill-calc"] },
  { name: "Combat Calculator", category: "Page", view: "combat-calc", icon: NAV_ICONS["combat-calc"] },
  { name: "Dry Calculator", category: "Page", view: "dry-calc", icon: NAV_ICONS["dry-calc"] },
  { name: "Grand Exchange", category: "Page", view: "ge", icon: NAV_ICONS.ge },
  { name: "Item Database", category: "Page", view: "item-db", icon: NAV_ICONS["item-db"] },
  { name: "XP Table", category: "Page", view: "xp-table", icon: NAV_ICONS["xp-table"] },
  { name: "Drop Tables", category: "Page", view: "drops", icon: NAV_ICONS.drops },
  { name: "Boss Guides", category: "Page", view: "bosses", icon: NAV_ICONS.bosses },
  { name: "Quests", category: "Page", view: "quests", icon: NAV_ICONS.quests },
  { name: "Achievement Diaries", category: "Page", view: "diaries", icon: NAV_ICONS.diaries },
  { name: "Slayer Helper", category: "Page", view: "slayer", icon: NAV_ICONS.slayer },
  { name: "News", category: "Page", view: "news", icon: NAV_ICONS.news },
  { name: "About", category: "Page", view: "about" },
];

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const skill of SKILLS) {
    results.push({
      name: skill,
      category: "Skill",
      view: "skill-calc",
      params: { skill: skill.toLowerCase() },
      icon: skillIcon(skill),
    });
  }

  for (const boss of BOSSES) {
    results.push({
      name: boss.name,
      category: "Boss",
      view: "bosses",
      params: { boss: boss.name },
      icon: bossIcon(boss.name),
    });
  }

  results.push(...PAGES);

  results.push(
    {
      name: "Search items in Item Database",
      category: "Shortcut",
      view: "item-db",
      icon: NAV_ICONS["item-db"],
    },
    {
      name: "Search items in Grand Exchange",
      category: "Shortcut",
      view: "ge",
      icon: NAV_ICONS.ge,
    },
  );

  return results;
}


const MAX_PER_CATEGORY = 5;
const MAX_TOTAL = 20;

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { navigate } = useNavigation();

  const index = useMemo(() => (open ? buildIndex() : []), [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const byCat = new Map<string, SearchResult[]>();
    for (const item of index) {
      if (!item.name.toLowerCase().includes(q)) continue;
      const group = byCat.get(item.category) ?? [];
      if (group.length >= MAX_PER_CATEGORY) continue;
      group.push(item);
      byCat.set(item.category, group);
    }
    const flat: SearchResult[] = [];
    for (const group of byCat.values()) {
      for (const item of group) {
        if (flat.length >= MAX_TOTAL) break;
        flat.push(item);
      }
      if (flat.length >= MAX_TOTAL) break;
    }
    return flat;
  }, [query, index]);

  const select = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      navigate(result.view, result.params);
    },
    [navigate],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-item]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Global keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) setQuery("");
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      select(filtered[selectedIndex]);
    }
  };

  if (!open) return null;

  // Group results by category for rendering
  const groups: { category: string; items: SearchResult[]; startIndex: number }[] = [];
  let runningIndex = 0;
  for (const item of filtered) {
    const last = groups[groups.length - 1];
    if (last && last.category === item.category) {
      last.items.push(item);
    } else {
      groups.push({ category: item.category, items: [item], startIndex: runningIndex });
    }
    runningIndex++;
  }

  return (
    <div className="fixed inset-0 z-50" onClick={() => { setOpen(false); setQuery(""); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative max-w-lg mx-auto mt-[15vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-bg-secondary rounded-xl border border-border shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <svg
              className="w-5 h-5 text-text-secondary/50 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search skills, bosses, pages..."
              className="flex-1 bg-transparent text-lg text-text-primary placeholder:text-text-secondary/40 outline-none"
            />
            <kbd className="text-[10px] text-text-secondary/40 border border-border rounded px-1.5 py-0.5 font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
            {query.trim() && filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-text-secondary/50">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}
            {groups.map((group) => (
              <div key={group.category}>
                <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 px-4 pt-3 pb-1 select-none">
                  {group.category}
                </div>
                {group.items.map((item, i) => {
                  const flatIndex = group.startIndex + i;
                  const isSelected = flatIndex === selectedIndex;
                  return (
                    <button
                      key={`${item.category}-${item.name}`}
                      data-search-item
                      onClick={() => select(item)}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                        isSelected
                          ? "bg-accent/10"
                          : "hover:bg-bg-tertiary/50"
                      }`}
                    >
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt=""
                          className="w-5 h-5 shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 shrink-0 rounded bg-bg-tertiary flex items-center justify-center text-[10px] font-bold text-text-secondary">
                          {item.name[0]}
                        </div>
                      )}
                      <span className="flex-1 text-sm text-text-primary truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-text-secondary/40 shrink-0">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            {!query.trim() && (
              <div className="px-4 py-8 text-center text-sm text-text-secondary/50">
                Type to search across skills, bosses, and pages
              </div>
            )}
          </div>

          {/* Footer hint */}
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-text-secondary/40">
              <span>
                <kbd className="border border-border rounded px-1 py-0.5 font-mono mr-1">&uarr;</kbd>
                <kbd className="border border-border rounded px-1 py-0.5 font-mono mr-1">&darr;</kbd>
                navigate
              </span>
              <span>
                <kbd className="border border-border rounded px-1 py-0.5 font-mono mr-1">Enter</kbd>
                open
              </span>
            </div>
          )}
        </div>

        {/* Shortcut hint below dialog */}
        <div className="text-center mt-3 text-[11px] text-text-secondary/30">
          {isMac ? "⌘" : "Ctrl+"}K to toggle search
        </div>
      </div>
    </div>
  );
}
