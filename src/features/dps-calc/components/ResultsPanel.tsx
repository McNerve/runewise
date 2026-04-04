import MonsterSearch from "./MonsterSearch";
import DpsBreakdown from "./DpsBreakdown";
import type { DpsState } from "../hooks/useDpsState";

interface ResultsPanelProps {
  state: DpsState;
}

export default function ResultsPanel({ state }: ResultsPanelProps) {
  const {
    combatStyle,
    selectedMonster,
    setSelectedMonster,
    wikiMonsters,
    ensureMonsters,
    isCustom,
    customDef,
    setCustomDef,
    defReductions,
    setDefReductions,
    showRaidScaling,
    setShowRaidScaling,
    toaInvocation,
    setToaInvocation,
    coxPartySize,
    setCoxPartySize,
    baseDefLevel,
    baseHp,
    targetDefLevel,
    targetHp,
    phaseMonsters,
    phaseResults,
    specWeapons,
    selectedSpec,
    setSelectedSpec,
    specResult,
    result,
    totalDps,
    poisonType,
    setPoisonType,
    poisonDpsValue,
    showBreakdown,
    setShowBreakdown,
    loadouts,
    compareLoadout,
    setCompareLoadout,
    comparisonResult,
  } = state;

  return (
    <div className="lg:sticky lg:top-4 lg:self-start space-y-5">
      {/* Target */}
      <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-4">
        <div className="section-kicker mb-2">Target</div>
        <MonsterSearch
          monsters={wikiMonsters}
          selected={selectedMonster}
          onSelect={setSelectedMonster}
          combatStyle={combatStyle}
          onFocusLoad={ensureMonsters}
        />

        {phaseMonsters.length > 1 && (
          <div className="mt-2">
            <div className="text-[10px] uppercase tracking-wider text-text-secondary/50 mb-1.5">
              Phases — {selectedMonster?.name}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phaseMonsters.map(({ phase, monster }) => (
                <button
                  key={phase.version}
                  onClick={() => setSelectedMonster(monster)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    selectedMonster?.version === phase.version
                      ? "bg-accent/15 ring-1 ring-accent/50 text-text-primary"
                      : "bg-bg-tertiary/40 text-text-secondary hover:bg-bg-tertiary border border-border/20"
                  }`}
                >
                  <span className="font-medium">{phase.label}</span>
                  <span className="ml-1.5 text-text-secondary/40">{monster.hitpoints} HP</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isCustom && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>
              <label className="text-[10px] text-text-secondary/50">Def Level</label>
              <input type="number" min={1} max={500} value={customDef.defLevel} onChange={(e) => setCustomDef((p) => ({ ...p, defLevel: Number(e.target.value) }))} className="w-full bg-bg-tertiary border border-border rounded px-2 py-1.5 text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-secondary/50">Def Bonus</label>
              <input type="number" min={-100} max={500} value={customDef.defBonus} onChange={(e) => setCustomDef((p) => ({ ...p, defBonus: Number(e.target.value) }))} className="w-full bg-bg-tertiary border border-border rounded px-2 py-1.5 text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-secondary/50">HP</label>
              <input type="number" min={1} max={10000} value={customDef.hp} onChange={(e) => setCustomDef((p) => ({ ...p, hp: Number(e.target.value) }))} className="w-full bg-bg-tertiary border border-border rounded px-2 py-1.5 text-sm mt-0.5" />
            </div>
          </div>
        )}

        <div className="mt-3 max-w-[120px]">
          <label className="text-[10px] uppercase tracking-wider text-text-secondary/50">DWH Specs</label>
          <input
            type="number"
            min={0}
            max={10}
            value={defReductions}
            onChange={(e) => setDefReductions(Math.min(10, Math.max(0, Number(e.target.value))))}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
          />
        </div>

        <div className="mt-3">
          <button
            onClick={() => setShowRaidScaling(!showRaidScaling)}
            className="text-[10px] uppercase tracking-wider text-text-secondary/50 hover:text-text-primary transition-colors"
          >
            Raid Scaling {showRaidScaling ? "\u25BE" : "\u25B8"}
          </button>
          {showRaidScaling && (
            <>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-text-secondary/50">ToA Invocations</label>
                  <input type="number" min={0} max={600} value={toaInvocation} onChange={(e) => setToaInvocation(Number(e.target.value))} className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary/50">CoX Party Size</label>
                  <input type="number" min={1} max={100} value={coxPartySize} onChange={(e) => setCoxPartySize(Number(e.target.value))} className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm mt-1" />
                </div>
              </div>
              {(toaInvocation !== 0 || coxPartySize !== 1) && (
                <div className="mt-2 text-[10px] text-text-secondary/50">
                  {toaInvocation !== 0 && (
                    <span>Def: {baseDefLevel} {"\u2192"} <span className="text-warning">{targetDefLevel}</span> &middot; HP: {baseHp} {"\u2192"} <span className="text-warning">{targetHp}</span></span>
                  )}
                  {coxPartySize !== 1 && (
                    <span>HP: {baseHp} {"\u2192"} <span className="text-warning">{targetHp}</span> ({coxPartySize} players)</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Spec Weapon */}
      <div>
        <div className="section-kicker mb-2">Special Attack</div>
        <select
          value={selectedSpec?.id ?? ""}
          onChange={(e) => {
            const spec = specWeapons.find((s) => s.id === e.target.value) ?? null;
            setSelectedSpec(spec);
          }}
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">None</option>
          {specWeapons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.specName} ({s.specCost}%)
            </option>
          ))}
        </select>
        {selectedSpec && specResult && (
          <div className="mt-2 rounded-lg border border-border/40 bg-bg-tertiary/30 p-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-accent tabular-nums">{specResult.specMaxHit}</div>
                <div className="text-[10px] text-text-secondary">Spec Max</div>
              </div>
              <div>
                <div className={`text-lg font-bold tabular-nums ${
                  specResult.specAccuracy >= 0.8 ? "text-success" : specResult.specAccuracy >= 0.5 ? "text-warning" : "text-danger"
                }`}>
                  {(specResult.specAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-text-secondary">Spec Acc</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent tabular-nums">{specResult.specDps.toFixed(2)}</div>
                <div className="text-[10px] text-text-secondary">Spec DPS</div>
              </div>
            </div>
            {selectedSpec.hits > 1 && (
              <div className="mt-1.5 text-[10px] text-text-secondary/50 text-center">
                {selectedSpec.hits} hits &times; {Math.floor(specResult.specMaxHit / selectedSpec.hits)} each
              </div>
            )}
            <div className="mt-1.5 text-[10px] text-text-secondary/40 text-center">{selectedSpec.notes}</div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="section-kicker">Results</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider text-text-secondary/50">Poison</label>
              <select
                value={poisonType}
                onChange={(e) => setPoisonType(e.target.value as "none" | "poison" | "venom")}
                className="bg-bg-tertiary border border-border rounded-lg px-2 py-1 text-xs"
              >
                <option value="none">None</option>
                <option value="poison">Poison (+)</option>
                <option value="venom">Venom</option>
              </select>
            </div>
            <button
              onClick={() => setShowBreakdown((p) => !p)}
              className="text-xs text-text-secondary hover:text-accent transition-colors"
            >
              {showBreakdown ? "Hide" : "Show"} breakdown
            </button>
          </div>
        </div>
        <DpsBreakdown
          maxHit={result.maxHit}
          accuracy={result.accuracy}
          dps={result.dps}
          ttk={result.ttk}
          attackRoll={result.attackRoll}
          defenseRoll={result.defenseRoll}
          showDetails={showBreakdown}
        />
        {poisonType !== "none" && (
          <div className="mt-3 flex gap-6 items-start">
            <div className="text-center">
              <div className="text-sm font-bold text-success">+{poisonDpsValue.toFixed(2)}</div>
              <div className="text-[10px] text-text-secondary capitalize">{poisonType} DPS</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-accent">{totalDps.toFixed(2)}</div>
              <div className="text-[10px] text-text-secondary">Total DPS</div>
            </div>
          </div>
        )}
        {phaseResults.length > 1 && (
          <div className="mt-4 rounded-lg border border-border/40 overflow-hidden">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-secondary/50 border-b border-border/40">
              Per-Phase Breakdown
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-text-secondary">
                  <th className="text-left px-3 py-1.5">Phase</th>
                  <th className="text-right px-3 py-1.5">HP</th>
                  <th className="text-right px-3 py-1.5">Acc</th>
                  <th className="text-right px-3 py-1.5">Max Hit</th>
                  <th className="text-right px-3 py-1.5">DPS</th>
                  <th className="text-right px-3 py-1.5">TTK</th>
                </tr>
              </thead>
              <tbody>
                {phaseResults.map(({ phase, monster, result: pr }) => {
                  const accColor = pr.accuracy >= 0.8 ? "text-success" : pr.accuracy >= 0.5 ? "text-warning" : "text-danger";
                  return (
                    <tr
                      key={phase.version}
                      className={`border-b border-border/20 transition-colors ${
                        selectedMonster?.version === phase.version
                          ? "bg-accent/5"
                          : "even:bg-bg-primary/25"
                      }`}
                    >
                      <td className="px-3 py-1.5 font-medium">{phase.label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">{monster.hitpoints}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${accColor}`}>{(pr.accuracy * 100).toFixed(1)}%</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-accent">{pr.maxHit}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-accent">{pr.dps.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">
                        {pr.ttk < 60 ? `${pr.ttk.toFixed(1)}s` : `${Math.floor(pr.ttk / 60)}m ${Math.round(pr.ttk % 60)}s`}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border/40 bg-bg-tertiary/30">
                  <td className="px-3 py-1.5 font-medium text-text-secondary">Total</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                    {phaseResults.reduce((sum, p) => sum + p.monster.hitpoints, 0)}
                  </td>
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium text-text-primary">
                    {(() => {
                      const totalTtk = phaseResults.reduce((sum, p) => sum + p.result.ttk, 0);
                      return totalTtk < 60 ? `${totalTtk.toFixed(1)}s` : `${Math.floor(totalTtk / 60)}m ${Math.round(totalTtk % 60)}s`;
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Loadout Comparison */}
        {loadouts.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[10px] uppercase tracking-wider text-text-secondary/50">Compare vs</div>
              <select
                value={compareLoadout?.name ?? ""}
                onChange={(e) => {
                  const l = loadouts.find((lo) => lo.name === e.target.value) ?? null;
                  setCompareLoadout(l);
                }}
                className="flex-1 bg-bg-tertiary border border-border rounded-lg px-2 py-1 text-xs"
              >
                <option value="">Select loadout...</option>
                {loadouts.map((l) => (
                  <option key={l.name} value={l.name}>{l.name} ({l.combatStyle})</option>
                ))}
              </select>
            </div>
            {comparisonResult && compareLoadout && (
              <div className="rounded-lg border border-border/40 bg-bg-tertiary/30 p-3">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="text-text-secondary/50 text-[10px] mb-1">{compareLoadout.name}</div>
                    <div className="font-bold tabular-nums">{comparisonResult.setup1.dps.toFixed(2)}</div>
                    <div className="text-[10px] text-text-secondary">DPS</div>
                  </div>
                  <div>
                    <div className="text-text-secondary/50 text-[10px] mb-1">Difference</div>
                    <div className={`font-bold tabular-nums ${
                      comparisonResult.dpsGain > 0 ? "text-success" :
                      comparisonResult.dpsGain < 0 ? "text-danger" :
                      "text-text-secondary"
                    }`}>
                      {comparisonResult.dpsGain > 0 ? "+" : ""}{comparisonResult.dpsGain.toFixed(2)}
                    </div>
                    <div className={`text-[10px] ${
                      comparisonResult.dpsGainPct > 0 ? "text-success" :
                      comparisonResult.dpsGainPct < 0 ? "text-danger" :
                      "text-text-secondary"
                    }`}>
                      {comparisonResult.dpsGainPct > 0 ? "+" : ""}{comparisonResult.dpsGainPct.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary/50 text-[10px] mb-1">Current</div>
                    <div className="font-bold text-accent tabular-nums">{comparisonResult.setup2.dps.toFixed(2)}</div>
                    <div className="text-[10px] text-text-secondary">DPS</div>
                  </div>
                </div>
                {comparisonResult.ttkDiff !== 0 && isFinite(comparisonResult.ttkDiff) && (
                  <div className={`mt-2 text-center text-[10px] ${comparisonResult.ttkDiff > 0 ? "text-success" : "text-danger"}`}>
                    {comparisonResult.ttkDiff > 0 ? "Faster" : "Slower"} by {Math.abs(comparisonResult.ttkDiff).toFixed(1)}s
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
