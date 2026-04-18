import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigation } from "../lib/NavigationContext";
import { isMac } from "../lib/env";
import { buildSearchIndex, recordSearchClick, sortByFrequency, type SearchResult } from "../lib/search";
import { loadRecentEntities } from "../lib/recentEntities";

const MAX_PER_CATEGORY = 5;
const MAX_TOTAL = 20;

interface SearchDialogProps {
  onClose: () => void;
}

export default function SearchDialog({ onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [recentEntities] = useState<SearchResult[]>(() => loadRecentEntities());
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { navigate } = useNavigation();
  const loadingIndex = index.length === 0;

  useEffect(() => {
    let cancelled = false;
    buildSearchIndex().then((results) => {
      if (!cancelled) setIndex(results);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const q = trimmed.toLowerCase();
    const byCat = new Map<string, SearchResult[]>();
    for (const item of index) {
      const haystack = `${item.name} ${item.category} ${item.kind ?? ""} ${item.searchText ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) continue;
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
    const shortcuts: SearchResult[] = trimmed.length >= 2
      ? [
          {
            name: `Lookup player "${trimmed}"`,
            category: "Shortcut",
            kind: "Player",
            searchText: `${trimmed} player hiscores profile lookup`,
            view: "lookup",
            params: { query: trimmed },
          },
          {
            name: `Search wiki for "${trimmed}"`,
            category: "Shortcut",
            kind: "Wiki",
            searchText: `${trimmed} wiki lookup reference`,
            view: "wiki",
            params: { query: trimmed },
          },
          {
            name: `Search items for "${trimmed}"`,
            category: "Shortcut",
            kind: "Item",
            searchText: `${trimmed} market item prices`,
            view: "market",
            params: { query: trimmed },
          },
        ]
      : [];

    const matchingRecent = recentEntities.filter((item) => {
      const haystack = `${item.name} ${item.category}`.toLowerCase();
      return haystack.includes(q);
    });

    const deduped = [...shortcuts, ...matchingRecent, ...sortByFrequency(flat)].filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.view === item.view && JSON.stringify(candidate.params) === JSON.stringify(item.params) && candidate.name === item.name) === index
    );

    return deduped.slice(0, MAX_TOTAL);
  }, [query, index, recentEntities]);

  const select = useCallback(
    (result: SearchResult) => {
      recordSearchClick(result.name, result.view);
      onClose();
      setQuery("");
      navigate(result.view, result.params);
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-item]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search RuneWise"
      className="fixed inset-0 z-50"
      onClick={() => {
        onClose();
        setQuery("");
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative mx-auto mt-[15vh] max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-xl border border-border/50 bg-bg-primary/95 backdrop-blur-xl shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <svg
              className="h-5 w-5 shrink-0 text-text-secondary/50"
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
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search skills, bosses, pages..."
              className="flex-1 bg-transparent text-lg text-text-primary outline-none placeholder:text-text-secondary/40"
            />
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-secondary/40">
              ESC
            </kbd>
          </div>

          <div ref={listRef} aria-live="polite" className="max-h-[50vh] overflow-y-auto">
            {query.trim() && filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-text-secondary/50">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}
            {groups.map((group) => (
              <div key={group.category}>
                <div className="select-none px-4 pb-1 pt-3 text-[10px] uppercase tracking-wider text-text-secondary/50">
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
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected ? "bg-accent/10" : "hover:bg-bg-tertiary/50"
                      }`}
                    >
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt=""
                          className="h-5 w-5 shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-bg-tertiary text-[10px] font-bold text-text-secondary">
                          {item.name[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-text-primary">{item.name}</div>
                        {item.kind ? (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded px-1.5 py-0.5 text-[10px] text-text-secondary/60 bg-bg-secondary/40">{item.kind}</span>
                          </div>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] text-text-secondary/40">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            {!query.trim() && (
              recentEntities.length > 0 ? (
                <div>
                  <div className="select-none px-4 pb-1 pt-3 text-[10px] uppercase tracking-wider text-text-secondary/50">
                    Recent
                  </div>
                  {recentEntities.slice(0, 6).map((item, index) => (
                    <button
                      key={`${item.category}-${item.name}-${index}`}
                      data-search-item
                      onClick={() => select(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                        selectedIndex === index ? "bg-accent/10" : "hover:bg-bg-tertiary/50"
                      }`}
                    >
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt=""
                          className="h-5 w-5 shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-bg-tertiary text-[10px] font-bold text-text-secondary">
                          {item.name[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-text-primary">{item.name}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded px-1.5 py-0.5 text-[10px] text-text-secondary/60 bg-bg-secondary/40">{item.category}</span>
                          <span className="text-[10px] text-text-secondary/40">Recent</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-text-secondary/50">
                  {loadingIndex
                    ? "Building search index..."
                    : "Type to search across players, items, bosses, wiki pages, and tools"}
                </div>
              )
            )}
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-text-secondary/40">
              <span>
                <kbd className="mr-1 rounded border border-border px-1 py-0.5 font-mono">
                  &uarr;
                </kbd>
                <kbd className="mr-1 rounded border border-border px-1 py-0.5 font-mono">
                  &darr;
                </kbd>
                navigate
              </span>
              <span>
                <kbd className="mr-1 rounded border border-border px-1 py-0.5 font-mono">
                  Enter
                </kbd>
                open
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 text-center text-[11px] text-text-secondary/30">
          {isMac ? "⌘" : "Ctrl+"}K to toggle search
        </div>
      </div>
    </div>
  );
}
