import type { DpsState } from "../hooks/useDpsState";

interface LoadoutManagerProps {
  state: DpsState;
}

export default function LoadoutManager({ state }: LoadoutManagerProps) {
  const {
    loadouts,
    loadoutName,
    setLoadoutName,
    activeLoadout,
    setActiveLoadout,
    saveLoadout,
    applyLoadout,
    deleteLoadout,
    clearGear,
    applyPreset,
    GEAR_PRESETS,
  } = state;

  return (
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
          <button
            onClick={clearGear}
            className="text-[10px] text-text-secondary/40 hover:text-danger transition-colors"
          >
            Clear
          </button>
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
                onClick={() => { if (activeLoadout) deleteLoadout(activeLoadout); setActiveLoadout(null); }}
                className="px-2 py-1.5 text-xs text-text-secondary/40 hover:text-danger transition-colors"
                title="Delete"
              >&times;</button>
            )}
          </div>
        ) : (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={loadoutName}
              onChange={(e) => setLoadoutName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveLoadout()}
              placeholder="Save as..."
              aria-label="Loadout name"
              className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              onClick={saveLoadout}
              disabled={!loadoutName.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-40"
            >Save</button>
          </div>
        )}
      </div>
    </div>
  );
}
