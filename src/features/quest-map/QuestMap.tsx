import { useState, useMemo, useRef, useCallback } from "react";
import { QUESTS, type Quest } from "../../lib/data/quests";

type QuestStatus = "completed" | "available" | "locked";
const COMPLETED_KEY = "runewise_completed_quests";

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}
function saveCompleted(set: Set<string>) {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

const DIFFICULTY_ORDER = ["Novice", "Intermediate", "Experienced", "Master", "Grandmaster", "Special"];

// Topological sort: quests with no prereqs first, Grandmaster last
function topoSort(quests: Quest[]): Quest[][] {
  const nameMap = new Map(quests.map((q) => [q.name, q]));
  const depthMap = new Map<string, number>();

  function getDepth(name: string, visited = new Set<string>()): number {
    if (depthMap.has(name)) return depthMap.get(name)!;
    if (visited.has(name)) return 0;
    visited.add(name);
    const quest = nameMap.get(name);
    if (!quest || quest.questRequirements.length === 0) {
      depthMap.set(name, 0);
      return 0;
    }
    const maxPrereqDepth = Math.max(
      ...quest.questRequirements.map((r) => getDepth(r, new Set(visited)))
    );
    const depth = maxPrereqDepth + 1;
    depthMap.set(name, depth);
    return depth;
  }

  quests.forEach((q) => getDepth(q.name));

  const maxDepth = Math.max(...depthMap.values(), 0);
  const layers: Quest[][] = Array.from({ length: maxDepth + 1 }, () => []);

  quests.forEach((q) => {
    const depth = depthMap.get(q.name) ?? 0;
    layers[depth]?.push(q);
  });

  // Within each layer, sort by difficulty then alphabetically
  layers.forEach((layer) => {
    layer.sort((a, b) => {
      const di = DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
      return di !== 0 ? di : a.name.localeCompare(b.name);
    });
  });

  return layers.filter((l) => l.length > 0);
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Novice: "#6b7280",
  Intermediate: "#22c55e",
  Experienced: "#fde047",
  Master: "#a78bfa",
  Grandmaster: "#fb923c",
  Special: "#60a5fa",
};

const NODE_R = 22;
const H_GAP = 80;
const V_GAP = 70;

type FilterMode = "all" | "available" | "near-unlock";

interface NodeData {
  quest: Quest;
  x: number;
  y: number;
  status: QuestStatus;
}

export default function QuestMap() {
  const [completed, setCompleted] = useState<Set<string>>(loadCompleted);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  // Pan state
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const getStatus = useCallback((quest: Quest): QuestStatus => {
    if (completed.has(quest.name)) return "completed";
    const prereqsMet = quest.questRequirements.every((r) => completed.has(r));
    return prereqsMet ? "available" : "locked";
  }, [completed]);

  const layers = useMemo(() => topoSort(QUESTS), []);

  // Build node positions
  const allNodes = useMemo<NodeData[]>(() => {
    const nodes: NodeData[] = [];
    let totalWidth = 0;

    layers.forEach((layer, li) => {
      const layerWidth = layer.length * (NODE_R * 2 + H_GAP) - H_GAP;
      totalWidth = Math.max(totalWidth, layerWidth);
      layer.forEach((quest, qi) => {
        const x = qi * (NODE_R * 2 + H_GAP) + NODE_R;
        const y = li * (NODE_R * 2 + V_GAP) + NODE_R + 10;
        nodes.push({ quest, x, y, status: getStatus(quest) });
      });
    });

    return nodes;
  }, [layers, getStatus]);

  const svgWidth = Math.max(...layers.map((l) => l.length)) * (NODE_R * 2 + H_GAP) + NODE_R * 2;
  const svgHeight = layers.length * (NODE_R * 2 + V_GAP) + 30;

  const nodeMap = useMemo(
    () => new Map(allNodes.map((n) => [n.quest.name, n])),
    [allNodes]
  );

  // Compute edges
  const edges = useMemo(() => {
    const result: { from: NodeData; to: NodeData }[] = [];
    allNodes.forEach((node) => {
      node.quest.questRequirements.forEach((prereq) => {
        const from = nodeMap.get(prereq);
        if (from) result.push({ from, to: node });
      });
    });
    return result;
  }, [allNodes, nodeMap]);

  const selectedNode = selected ? nodeMap.get(selected) ?? null : null;

  // Highlight set for selected quest
  const highlightedPrereqs = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>();
    function walk(name: string) {
      const node = nodeMap.get(name);
      if (!node) return;
      node.quest.questRequirements.forEach((r) => {
        if (!set.has(r)) {
          set.add(r);
          walk(r);
        }
      });
    }
    walk(selected);
    return set;
  }, [selected, nodeMap]);

  const highlightedDescendants = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>();
    function walk(name: string) {
      allNodes.forEach((n) => {
        if (n.quest.questRequirements.includes(name) && !set.has(n.quest.name)) {
          set.add(n.quest.name);
          walk(n.quest.name);
        }
      });
    }
    walk(selected);
    return set;
  }, [selected, allNodes]);

  const visibleNodes = useMemo(() => {
    if (filter === "all") return allNodes;
    if (filter === "available") return allNodes.filter((n) => n.status === "available");
    if (filter === "near-unlock") {
      return allNodes.filter((n) => {
        if (n.status !== "locked") return false;
        const lockedPrereqs = n.quest.questRequirements.filter((r) => !completed.has(r));
        return lockedPrereqs.length === 1;
      });
    }
    return allNodes;
  }, [allNodes, filter, completed]);

  const visibleSet = useMemo(() => new Set(visibleNodes.map((n) => n.quest.name)), [visibleNodes]);

  const toggleComplete = (name: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      saveCompleted(next);
      return next;
    });
  };

  // Pointer panning
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).closest("circle")) return;
    setIsPanning(true);
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.px + e.clientX - panStart.current.mx,
      y: panStart.current.py + e.clientY - panStart.current.my,
    });
  };
  const onPointerUp = () => setIsPanning(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Quest Map</h2>
        <p className="text-sm text-text-secondary mt-1">
          Dependency graph — layered by quest requirements. Click a quest to highlight its chain.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        {([
          { id: "all", label: "Show All" },
          { id: "available", label: "Only Available" },
          { id: "near-unlock", label: "1 Quest Away" },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === f.id ? "bg-accent text-on-accent" : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-text-secondary/50 ml-2">
          {visibleNodes.length} quests · {completed.size} completed
        </span>
        <div className="ml-auto flex gap-3">
          {DIFFICULTY_ORDER.map((d) => (
            <span key={d} className="flex items-center gap-1 text-[10px] text-text-secondary/60">
              <span className="w-2 h-2 rounded-full" style={{ background: DIFFICULTY_COLORS[d] }} />
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-4 overflow-hidden" style={{ height: Math.min(svgHeight + 40, 520) }}>
        {/* SVG graph */}
        <div
          className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-bg-primary/40 relative cursor-grab active:cursor-grabbing"
          style={{ minHeight: 400 }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, userSelect: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Edges */}
            <g>
              {edges
                .filter((e) => visibleSet.has(e.from.quest.name) && visibleSet.has(e.to.quest.name))
                .map(({ from, to }) => {
                  const isHighlighted =
                    selected &&
                    (to.quest.name === selected && highlightedPrereqs.has(from.quest.name)) ||
                    (from.quest.name === selected && highlightedDescendants.has(to.quest.name));
                  return (
                    <line
                      key={`${from.quest.name}->${to.quest.name}`}
                      x1={from.x} y1={from.y + NODE_R}
                      x2={to.x} y2={to.y - NODE_R}
                      stroke={isHighlighted ? "rgba(250,204,21,0.7)" : "rgba(250,204,21,0.15)"}
                      strokeWidth={isHighlighted ? 2 : 1}
                    />
                  );
                })}
            </g>

            {/* Nodes */}
            {visibleNodes.map(({ quest, x, y, status }) => {
              const color = DIFFICULTY_COLORS[quest.difficulty] ?? "#6b7280";
              const isSelected = selected === quest.name;
              const isPrereq = highlightedPrereqs.has(quest.name);
              const isDescendant = highlightedDescendants.has(quest.name);
              const dimmed = selected && !isSelected && !isPrereq && !isDescendant;

              return (
                <g
                  key={quest.name}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => setSelected(isSelected ? null : quest.name)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Status ring */}
                  <circle
                    r={NODE_R + 3}
                    fill="none"
                    stroke={
                      status === "completed" ? "#22c55e" :
                      status === "available" ? "#60a5fa" :
                      "transparent"
                    }
                    strokeWidth={1.5}
                    opacity={dimmed ? 0.2 : 0.7}
                  />
                  {/* Main circle */}
                  <circle
                    r={NODE_R}
                    fill={isSelected ? color : `${color}33`}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={dimmed ? 0.2 : 1}
                  />
                  {/* Status dot */}
                  <circle
                    r={4}
                    cx={NODE_R - 4}
                    cy={-NODE_R + 4}
                    fill={status === "completed" ? "#22c55e" : status === "available" ? "#60a5fa" : "#6b7280"}
                    opacity={dimmed ? 0.2 : 1}
                  />
                  {/* QP badge */}
                  {quest.questPoints > 0 && (
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fontSize={9}
                      fill={dimmed ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.8)"}
                      fontWeight={600}
                    >
                      {quest.questPoints}QP
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-2 right-2 text-[10px] text-text-secondary/30">
            Drag to pan
          </div>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-64 shrink-0 rounded-xl border border-border/60 bg-bg-tertiary p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold leading-snug">{selectedNode.quest.name}</h3>
                <span
                  className="text-xs font-medium"
                  style={{ color: DIFFICULTY_COLORS[selectedNode.quest.difficulty] }}
                >
                  {selectedNode.quest.difficulty}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-text-secondary/50 hover:text-text-primary text-sm shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 text-xs text-text-secondary">
              <span>{selectedNode.quest.questPoints} QP</span>
              <span>·</span>
              <span>{selectedNode.quest.length}</span>
              <span>·</span>
              <span>{selectedNode.quest.members ? "Members" : "F2P"}</span>
            </div>

            {selectedNode.quest.questRequirements.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-1.5">Prerequisites</div>
                <div className="space-y-1">
                  {selectedNode.quest.questRequirements.map((r) => (
                    <div key={r} className="flex items-center gap-1.5 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${completed.has(r) ? "bg-success" : "bg-danger"}`} />
                      <span className={completed.has(r) ? "text-text-secondary line-through" : "text-text-primary"}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.quest.skillRequirements.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-1.5">Skill Requirements</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.quest.skillRequirements.map((r, ri) => (
                    <span key={`${r.skill}-${r.level}-${ri}`} className="bg-bg-secondary text-xs px-2 py-0.5 rounded">
                      {r.skill} {r.level}{r.boostable ? "*" : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {highlightedDescendants.size > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-1.5">Unlocks ({highlightedDescendants.size})</div>
                <div className="space-y-0.5 max-h-28 overflow-y-auto">
                  {[...highlightedDescendants].slice(0, 8).map((name) => (
                    <div key={name} className="text-xs text-text-secondary truncate">{name}</div>
                  ))}
                  {highlightedDescendants.size > 8 && (
                    <div className="text-[10px] text-text-secondary/50">+{highlightedDescendants.size - 8} more</div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => toggleComplete(selectedNode.quest.name)}
              className={`w-full rounded-lg py-2 text-xs font-medium transition-colors ${
                completed.has(selectedNode.quest.name)
                  ? "bg-success/20 text-success hover:bg-success/30"
                  : "bg-accent/15 text-accent hover:bg-accent/25"
              }`}
            >
              {completed.has(selectedNode.quest.name) ? "Mark Incomplete" : "Mark Complete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
