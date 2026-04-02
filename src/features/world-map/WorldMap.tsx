import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MAP_MARKERS,
  MARKER_COLORS,
  MARKER_LABELS,
  type MarkerCategory,
} from "./data/markers";
import { useNavigation } from "../../lib/NavigationContext";

// OSRS map tile configuration
// Tiles are at: /versions/{version}/tiles/rendered/{plane}/{zoom}/{plane}_{x}_{y}.png
// Coordinates scale by 2x per zoom level
const MAP_VERSION = "2026-03-04_a";
const TILE_BASE = `https://maps.runescape.wiki/osrs/versions/${MAP_VERSION}/tiles/rendered`;
const PLANE = 0;
const MIN_ZOOM = 0;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1;

// OSRS coordinate system: game coords → map tile coords
// At zoom 2, one tile = ~256 game squares, tile coords = floor(gameCoord / ~64)
// The CRS maps game coordinates to pixel positions on the tile layer
function createOsrsCrs() {
  return L.CRS.Simple;
}

function gameToLatLng(x: number, y: number): L.LatLng {
  // Convert OSRS game coordinates to Leaflet LatLng
  // The wiki map uses an inverted Y axis and scales by tile size
  return L.latLng(y / 128, x / 128);
}

const ALL_CATEGORIES: MarkerCategory[] = [
  "boss",
  "city",
  "fairy-ring",
  "spirit-tree",
  "teleport",
  "slayer",
  "skilling",
  "minigame",
  "quest",
];

export default function WorldMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const { navigate } = useNavigation();
  const [activeCategories, setActiveCategories] = useState<Set<MarkerCategory>>(
    new Set(["boss", "city", "fairy-ring", "spirit-tree", "minigame"])
  );

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      crs: createOsrsCrs(),
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    // Set initial view (roughly centered on the main continent)
    map.setView(gameToLatLng(3100, 3400), DEFAULT_ZOOM);

    // Add tile layer
    L.tileLayer(`${TILE_BASE}/${PLANE}/{z}/{z}_{x}_{y}.png`, {
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      tileSize: 256,
      noWrap: true,
      errorTileUrl: "",
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when categories change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for active categories
    const filtered = MAP_MARKERS.filter((m) => activeCategories.has(m.category));

    for (const marker of filtered) {
      const color = MARKER_COLORS[marker.category];
      const circle = L.circleMarker(gameToLatLng(marker.x, marker.y), {
        radius: 6,
        fillColor: color,
        color: "#0f1117",
        weight: 1.5,
        fillOpacity: 0.9,
      });

      const popupContent = `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 120px;">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">${marker.name}</div>
          ${marker.description ? `<div style="font-size: 11px; color: #a1a1aa;">${marker.description}</div>` : ""}
          ${marker.wikiPage ? `<div style="margin-top: 4px; font-size: 11px;"><a href="#" style="color: #3b82f6;" data-wiki="${marker.wikiPage}">View in Wiki →</a></div>` : ""}
        </div>
      `;

      circle.bindPopup(popupContent, {
        className: "osrs-map-popup",
        closeButton: false,
      });

      circle.on("popupopen", () => {
        const popup = circle.getPopup();
        if (!popup) return;
        const el = popup.getElement();
        if (!el) return;
        el.querySelectorAll("a[data-wiki]").forEach((link) => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = (link as HTMLElement).getAttribute("data-wiki");
            if (page) navigate("wiki", { page, query: page });
          });
        });
      });

      circle.addTo(map);
    }
  }, [activeCategories, navigate]);

  function toggleCategory(cat: MarkerCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">World Map</h2>
        <p className="text-xs text-text-secondary">
          Powered by OSRS Wiki map tiles
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ALL_CATEGORIES.map((cat) => {
          const active = activeCategories.has(cat);
          const color = MARKER_COLORS[cat];
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                active
                  ? "border border-current/30"
                  : "bg-bg-secondary text-text-secondary/50 border border-transparent hover:border-border"
              }`}
              style={active ? { color, backgroundColor: `${color}15` } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: active ? color : "var(--color-bg-tertiary)" }}
              />
              {MARKER_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        className="flex-1 rounded-lg overflow-hidden border border-border"
        style={{ minHeight: 400, background: "#0a0c10" }}
      />
    </div>
  );
}
