import { useState, useMemo, useRef, useEffect } from "react";
import type { WikiMonster } from "../../../lib/api/monsters";

interface MonsterSearchProps {
  monsters: WikiMonster[];
  selected: WikiMonster | null;
  onSelect: (monster: WikiMonster | null) => void;
  combatStyle: "melee" | "ranged" | "magic";
}

function getDefForStyle(m: WikiMonster, style: "melee" | "ranged" | "magic"): number {
  if (style === "ranged") return m.defRanged;
  if (style === "magic") return m.defMagic;
  return Math.min(m.defStab, m.defSlash, m.defCrush);
}

export default function MonsterSearch({
  monsters,
  selected,
  onSelect,
  combatStyle,
}: MonsterSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return monsters
      .filter(
        (m) =>
          m.hitpoints > 0 &&
          m.name.toLowerCase().includes(lower)
      )
      .sort((a, b) => {
        const aExact = a.name.toLowerCase() === lower;
        const bExact = b.name.toLowerCase() === lower;
        if (aExact !== bExact) return aExact ? -1 : 1;
        return b.combatLevel - a.combatLevel;
      })
      .slice(0, 30);
  }, [monsters, query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? query : selected?.name ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        placeholder="Search monsters..."
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
      />

      {open && results.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-30 top-full mt-1 w-full bg-bg-secondary border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {results.map((m) => (
            <button
              key={`${m.name}:${m.version ?? ""}`}
              onClick={() => {
                onSelect(m);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-bg-tertiary transition-colors flex items-center justify-between gap-2"
            >
              <span className="truncate">
                {m.name}
                {m.version && (
                  <span className="text-text-secondary/50 ml-1">
                    ({m.version})
                  </span>
                )}
              </span>
              <span className="text-xs text-text-secondary shrink-0">
                Lv{m.combatLevel} · {m.hitpoints} HP · Def {getDefForStyle(m, combatStyle)}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && !open && (
        <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
          <span>Lv {selected.combatLevel}</span>
          <span>{selected.hitpoints} HP</span>
          <span>Def: {selected.defenceLevel}</span>
          <span>
            {combatStyle === "ranged" ? "Ranged" : combatStyle === "magic" ? "Magic" : "Best melee"} def: {getDefForStyle(selected, combatStyle)}
          </span>
          {selected.slayerLevel > 1 && (
            <span>Slayer: {selected.slayerLevel}</span>
          )}
          <a
            href={`https://oldschool.runescape.wiki/w/${encodeURIComponent(selected.name.replace(/ /g, "_"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent/50 hover:text-accent transition-colors"
          >
            Wiki
          </a>
          <button
            onClick={() => onSelect(null)}
            aria-label="Clear monster selection"
            className="ml-auto text-text-secondary/40 hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
