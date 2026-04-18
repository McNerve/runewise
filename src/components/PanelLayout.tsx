import { useState, useCallback, useRef } from "react";
import type { View } from "../lib/NavigationContext";
import { loadJSON, saveJSON } from "../lib/localStorage";

const STORAGE_KEY = "runewise_panels";
const MIN_WIDTH = 300;

interface Panel {
  id: number;
  view: View;
  width: number;
}

interface PanelLayoutProps {
  renderView: (view: View) => React.ReactNode;
  currentView: View;
}

export default function PanelLayout({ renderView, currentView }: PanelLayoutProps) {
  const [panels, setPanels] = useState<Panel[]>(() =>
    loadJSON<Panel[]>(STORAGE_KEY, [{ id: 1, view: currentView, width: 0 }])
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ index: number; startX: number; startWidths: number[] } | null>(null);

  const persist = useCallback((p: Panel[]) => {
    saveJSON(STORAGE_KEY, p);
  }, []);

  const save = useCallback((next: Panel[]) => {
    setPanels(next);
    persist(next);
  }, [persist]);

  const addPanel = () => {
    if (panels.length >= 3) return;
    save([...panels, { id: Date.now(), view: currentView, width: 0 }]);
  };

  const removePanel = (id: number) => {
    if (panels.length <= 1) return;
    save(panels.filter((p) => p.id !== id));
  };

  const setView = (id: number, view: View) => {
    save(panels.map((p) => (p.id === id ? { ...p, view } : p)));
  };

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const totalWidth = container.clientWidth;
    const equalWidth = totalWidth / panels.length;
    const startWidths = panels.map((p) => p.width || equalWidth);
    dragging.current = { index, startX: e.clientX, startWidths };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const { index, startX, startWidths } = dragging.current;
    const delta = e.clientX - startX;
    const newWidths = [...startWidths];
    newWidths[index] = Math.max(MIN_WIDTH, startWidths[index] + delta);
    newWidths[index + 1] = Math.max(MIN_WIDTH, startWidths[index + 1] - delta);
    setPanels((prev) => prev.map((p, i) => ({ ...p, width: newWidths[i] })));
  };

  const handlePointerUp = () => {
    if (dragging.current) {
      persist(panels);
    }
    dragging.current = null;
  };

  const gridCols = panels
    .map((p) => (p.width ? `${p.width}px` : "1fr"))
    .join(" ");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-border bg-bg-secondary/50">
        <span className="text-[10px] text-text-secondary/50">Panels</span>
        {panels.length < 3 && (
          <button
            onClick={addPanel}
            className="text-[10px] px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          >
            + Split
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="flex-1 grid overflow-hidden"
        style={{ gridTemplateColumns: gridCols }}
      >
        {panels.map((panel, i) => (
          <div key={panel.id} className="flex">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-1 px-2 py-1 bg-bg-secondary/30 border-b border-border/30">
                <select
                  value={panel.view}
                  onChange={(e) => setView(panel.id, e.target.value as View)}
                  className="text-xs bg-transparent text-text-secondary flex-1 outline-none"
                >
                  {["overview", "skill-calc", "combat-calc", "dry-calc", "ge", "item-db",
                    "xp-table", "drops", "tracker", "bosses", "quests", "diaries", "slayer",
                    "news", "alch-calc", "dps-calc", "watchlist", "boss-loot",
                    "timers", "clue-helper", "combat-tasks", "money-making", "pet-calc", "stars",
                  ].map((v) => (
                    <option key={v} value={v}>{v.replace(/-/g, " ")}</option>
                  ))}
                </select>
                {panels.length > 1 && (
                  <button
                    onClick={() => removePanel(panel.id)}
                    aria-label="Remove panel"
                    className="text-[10px] text-text-secondary/50 hover:text-danger transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 scroll-fade">
                {renderView(panel.view)}
              </div>
            </div>
            {i < panels.length - 1 && (
              <div
                className="w-1 bg-border/30 hover:bg-accent/30 cursor-col-resize transition-colors shrink-0"
                onPointerDown={(e) => handlePointerDown(i, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
