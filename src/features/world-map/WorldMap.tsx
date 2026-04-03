import { useRef, useState, useCallback, useEffect } from "react";

import { isTauri } from "../../lib/env";

const MAP_IMAGE = isTauri
  ? "https://cdn.runescape.com/assets/img/external/oldschool/world-map/2025-11-18/osrs_world_map.jpg"
  : "/api/cdn/assets/img/external/oldschool/world-map/2025-11-18/osrs_world_map.jpg";

export default function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">World Map</h2>
          <p className="text-sm text-text-secondary">
            Scroll to zoom, click and drag to pan. Official OSRS world map.
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
            href={MAP_IMAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-bg-primary/60 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
          >
            Download
          </a>
        </div>
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
        <img
          src={MAP_IMAGE}
          alt="OSRS World Map"
          draggable={false}
          onLoad={() => { setLoading(false); setZoom(0.5); }}
          onError={() => setLoading(false)}
          className="select-none absolute top-1/2 left-1/2"
          style={{
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.1s ease-out",
            maxWidth: "none",
          }}
        />
      </div>
    </div>
  );
}
