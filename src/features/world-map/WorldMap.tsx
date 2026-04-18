import { useRef, useState, useCallback, useEffect, useMemo } from "react";

import { isTauri } from "../../lib/env";
import { FilterPills, type FilterPillItem } from "../../components/primitives";
import {
  WORLD_MAP_POIS,
  CATEGORY_META,
  type PoiCategory,
  type WorldMapPoi,
} from "../../lib/data/world-map-pois";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [openPoi, setOpenPoi] = useState<WorldMapPoi | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.02 : 0.02;
    setZoom((z) => Math.max(0.05, Math.min(1.5, z + delta)));
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
    setPan({
      x: panStart.x + (e.clientX - dragStart.x),
      y: panStart.y + (e.clientY - dragStart.y),
    });
  };

  const onMouseUp = () => setDragging(false);

  const resetView = () => {
    setZoom(0.15);
    setPan({ x: 0, y: 0 });
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
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.05))}
            className="rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.05, z - 0.05))}
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
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-sm text-text-secondary animate-pulse">Loading world map...</div>
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
            onLoad={() => { setLoading(false); setZoom(0.5); }}
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
                }}
              >
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
