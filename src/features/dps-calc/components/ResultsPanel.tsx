import { useMemo } from "react";
import MonsterSearch from "./MonsterSearch";
import DpsBreakdown from "./DpsBreakdown";
import HitDistributionChart from "./HitDistributionChart";
import { killTimeStats } from "../../../lib/formulas/hitDistribution";
import { incomingDps } from "../../../lib/formulas/incomingDps";
import type { DpsState } from "../hooks/useDpsState";

interface ResultsPanelProps {
  state: DpsState;
}

function formatSeconds(seconds: number): string {
  if (!isFinite(seconds)) return "--";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
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
    arsenalResults,
    applyLoadout,
    activeLoadout,
    setActiveLoadout,
    effectiveAttackSpeed,
    gearBonuses,
    defenceLevel,
    magicLevel,
    stance,
    bonusMode,
  } = state;

  // Exact kill time from the damage distribution — overkill-aware, unlike
  // the hp / dps figure inside `result.ttk`.
  const killStats = useMemo(
    () => killTimeStats(result.maxHit, result.accuracy, targetHp, effectiveAttackSpeed),
    [result.maxHit, result.accuracy, targetHp, effectiveAttackSpeed]
  );

  const phaseKillTimes = useMemo(
    () =>
      phaseResults.map(({ monster, result: pr }) =>
        killTimeStats(pr.maxHit, pr.accuracy, monster.hitpoints, effectiveAttackSpeed)
      ),
    [phaseResults, effectiveAttackSpeed]
  );

  // Sustain: what the monster does back. Gear defences only exist in
  // equipment mode; manual mode has no defensive inputs to work from.
  const sustain = useMemo(() => {
    if (!selectedMonster || bonusMode !== "equipment") return null;
    return incomingDps(selectedMonster, {
      defenceLevel,
      magicLevel,
      defStab: gearBonuses.defenceStab,
      defSlash: gearBonuses.defenceSlash,
      defCrush: gearBonuses.defenceCrush,
      defMagic: gearBonuses.defenceMagic,
      defRanged: gearBonuses.defenceRanged,
      stanceDefenceBonus: stance.defenceBonus,
    });
  }, [selectedMonster, bonusMode, defenceLevel, magicLevel, gearBonuses, stance.defenceBonus]);

  const damagePerKill =
    sustain && killStats && isFinite(killStats.expectedSeconds)
      ? sustain.worst.dps * killStats.expectedSeconds
      : null;

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
              <input type="number" min={1} max={500} value={customDef.defLevel} onChange={(e) => setCustomDef((p) => ({ ...p, defLevel: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-secondary/50">Def Bonus</label>
              <input type="number" min={-100} max={500} value={customDef.defBonus} onChange={(e) => setCustomDef((p) => ({ ...p, defBonus: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-text-secondary/50">HP</label>
              <input type="number" min={1} max={10000} value={customDef.hp} onChange={(e) => setCustomDef((p) => ({ ...p, hp: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors mt-0.5" />
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
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors mt-1"
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
                  <input type="number" min={0} max={600} value={toaInvocation} onChange={(e) => setToaInvocation(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary/50">CoX Party Size</label>
                  <input type="number" min={1} max={100} value={coxPartySize} onChange={(e) => setCoxPartySize(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors mt-1" />
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
          className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
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
                <div className="text-lg font-bold text-text-primary tabular-nums">{specResult.specMaxHit}</div>
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
                className="px-2 py-1.5 rounded-lg bg-bg-tertiary border border-border text-xs text-text-primary focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
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
          ttk={killStats?.expectedSeconds ?? result.ttk}
          attackRoll={result.attackRoll}
          defenseRoll={result.defenseRoll}
          showDetails={showBreakdown}
        />
        {killStats && (
          <div className="mt-2 text-[10px] text-text-secondary tabular-nums">
            ≈{killStats.expectedAttacks.toFixed(1)} hits to kill
            {killStats.medianSeconds !== null && (
              <> · 50% by <span className="text-text-primary">{formatSeconds(killStats.medianSeconds)}</span></>
            )}
            {killStats.p90Seconds !== null && (
              <> · 90% by <span className="text-text-primary">{formatSeconds(killStats.p90Seconds)}</span></>
            )}
            <span className="text-text-secondary/40"> · overkill-aware</span>
          </div>
        )}
        <div className="mt-4">
          <HitDistributionChart maxHit={result.maxHit} accuracy={result.accuracy} />
        </div>
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
                {phaseResults.map(({ phase, monster, result: pr }, phaseIdx) => {
                  const accColor = pr.accuracy >= 0.8 ? "text-success" : pr.accuracy >= 0.5 ? "text-warning" : "text-danger";
                  const phaseTtk = phaseKillTimes[phaseIdx]?.expectedSeconds ?? pr.ttk;
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
                        {formatSeconds(phaseTtk)}
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
                    {formatSeconds(
                      phaseResults.reduce(
                        (sum, p, i) => sum + (phaseKillTimes[i]?.expectedSeconds ?? p.result.ttk),
                        0
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Arsenal — every saved loadout vs this target */}
        {arsenalResults.length > 0 && (
          <div className="mt-4 rounded-lg border border-border/40 overflow-hidden">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-secondary/50 border-b border-border/40">
              Your Arsenal vs This Target
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-text-secondary">
                  <th className="text-left px-3 py-1.5">Loadout</th>
                  <th className="text-right px-3 py-1.5">Acc</th>
                  <th className="text-right px-3 py-1.5">Max</th>
                  <th className="text-right px-3 py-1.5">DPS</th>
                  <th className="text-right px-3 py-1.5">vs Now</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {arsenalResults.map(({ loadout, result: lr }) => {
                  const accColor = lr.accuracy >= 0.8 ? "text-success" : lr.accuracy >= 0.5 ? "text-warning" : "text-danger";
                  const delta = lr.dps - result.dps;
                  const isActive = activeLoadout === loadout.name;
                  return (
                    <tr
                      key={loadout.name}
                      className={`border-b border-border/20 transition-colors ${
                        isActive ? "bg-accent/5" : "even:bg-bg-primary/25"
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        <span className="font-medium">{loadout.name}</span>
                        <span className="ml-1.5 text-[10px] text-text-secondary/50 capitalize">{loadout.combatStyle}</span>
                      </td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${accColor}`}>{(lr.accuracy * 100).toFixed(0)}%</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary">{lr.maxHit}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-accent">{lr.dps.toFixed(2)}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums text-xs ${
                        delta > 0.005 ? "text-success" : delta < -0.005 ? "text-danger" : "text-text-secondary/50"
                      }`}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => { applyLoadout(loadout); setActiveLoadout(loadout.name); }}
                          className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-3 py-1.5 text-[10px] text-text-secondary/40 border-t border-border/40">
              Computed with your current levels against this target. Each loadout rolls its own style&apos;s defence.
            </div>
          </div>
        )}
      </div>

      {/* Sustain — incoming damage */}
      {sustain && (
        <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-4">
          <div className="section-kicker mb-2">Sustain — Damage Taken</div>
          <div className="space-y-1.5">
            {sustain.threats.map((t) => (
              <div key={t.attackType} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary capitalize">
                  {t.style}
                  <span className="text-text-secondary/40 ml-1">({(t.accuracy * 100).toFixed(0)}% vs you)</span>
                </span>
                <span className="tabular-nums font-medium text-warning">{t.dps.toFixed(2)} dmg/s</span>
              </div>
            ))}
          </div>
          {damagePerKill !== null && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold text-warning tabular-nums">{Math.round(damagePerKill)}</div>
                <div className="text-[10px] text-text-secondary">Dmg / Kill</div>
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary tabular-nums">{Math.ceil(damagePerKill / 20)}</div>
                <div className="text-[10px] text-text-secondary">Sharks / Kill</div>
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary tabular-nums">
                  {Math.round((sustain.worst.dps * 3600) / 20)}
                </div>
                <div className="text-[10px] text-text-secondary">Sharks / Hour</div>
              </div>
            </div>
          )}
          <p className="mt-2 text-[10px] text-text-secondary/40">
            Worst attack style, no protection prayers{sustain.assumedAttackSpeed ? ", assumed 4-tick attack speed" : ""}.
            Sharks heal 20.
          </p>
        </div>
      )}
    </div>
  );
}
