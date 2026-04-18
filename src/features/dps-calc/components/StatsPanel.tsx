import { type EquipmentSlot } from "../../../lib/api/equipment";
import { type WikiEquipment } from "../../../lib/api/equipment";
import { WIKI_IMG, itemIcon } from "../../../lib/sprites";
import GearSelector from "../GearSelector";
import ModifierToggles from "./ModifierToggles";
import type { DpsState, EquippedGear } from "../hooks/useDpsState";

function StatInput({
  label,
  value,
  onChange,
  min = 1,
  max = 99,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-20 text-xs text-text-secondary shrink-0">
        {label}
      </label>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) =>
            onChange(Math.max(min, Math.min(max, Number(e.target.value))))
          }
          className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm tabular-nums"
        />
        {suffix && (
          <span className="text-[10px] text-text-secondary/50 shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface StatsPanelProps {
  state: DpsState;
}

export default function StatsPanel({ state }: StatsPanelProps) {
  const {
    combatStyle,
    attackLevel,
    setAttackLevel,
    strengthLevel,
    setStrengthLevel,
    rangedLevel,
    setRangedLevel,
    magicLevel,
    setMagicLevel,
    attackBonus,
    setAttackBonus,
    strengthBonus,
    setStrengthBonus,
    attackSpeed,
    setAttackSpeed,
    effectiveAttackBonus,
    effectiveStrengthBonus,
    effectiveAttackSpeed,
    bonusMode,
    setBonusMode,
    equippedGear,
    setEquippedGear,
    openSlot,
    setOpenSlot,
    gearBonuses,
    weaponCombatStyle,
    weaponType,
    weaponSpeed,
    stances,
    stance,
    stanceIdx,
    setStanceIdx,
    filteredPrayers,
    prayer,
    prayerIdx,
    setPrayerIdx,
    activeModifiers,
    toggleModifier,
    selectedSpell,
    setSelectedSpell,
    activeSpellBase,
    hiscores,
    navigate,
    COMBAT_SPELLS,
    magicDartBaseMaxHit,
    spellMaxHit,
  } = state;

  return (
    <div className="space-y-5">
      {/* Stats + Equipment side by side */}
      <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-4">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="section-kicker mb-2">Player Stats</div>
            <div className="space-y-2">
              {combatStyle === "melee" && (
                <>
                  <StatInput label="Attack" value={attackLevel} onChange={setAttackLevel} />
                  <StatInput label="Strength" value={strengthLevel} onChange={setStrengthLevel} />
                </>
              )}
              {combatStyle === "ranged" && (
                <StatInput label="Ranged" value={rangedLevel} onChange={setRangedLevel} />
              )}
              {combatStyle === "magic" && (
                <StatInput label="Magic" value={magicLevel} onChange={setMagicLevel} />
              )}
            </div>
            {hiscores && (
              <p className="text-[10px] text-text-secondary/50 mt-2">
                Auto-loaded from Hiscores
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="section-kicker">Equipment Bonuses</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("gear-compare")}
                  className="text-[11px] text-text-secondary/50 hover:text-accent transition-colors"
                >
                  Compare gear →
                </button>
                <div className="flex gap-1">
                  {(["equipment", "manual"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setBonusMode(m)}
                      aria-pressed={bonusMode === m}
                      className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                        bonusMode === m
                          ? "bg-accent text-white"
                          : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {bonusMode === "equipment" ? (
              <div>
                {/* OSRS-style equipment grid */}
                {(() => {
                  function SlotButton({ slot, label }: { slot: EquipmentSlot | "2h"; label: string }) {
                    const equipped = equippedGear[slot];
                    return (
                      <button
                        onClick={() => setOpenSlot(slot)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (equipped) {
                            setEquippedGear((prev: EquippedGear) => {
                              const next = { ...prev };
                              delete next[slot];
                              return next;
                            });
                          }
                        }}
                        title={equipped ? `${equipped.name} (right-click to clear)` : label}
                        className={`flex flex-col items-center justify-center gap-0.5 w-full aspect-square rounded-lg border transition-colors ${
                          equipped
                            ? "border-accent/40 bg-accent/8 hover:bg-accent/15"
                            : "border-border/40 bg-bg-tertiary/30 hover:bg-bg-tertiary/60"
                        }`}
                      >
                        {equipped ? (
                          <img
                            src={itemIcon(equipped.version ? `${equipped.name}_${equipped.version}` : equipped.name)}
                            alt={equipped.name}
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = itemIcon(equipped.name);
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-text-secondary/30">{label}</span>
                        )}
                      </button>
                    );
                  }
                  return (
                    <div className="grid grid-cols-5 gap-1 mb-2 max-w-[220px] mx-auto">
                      {/* Row 1: Head */}
                      <div /><div /><SlotButton slot="head" label="Head" /><div /><div />
                      {/* Row 2: Cape, Neck, Ammo */}
                      <div /><SlotButton slot="cape" label="Cape" /><SlotButton slot="neck" label="Neck" /><SlotButton slot="ammo" label="Ammo" /><div />
                      {/* Row 3: Weapon, Body, Shield */}
                      <div /><SlotButton slot="weapon" label="Weapon" /><SlotButton slot="body" label="Body" /><SlotButton slot="shield" label="Shield" /><div />
                      {/* Row 4: Legs */}
                      <div /><div /><SlotButton slot="legs" label="Legs" /><div /><div />
                      {/* Row 5: Hands, Feet, Ring */}
                      <div /><SlotButton slot="hands" label="Hands" /><SlotButton slot="feet" label="Feet" /><SlotButton slot="ring" label="Ring" /><div />
                    </div>
                  );
                })()}

                <div className="text-[10px] text-text-secondary/50 space-y-0.5">
                  {combatStyle === "melee" && (
                    <>
                      <div>Atk: <span className={effectiveAttackBonus >= 0 ? "text-success" : "text-danger"}>{effectiveAttackBonus >= 0 ? "+" : ""}{effectiveAttackBonus}</span></div>
                      <div>Str: <span className="text-success">+{effectiveStrengthBonus}</span></div>
                    </>
                  )}
                  {combatStyle === "ranged" && (
                    <>
                      <div>Rng Atk: <span className={effectiveAttackBonus >= 0 ? "text-success" : "text-danger"}>{effectiveAttackBonus >= 0 ? "+" : ""}{effectiveAttackBonus}</span></div>
                      <div>Rng Str: <span className="text-success">+{effectiveStrengthBonus}</span></div>
                    </>
                  )}
                  {combatStyle === "magic" && (
                    <>
                      <div>Mag Atk: <span className={effectiveAttackBonus >= 0 ? "text-success" : "text-danger"}>{effectiveAttackBonus >= 0 ? "+" : ""}{effectiveAttackBonus}</span></div>
                      <div>Mag Dmg: <span className="text-success">+{effectiveStrengthBonus}%</span></div>
                    </>
                  )}
                  <div>Prayer: <span className="text-accent">+{gearBonuses.prayer}</span></div>
                </div>
                {bonusMode === "equipment" && weaponSpeed > 0 ? (
                  <div className="flex justify-between text-xs text-text-secondary mt-2">
                    <span>Attack speed</span>
                    <span className="text-text-primary font-medium tabular-nums">{effectiveAttackSpeed} ticks ({(effectiveAttackSpeed * 0.6).toFixed(1)}s)</span>
                  </div>
                ) : (
                  <StatInput label="Atk speed" value={attackSpeed} onChange={setAttackSpeed} min={1} max={12} suffix="ticks" />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <StatInput label="Attack bonus" value={attackBonus} onChange={setAttackBonus} min={-64} max={300} />
                <StatInput label="Strength bonus" value={strengthBonus} onChange={setStrengthBonus} min={0} max={300} />
                <StatInput label="Attack speed" value={attackSpeed} onChange={setAttackSpeed} min={1} max={12} suffix="ticks" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gear selector modal */}
      {openSlot !== null && (
        <GearSelector
          slot={openSlot}
          onSelect={(item: WikiEquipment | null) => {
            if (item === null) {
              setEquippedGear((prev: EquippedGear) => {
                const next = { ...prev };
                delete next[openSlot];
                return next;
              });
            } else {
              setEquippedGear((prev: EquippedGear) => ({ ...prev, [openSlot]: item }));
            }
            setOpenSlot(null);
          }}
          onClose={() => setOpenSlot(null)}
        />
      )}

      {/* Prayer + Stance */}
      <div className="rounded-xl border border-border/40 bg-bg-primary/20 p-4">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="section-kicker mb-2">Prayer</div>
            <div className="grid grid-cols-5 gap-1.5">
              {filteredPrayers.map((p, i) => {
                const isActive = prayerIdx === i;
                return (
                  <button
                    key={p.name}
                    onClick={() => setPrayerIdx(i)}
                    aria-pressed={isActive}
                    title={`${p.name}${p.level ? ` (Lvl ${p.level})` : ""}${p.attackMult > 1 ? ` +${Math.round((p.attackMult - 1) * 100)}% atk` : ""}${p.strengthMult > 1 ? ` +${Math.round((p.strengthMult - 1) * 100)}% str` : ""}`}
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? "bg-accent/20 ring-2 ring-accent scale-105"
                        : "bg-bg-tertiary/40 hover:bg-bg-secondary border border-border/20"
                    }`}
                  >
                    {p.icon ? (
                      <img
                        src={`${WIKI_IMG}/${p.icon}`}
                        alt={p.name}
                        className={`w-7 h-7 ${isActive ? "" : "opacity-50 grayscale"}`}
                        onError={(e) => { e.currentTarget.style.display = "none"; const next = e.currentTarget.nextElementSibling; if (next instanceof HTMLElement) next.style.display = "flex"; }}
                      />
                    ) : null}
                    <span className={`w-7 h-7 items-center justify-center text-[10px] font-medium ${p.icon ? "hidden" : "flex"} ${isActive ? "text-accent" : "text-text-secondary/50"}`}>
                      {p.name === "None" ? "\u2014" : p.name[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            {prayer.name !== "None" && (
              <div className="mt-1.5 text-[10px] text-text-secondary">
                <span className="text-text-primary font-medium">{prayer.name}</span>
                {prayer.level ? <span className="text-text-secondary/40"> Lvl {prayer.level}</span> : null}
                {prayer.attackMult > 1 && <span className="text-success"> +{Math.round((prayer.attackMult - 1) * 100)}% atk</span>}
                {prayer.strengthMult > 1 && <span className="text-success"> +{Math.round((prayer.strengthMult - 1) * 100)}% str</span>}
              </div>
            )}
          </div>

          <div>
            <div className="section-kicker mb-2">
              Stance
              {bonusMode === "equipment" && weaponCombatStyle && (
                <span className="ml-1.5 text-accent/60 normal-case tracking-normal">({weaponType.name})</span>
              )}
            </div>
            <div className={`grid gap-1.5 ${
              stances.length === 2 ? "grid-cols-2" :
              stances.length === 3 ? "grid-cols-3" :
              "grid-cols-2"
            }`}>
              {stances.map((s, i) => {
                const isActive = stanceIdx === i;
                const typeColor =
                  s.attackType === "stab" ? "text-red-400" :
                  s.attackType === "slash" ? "text-orange-400" :
                  s.attackType === "crush" ? "text-amber-400" :
                  s.attackType === "ranged" ? "text-green-400" :
                  s.attackType === "magic" ? "text-blue-400" :
                  "text-text-secondary";
                const bonusParts: string[] = [];
                if (s.attackBonus > 0) bonusParts.push(`+${s.attackBonus} atk`);
                if (s.strengthBonus > 0) bonusParts.push(`+${s.strengthBonus} str`);
                if (s.defenceBonus > 0) bonusParts.push(`+${s.defenceBonus} def`);
                if (s.speedMod < 0) bonusParts.push("1 tick faster");
                if (s.speedMod > 0) bonusParts.push("1 tick slower");
                return (
                  <button
                    key={`${s.name}-${i}`}
                    onClick={() => setStanceIdx(i)}
                    aria-pressed={isActive}
                    title={`${s.name} \u2014 ${s.style} (${s.attackType})${bonusParts.length ? ` \u00b7 ${bonusParts.join(", ")}` : ""}`}
                    className={`px-2.5 py-2 rounded-lg text-left text-xs transition-all ${
                      isActive
                        ? "bg-accent/15 ring-1 ring-accent/50 text-text-primary"
                        : "bg-bg-tertiary/40 text-text-secondary hover:bg-bg-secondary border border-border/20"
                    }`}
                  >
                    <div className="font-medium truncate">{s.name}</div>
                    <div className={`text-[9px] mt-0.5 ${isActive ? "text-accent" : "text-text-secondary/40"}`}>
                      <span className={isActive ? typeColor : ""}>{s.attackType}</span>
                      <span className="mx-0.5">&middot;</span>
                      {s.style}
                    </div>
                    {bonusParts.length > 0 && (
                      <div className={`text-[9px] mt-0.5 ${isActive ? "text-text-secondary" : "text-text-secondary/30"}`}>
                        {bonusParts.join(" \u00b7 ")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {stance && (
              <div className="mt-1.5 text-[10px] text-text-secondary">
                <span className="text-text-primary font-medium">{stance.name}</span>
                <span className="text-text-secondary/40"> {stance.style} &middot; {stance.attackType}</span>
                {stance.speedMod < 0 && <span className="text-success"> &middot; 1 tick faster</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spell Selection (magic only) */}
      {combatStyle === "magic" && (
        <div>
          <div className="section-kicker mb-2">Spell</div>
          <select
            value={selectedSpell?.id ?? ""}
            onChange={(e) => {
              const spell = COMBAT_SPELLS.find((s) => s.id === e.target.value) ?? null;
              setSelectedSpell(spell);
            }}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">Powered staff (level-based)</option>
            <optgroup label="Standard">
              {COMBAT_SPELLS.filter((s) => s.spellbook === "standard").map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Base {s.id === "magic_dart" ? `${magicDartBaseMaxHit(magicLevel)}` : s.baseMaxHit} (Lvl {s.magicLevel})
                </option>
              ))}
            </optgroup>
            <optgroup label="Ancient Magicks">
              {COMBAT_SPELLS.filter((s) => s.spellbook === "ancient").map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Base {s.baseMaxHit} (Lvl {s.magicLevel})
                </option>
              ))}
            </optgroup>
            <optgroup label="Arceuus">
              {COMBAT_SPELLS.filter((s) => s.spellbook === "arceuus").map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Base {s.baseMaxHit} (Lvl {s.magicLevel})
                </option>
              ))}
            </optgroup>
          </select>
          {selectedSpell && (
            <div className="mt-1.5 text-[10px] text-text-secondary">
              <span className="text-text-primary font-medium">{selectedSpell.name}</span>
              <span className="text-text-secondary/40"> &middot; base {activeSpellBase} &middot; with gear {spellMaxHit(activeSpellBase ?? 0, effectiveStrengthBonus)}</span>
              {selectedSpell.notes && (
                <span className="text-text-secondary/30"> &middot; {selectedSpell.notes}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modifiers */}
      <div>
        <div className="section-kicker mb-2">Modifiers</div>
        <ModifierToggles
          activeIds={activeModifiers}
          onToggle={toggleModifier}
          combatStyle={combatStyle}
        />
      </div>
    </div>
  );
}
