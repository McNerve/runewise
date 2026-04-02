import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MAP_MARKERS,
  MARKER_COLORS,
  MARKER_LABELS,
  type MarkerCategory,
} from "./data/markers";
import { useNavigation } from "../../lib/NavigationContext";
import { getCached, setCache } from "../../lib/api/cache";
import { apiFetch } from "../../lib/api/fetch";

// Wiki map tile configuration
// Two tile formats available:
// 1. Interactive: tiles/{mapID}_{cacheVersion}/{z}/{p}_{x}_{-y}.png (supports -3 to 5)
// 2. Versioned: versions/{ver}/tiles/rendered/{p}/{z}/{p}_{x}_{y}.png (supports 0 to 3)
// Using versioned format for reliability
const MAP_VERSION = "2026-03-04_a";
const TILE_URL = `https://maps.runescape.wiki/osrs/versions/${MAP_VERSION}/tiles/rendered/0/{z}/0_{x}_{y}.png`;
const MIN_ZOOM = 0;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1;

// Wiki GeoJSON markers endpoint
const GEOJSON_URL = "https://maps.runescape.wiki/osrs/data/MainMapIconLoc.json";
const GEOJSON_CACHE_KEY = "wiki-map-geojson:v1";
const GEOJSON_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week (markers rarely change)

function gameToLatLng(x: number, y: number): L.LatLng {
  return L.latLng(y / 128, x / 128);
}

const ALL_CATEGORIES: MarkerCategory[] = [
  "boss", "city", "fairy-ring", "spirit-tree", "teleport",
  "slayer", "skilling", "minigame", "quest", "shortcut", "boat",
];

interface WikiMapFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number, number?]; // [x, y, plane?]
  };
  properties: {
    name?: string;
    icon?: string;
    category?: string;
    "wiki-link"?: string;
    description?: string;
  };
}

async function fetchGeoJsonMarkers(): Promise<WikiMapFeature[]> {
  const cached = getCached<WikiMapFeature[]>(GEOJSON_CACHE_KEY, GEOJSON_TTL, { persist: true });
  if (cached) return cached;

  try {
    const res = await apiFetch(GEOJSON_URL);
    if (!res.ok) return [];
    const data = await res.json();
    const features = (data?.features ?? []) as WikiMapFeature[];
    setCache(GEOJSON_CACHE_KEY, features, { persist: true });
    return features;
  } catch {
    return [];
  }
}

// Map wiki icon categories to our marker categories
function mapIconCategory(icon: string | undefined): MarkerCategory | null {
  if (!icon) return null;
  const lower = icon.toLowerCase();
  if (lower.includes("fairy")) return "fairy-ring";
  if (lower.includes("spirit_tree")) return "spirit-tree";
  if (lower.includes("quest")) return "quest";
  if (lower.includes("agility") || lower.includes("fishing") || lower.includes("mining") || lower.includes("farming") || lower.includes("woodcutting")) return "skilling";
  if (lower.includes("transport") || lower.includes("teleport") || lower.includes("canoe") || lower.includes("boat") || lower.includes("charter") || lower.includes("glider") || lower.includes("carpet") || lower.includes("minecart")) return "teleport";
  if (lower.includes("dungeon")) return "slayer";
  if (lower.includes("minigame")) return "minigame";
  if (lower.includes("city") || lower.includes("bank")) return "city";
  return null;
}

export default function WorldMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const wikiLayerRef = useRef<L.LayerGroup | null>(null);
  const customLayerRef = useRef<L.LayerGroup | null>(null);
  const { navigate } = useNavigation();
  const [activeCategories, setActiveCategories] = useState<Set<MarkerCategory>>(
    new Set(["boss", "city", "fairy-ring", "spirit-tree", "minigame"])
  );
  const [wikiMarkerCount, setWikiMarkerCount] = useState(0);
  const [showWikiMarkers, setShowWikiMarkers] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    map.setView(gameToLatLng(3100, 3400), DEFAULT_ZOOM);

    L.tileLayer(TILE_URL, {
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      tileSize: 256,
      noWrap: true,
      errorTileUrl: "",
      attribution: '&copy; <a href="https://oldschool.runescape.wiki">OSRS Wiki</a>',
    }).addTo(map);

    wikiLayerRef.current = L.layerGroup().addTo(map);
    customLayerRef.current = L.layerGroup().addTo(map);

    mapInstance.current = map;

    // Fetch wiki GeoJSON markers
    fetchGeoJsonMarkers().then((features) => {
      if (!wikiLayerRef.current) return;
      let count = 0;

      for (const feature of features) {
        if (feature.geometry.type !== "Point") continue;
        const [x, y, plane] = feature.geometry.coordinates;
        if (plane && plane !== 0) continue; // Only surface markers

        const iconFile = feature.properties.icon;
        const name = feature.properties.name || "";
        const category = mapIconCategory(iconFile);

        if (!category) continue;
        count++;

        const marker = L.circleMarker(gameToLatLng(x, y), {
          radius: 4,
          fillColor: MARKER_COLORS[category] ?? "#94a3b8",
          color: "#0f1117",
          weight: 1,
          fillOpacity: 0.7,
          className: `wiki-marker wiki-cat-${category}`,
        });

        if (name) {
          marker.bindTooltip(name, {
            permanent: false,
            direction: "top",
            offset: [0, -6],
            className: "osrs-map-tooltip",
          });
        }

        marker.addTo(wikiLayerRef.current);
      }

      setWikiMarkerCount(count);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
      wikiLayerRef.current = null;
      customLayerRef.current = null;
    };
  }, []);

  // Update custom markers (bosses, etc.) when categories change
  useEffect(() => {
    const layer = customLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const filtered = MAP_MARKERS.filter((m) => activeCategories.has(m.category));

    for (const marker of filtered) {
      const color = MARKER_COLORS[marker.category];
      const circle = L.circleMarker(gameToLatLng(marker.x, marker.y), {
        radius: 7,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: 0.9,
      });

      circle.bindPopup(
        `<div style="font-family:Inter,system-ui,sans-serif;min-width:120px">
          <div style="font-weight:600;font-size:13px;margin-bottom:2px">${marker.name}</div>
          ${marker.description ? `<div style="font-size:11px;color:#a1a1aa">${marker.description}</div>` : ""}
        </div>`,
        { closeButton: false }
      );

      circle.on("click", () => {
        if (marker.wikiPage) navigate("wiki", { page: marker.wikiPage, query: marker.wikiPage });
      });

      circle.addTo(layer);
    }
  }, [activeCategories, navigate]);

  // Toggle wiki markers visibility
  useEffect(() => {
    const map = mapInstance.current;
    const layer = wikiLayerRef.current;
    if (!map || !layer) return;

    if (showWikiMarkers) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showWikiMarkers]);

  const toggleCategory = useCallback((cat: MarkerCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">World Map</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWikiMarkers(!showWikiMarkers)}
            className={`text-xs transition-colors ${
              showWikiMarkers ? "text-accent" : "text-text-secondary/50"
            }`}
          >
            Wiki Icons {wikiMarkerCount > 0 && `(${wikiMarkerCount.toLocaleString()})`}
          </button>
          <span className="text-xs text-text-secondary/30">
            OSRS Wiki tiles
          </span>
        </div>
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
