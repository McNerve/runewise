import { useState, useRef } from "react";
import type { DpsState } from "../hooks/useDpsState";
import type { GearLoadout } from "../hooks/useDpsState";
import { MONSTERS } from "../../../lib/data/monsters";

interface LoadoutManagerProps {
  state: DpsState;
}

// Toast pill shown after save
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-bg-tertiary border border-border text-sm text-text-primary shadow-lg animate-fade-in"
      onAnimationEnd={onDone}
    >
      {message}
    </div>
  );
}

const STYLE_ICON: Record<string, string> = {
  melee: "⚔️",
  ranged: "🏹",
  magic: "🔮",
};

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(2);
}

// Inline save form — shown as a small expansion below the Save button
function SaveForm({
  state,
  onSaved,
}: {
  state: DpsState;
  onSaved: (name: string) => void;
}) {
  const { loadoutName, setLoadoutName, saveLoadout, wikiMonsters } = state;
  const [contentTag, setContentTag] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const monsterNames = [
    ...MONSTERS.map((m) => m.name),
    ...wikiMonsters.map((m) => m.name),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const handleTagInput = (v: string) => {
    setContentTag(v);
    if (v.length >= 2) {
      setSuggestions(
        monsterNames
          .filter((n) => n.toLowerCase().includes(v.toLowerCase()))
          .slice(0, 6)
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSave = () => {
    saveLoadout({ contentTag: contentTag.trim() || undefined, note: note.trim() || undefined });
    const name = loadoutName.trim();
    setContentTag("");
    setNote("");
    setShowForm(false);
    setSuggestions([]);
    onSaved(name);
  };

  if (!showForm) {
    return (
      <div className="flex gap-1.5">
        <input
          type="text"
          value={loadoutName}
          onChange={(e) => setLoadoutName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && loadoutName.trim()) setShowForm(true);
          }}
          placeholder="Save as..."
          aria-label="Loadout name"
          className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
        />
        <button
          onClick={() => loadoutName.trim() && setShowForm(true)}
          disabled={!loadoutName.trim()}
          className="px-3 py-1.5 text-xs font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 bg-bg-secondary/50 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-primary">{loadoutName}</span>
        <button onClick={() => setShowForm(false)} className="text-text-secondary/50 hover:text-text-primary text-xs">✕</button>
      </div>
      <div className="relative">
        <input
          type="text"
          value={contentTag}
          onChange={(e) => handleTagInput(e.target.value)}
          placeholder="Content tag (e.g. Zulrah, ToA Expert)"
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-xs"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-bg-tertiary border border-border rounded-lg overflow-hidden shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setContentTag(s); setSuggestions([]); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-secondary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        rows={2}
        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-xs resize-none"
      />
      <div className="flex gap-1.5 justify-end">
        <button
          onClick={() => setShowForm(false)}
          className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-xs font-medium bg-accent text-on-accent rounded-lg hover:bg-accent-hover transition-colors"
        >
          Confirm Save
        </button>
      </div>
    </div>
  );
}

// My Loadouts panel
function MyLoadoutsPanel({ state }: { state: DpsState }) {
  const { loadouts, applyLoadout, setActiveLoadout, deleteLoadout, duplicateLoadout, importLoadouts } = state;
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, loadouts }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "runewise-loadouts.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const incoming: GearLoadout[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.loadouts)
            ? parsed.loadouts
            : [];
        if (incoming.length > 0) importLoadouts(incoming);
      } catch {
        // Invalid JSON — ignore
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (loadouts.length === 0) {
    return (
      <div className="text-xs text-text-secondary/50 text-center py-3">
        No saved loadouts
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="section-kicker">My Loadouts</div>
        <div className="flex gap-1.5">
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[10px] px-2 py-1 bg-bg-tertiary border border-border rounded-md hover:bg-bg-secondary transition-colors text-text-secondary hover:text-text-primary"
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="text-[10px] px-2 py-1 bg-bg-tertiary border border-border rounded-md hover:bg-bg-secondary transition-colors text-text-secondary hover:text-text-primary"
          >
            Export
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {loadouts.map((l) => (
          <div
            key={l.name}
            className="flex items-start gap-2 p-2.5 bg-bg-tertiary rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium text-text-primary truncate">{l.name}</span>
                <span title={l.combatStyle}>{STYLE_ICON[l.combatStyle]}</span>
                {l.contentTag && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-accent/15 text-accent rounded">
                    {l.contentTag}
                  </span>
                )}
              </div>
              {(l.dps != null || l.maxHit != null) && (
                <div className="text-[11px] text-text-secondary mt-0.5">
                  {l.dps != null && <span>{fmt(l.dps)} DPS</span>}
                  {l.dps != null && l.maxHit != null && <span className="mx-1">·</span>}
                  {l.maxHit != null && <span>max {l.maxHit}</span>}
                </div>
              )}
              {l.note && (
                <div className="text-[11px] text-text-secondary/60 mt-0.5 line-clamp-1">{l.note}</div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => { applyLoadout(l); setActiveLoadout(l.name); }}
                className="text-[10px] px-2 py-1 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => duplicateLoadout(l.name)}
                className="text-[10px] px-2 py-1 text-text-secondary/60 hover:text-text-primary rounded hover:bg-bg-secondary transition-colors"
                title="Duplicate"
              >
                ⎘
              </button>
              <button
                onClick={() => deleteLoadout(l.name)}
                className="text-[10px] px-2 py-1 text-text-secondary/40 hover:text-danger rounded hover:bg-bg-secondary transition-colors"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoadoutManager({ state }: LoadoutManagerProps) {
  const {
    loadouts,
    activeLoadout,
    setActiveLoadout,
    applyLoadout,
    deleteLoadout,
    clearGear,
    applyPreset,
    GEAR_PRESETS,
  } = state;

  const [toast, setToast] = useState<string | null>(null);
  const [showMyLoadouts, setShowMyLoadouts] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (name: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(`Loadout "${name}" saved`);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  return (
    <>
      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="section-kicker mb-1.5">Preset</div>
            <select
              value=""
              onChange={(e) => {
                const preset = GEAR_PRESETS.find((p) => p.name === e.target.value);
                if (preset) applyPreset(preset);
              }}
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Load a preset...</option>
              <optgroup label="Melee">
                {GEAR_PRESETS.filter((p) => p.style === "melee").map((p) => (
                  <option key={p.name} value={p.name}>{p.name} — {p.description}</option>
                ))}
              </optgroup>
              <optgroup label="Ranged">
                {GEAR_PRESETS.filter((p) => p.style === "ranged").map((p) => (
                  <option key={p.name} value={p.name}>{p.name} — {p.description}</option>
                ))}
              </optgroup>
              <optgroup label="Magic">
                {GEAR_PRESETS.filter((p) => p.style === "magic").map((p) => (
                  <option key={p.name} value={p.name}>{p.name} — {p.description}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="section-kicker">Loadout</div>
              <div className="flex gap-2">
                {loadouts.length > 0 && (
                  <button
                    onClick={() => setShowMyLoadouts((v) => !v)}
                    className="text-[10px] text-accent hover:text-accent-hover transition-colors"
                  >
                    {showMyLoadouts ? "Hide" : `My loadouts (${loadouts.length})`}
                  </button>
                )}
                <button
                  onClick={clearGear}
                  className="text-[10px] text-text-secondary/40 hover:text-danger transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {loadouts.length > 0 ? (
              <div className="flex gap-1.5">
                <select
                  value={activeLoadout ?? ""}
                  onChange={(e) => {
                    const l = loadouts.find((lo) => lo.name === e.target.value);
                    if (l) { applyLoadout(l); setActiveLoadout(l.name); }
                  }}
                  className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="">Select loadout...</option>
                  {loadouts.map((l) => (
                    <option key={l.name} value={l.name}>{l.name} ({l.combatStyle})</option>
                  ))}
                </select>
                {activeLoadout && (
                  <button
                    onClick={() => { deleteLoadout(activeLoadout); setActiveLoadout(null); }}
                    className="px-2 py-1.5 text-xs text-text-secondary/40 hover:text-danger transition-colors"
                    title="Delete"
                  >
                    &times;
                  </button>
                )}
              </div>
            ) : null}

            <div className="mt-1.5">
              <SaveForm state={state} onSaved={showToast} />
            </div>
          </div>
        </div>

        {showMyLoadouts && <MyLoadoutsPanel state={state} />}
      </div>
    </>
  );
}
