import { useRef, useState, useCallback, useEffect, useMemo } from "react";

import { isTauri } from "../../lib/env";
import { FilterPills, type FilterPillItem } from "../../components/primitives";
import { useNavigation } from "../../lib/NavigationContext";
import {
  WORLD_MAP_POIS,
  CATEGORY_META,
  type PoiCategory,
  type WorldMapPoi,
} from "../../lib/data/world-map-pois";

/** Small category-themed SVG icon paths for POI markers */
function PoiIcon({ category, size }: { category: PoiCategory; size: number }) {
  const s = size * 0.55;
  switch (category) {
    case "farming":
      // Seedling / leaf
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <path d="M6 11 C6 11 6 6 6 6 M6 6 C6 6 2 5 2 2 C2 2 5 1 7 4 M6 6 C6 6 10 5 10 2 C10 2 7 1 5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      );
    case "fairy-ring":
      // Circle with 4 cardinal dots
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <circle cx="6" cy="6" r="3.5" stroke="white" strokeWidth="1.2" fill="none"/>
          <circle cx="6" cy="1.5" r="1" fill="white"/>
          <circle cx="6" cy="10.5" r="1" fill="white"/>
          <circle cx="1.5" cy="6" r="1" fill="white"/>
          <circle cx="10.5" cy="6" r="1" fill="white"/>
        </svg>
      );
    case "slayer":
      // Skull
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <path d="M6 1.5 C3.5 1.5 2 3 2 5 C2 6.5 2.8 7.5 4 8 L4 10 L8 10 L8 8 C9.2 7.5 10 6.5 10 5 C10 3 8.5 1.5 6 1.5Z" fill="white" opacity="0.9"/>
          <circle cx="4.5" cy="5" r="1" fill="#222"/>
          <circle cx="7.5" cy="5" r="1" fill="#222"/>
          <rect x="5" y="9" width="2" height="1" fill="#444"/>
        </svg>
      );
    case "altar":
      // Cross/plus
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <rect x="5" y="1.5" width="2" height="9" rx="0.8" fill="white" opacity="0.9"/>
          <rect x="1.5" y="4" width="9" height="2" rx="0.8" fill="white" opacity="0.9"/>
        </svg>
      );
    case "teleport":
      // Swirl / spiral
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <path d="M6 10 C3 10 1.5 8.5 1.5 6 C1.5 3.5 3.5 2 6 2 C8 2 9.5 3.5 9.5 5.5 C9.5 7 8.5 8 7 8 C5.8 8 5 7.2 5 6.2 C5 5.4 5.6 5 6 5" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        </svg>
      );
  }
}

const MAP_IMAGE = isTauri
  ? "https://cdn.runescape.com/assets/img/external/oldschool/world-map/2025-11-18/osrs_world_map.jpg"
  : "/api/cdn/assets/img/external/oldschool/world-map/2025-11-18/osrs_world_map.jpg";

const WIKI_MAP_URL = "https://oldschool.runescape.wiki/w/Map";

type CategoryFilter = "all" | PoiCategory;

const FILTER_ITEMS: readonly FilterPillItem<CategoryFilter>[] = [
  { id: "all", label: "All" },
  { id: "farming", label: CATEGORY_META.farming.label },
  { id: "fairy-ring", label: CATEGORY_META["fairy-ring"].label },
  { id: "slayer", label: CATEGORY_META.slayer.label },
  { id: "altar", label: CATEGORY_META.altar.label },
  { id: "teleport", label: CATEGORY_META.teleport.label },
];

export default function WorldMap() {
  const { params } = useNavigation();
  const focusLocation = params.location ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  // Single view state so zoom + pan update atomically during cursor-anchored
  // zoom — separate setState calls inside one handler batch, but the math
  // requires reading the current pan with the current zoom, not stale values.
  const [view, setView] = useState<{ zoom: number; pan: { x: number; y: number } }>(
    { zoom: 0.5, pan: { x: 0, y: 0 } }
  );
  const zoom = view.zoom;
  const pan = view.pan;
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [openPoi, setOpenPoi] = useState<WorldMapPoi | null>(null);

  // Cursor-anchored zoom: the map point under the cursor stays under the
  // cursor while zooming, so users don't "lose their place" when wheel-zooming.
  // Ratio-based scale factor gives smooth trackpad + mouse wheel feel.
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const scaleFactor = Math.exp(-e.deltaY * 0.002);
    setView((prev) => {
      const newZoom = Math.max(0.05, Math.min(1.5, prev.zoom * scaleFactor));
      const r = newZoom / prev.zoom;
      if (r === 1) return prev;
      return {
        zoom: newZoom,
        pan: {
          x: dx - (dx - prev.pan.x) * r,
          y: dy - (dy - prev.pan.y) * r,
        },
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: pan.x, y: pan.y });
    // Close popup when starting a pan
    setOpenPoi(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setView((prev) => ({
      ...prev,
      pan: {
        x: panStart.x + (e.clientX - dragStart.x),
        y: panStart.y + (e.clientY - dragStart.y),
      },
    }));
  };

  const onMouseUp = () => setDragging(false);

  const resetView = () => {
    setView({ zoom: 0.15, pan: { x: 0, y: 0 } });
  };

  const pois = useMemo(
    () =>
      filter === "all"
        ? WORLD_MAP_POIS
        : WORLD_MAP_POIS.filter((p) => p.category === filter),
    [filter],
  );

  // Marker visual size scales inversely with zoom so dots stay ~readable
  // but don't dominate the image at low zooms.
  const markerPx = Math.max(8, Math.min(14, 9 / Math.max(zoom, 0.05)));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">World Map</h2>
          <p className="text-sm text-text-secondary">
            Scroll to zoom, drag to pan. Click a marker for details.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-text-secondary tabular-nums">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setView((v) => ({ ...v, zoom: Math.min(1.5, v.zoom + 0.05) }))}
            className="rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            +
          </button>
          <button
            onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.05, v.zoom - 0.05) }))}
            className="rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            −
          </button>
          <button
            onClick={resetView}
            className="rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            Reset
          </button>
          <a
            href={WIKI_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            Open full wiki map ↗
          </a>
        </div>
      </div>

      {focusLocation && (
        <div className="mb-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-accent">
          Looking for: <span className="font-medium">{focusLocation}</span> — pan the map to find this location.
        </div>
      )}

      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <FilterPills
          items={FILTER_ITEMS}
          activeKey={filter}
          onChange={(id) => { setFilter(id); setOpenPoi(null); }}
          ariaLabel="POI category filter"
        />
        <span className="text-xs text-text-secondary/70 tabular-nums">
          {pois.length} marker{pois.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 rounded-xl border border-border/60 overflow-hidden relative bg-bg-primary"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {loading && (
          <div
            aria-busy="true"
            aria-label="Loading world map"
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="text-sm text-text-secondary animate-pulse">Loading world map…</div>
          </div>
        )}
        <div
          className="absolute top-1/2 left-1/2 select-none"
          style={{
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <img
            src={MAP_IMAGE}
            alt="OSRS World Map"
            draggable={false}
            onLoad={() => { setLoading(false); setView((v) => ({ ...v, zoom: 0.5 })); }}
            onError={() => setLoading(false)}
            className="block"
            style={{ maxWidth: "none" }}
          />
          {!loading && pois.map((poi) => {
            const meta = CATEGORY_META[poi.category];
            const isOpen = openPoi?.id === poi.id;
            return (
              <button
                key={poi.id}
                type="button"
                aria-label={poi.name}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenPoi((cur) => (cur?.id === poi.id ? null : poi));
                }}
                className="absolute group"
                style={{
                  left: `${poi.x}%`,
                  top: `${poi.y}%`,
                  width: markerPx,
                  height: markerPx,
                  transform: "translate(-50%, -50%)",
                  background: meta.color,
                  border: `${Math.max(1, markerPx / 8)}px solid ${meta.border}`,
                  borderRadius: "50%",
                  boxShadow: isOpen
                    ? `0 0 0 ${markerPx / 3}px color-mix(in srgb, ${meta.color} 40%, transparent)`
                    : "0 1px 2px rgba(0,0,0,0.4)",
                  cursor: "pointer",
                  padding: 0,
                  position: "absolute",
                  overflow: "hidden",
                }}
              >
                <PoiIcon category={poi.category} size={markerPx} />
                <span
                  className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    // Counter-scale so the tooltip stays readable at any zoom
                    transform: `translateX(-50%) scale(${1 / Math.max(zoom, 0.2)})`,
                    transformOrigin: "top center",
                  }}
                >
                  {poi.name}
                </span>
              </button>
            );
          })}
        </div>

        {openPoi && (
          <div
            className="absolute right-4 top-4 z-20 max-w-xs rounded-xl border border-border/60 bg-bg-secondary/95 p-4 shadow-xl backdrop-blur"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: CATEGORY_META[openPoi.category].color }}
                    aria-hidden
                  />
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary/70">
                    {CATEGORY_META[openPoi.category].label}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-text-primary">{openPoi.name}</h3>
              </div>
              <button
                onClick={() => setOpenPoi(null)}
                aria-label="Close"
                className="-mt-1 -mr-1 rounded p-1 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              >
                ×
              </button>
            </div>
            {openPoi.info && (
              <p className="mt-2 text-xs text-text-secondary">{openPoi.info}</p>
            )}
            {openPoi.wiki && (
              <a
                href={`https://oldschool.runescape.wiki/w/${openPoi.wiki}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs text-accent hover:text-accent-hover"
              >
                View on wiki ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
