import { useState, useMemo, useEffect, useCallback } from "react";
import {
  calculateDps,
  DPS_MODIFIERS,
  type DpsModifier,
} from "../../lib/formulas/dps";
import { PRAYERS, type Prayer } from "../../lib/data/prayers";
import { MONSTERS } from "../../lib/data/monsters";
import { fetchAllMonsters, type WikiMonster } from "../../lib/api/monsters";
import { type HiscoreData } from "../../lib/api/hiscores";
import { useNavigation } from "../../lib/NavigationContext";
import MonsterSearch from "./components/MonsterSearch";
import ModifierToggles from "./components/ModifierToggles";
import DpsBreakdown from "./components/DpsBreakdown";

type CombatStyle = "melee" | "ranged" | "magic";

interface Stance {
  label: string;
  attackBonus: number;
  strengthBonus: number;
}

const STANCES: Record<CombatStyle, Stance[]> = {
  melee: [
    { label: "Accurate", attackBonus: 3, strengthBonus: 0 },
    { label: "Aggressive", attackBonus: 0, strengthBonus: 3 },
    { label: "Controlled", attackBonus: 1, strengthBonus: 1 },
    { label: "Defensive", attackBonus: 0, strengthBonus: 0 },
  ],
  ranged: [
    { label: "Accurate", attackBonus: 3, strengthBonus: 0 },
    { label: "Rapid", attackBonus: 0, strengthBonus: 0 },
    { label: "Longrange", attackBonus: 0, strengthBonus: 0 },
  ],
  magic: [
    { label: "Accurate", attackBonus: 3, strengthBonus: 0 },
    { label: "Longrange", attackBonus: 0, strengthBonus: 0 },
  ],
};

const DEFAULT_SPEED: Record<CombatStyle, number> = {
  melee: 4,
  ranged: 5,
  magic: 5,
};

function getDefBonus(m: WikiMonster, style: CombatStyle): number {
  if (style === "ranged") return m.defRanged;
  if (style === "magic") return m.defMagic;
  return Math.min(m.defStab, m.defSlash, m.defCrush);
}

function getSkillLevel(hiscores: HiscoreData | null, name: string): number {
  if (!hiscores) return 99;
  return (
    hiscores.skills.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    )?.level ?? 99
  );
}

interface Props {
  hiscores: HiscoreData | null;
}

export default function DpsCalculator({ hiscores }: Props) {
  const { params } = useNavigation();
  const [combatStyle, setCombatStyle] = useState<CombatStyle>("melee");
  const [attackLevel, setAttackLevel] = useState(99);
  const [strengthLevel, setStrengthLevel] = useState(99);
  const [rangedLevel, setRangedLevel] = useState(99);
  const [magicLevel, setMagicLevel] = useState(99);
  const [attackBonus, setAttackBonus] = useState(0);
  const [strengthBonus, setStrengthBonus] = useState(0);
  const [attackSpeed, setAttackSpeed] = useState(DEFAULT_SPEED.melee);
  const [stanceIdx, setStanceIdx] = useState(0);
  const [prayerIdx, setPrayerIdx] = useState(0);
  const [selectedMonster, setSelectedMonster] = useState<WikiMonster | null>(null);
  const [customDef, setCustomDef] = useState({ defLevel: 1, defBonus: 0, hp: 100 });
  const [activeModifiers, setActiveModifiers] = useState<Set<string>>(new Set());
  const [wikiMonsters, setWikiMonsters] = useState<WikiMonster[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Load wiki monsters
  useEffect(() => {
    fetchAllMonsters().then(setWikiMonsters);
  }, []);

  // Sync hiscores stats
  useEffect(() => {
    if (hiscores) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external hiscores data
      setAttackLevel(getSkillLevel(hiscores, "Attack"));
      setStrengthLevel(getSkillLevel(hiscores, "Strength"));
      setRangedLevel(getSkillLevel(hiscores, "Ranged"));
      setMagicLevel(getSkillLevel(hiscores, "Magic"));
    }
  }, [hiscores]);

  // Handle monster param from cross-nav
  useEffect(() => {
    if (!params.monster || wikiMonsters.length === 0) return;
    const match = wikiMonsters.find(
      (m) => m.name.toLowerCase() === params.monster?.toLowerCase()
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync target from URL params
    if (match) setSelectedMonster(match);
    else {
      // Fallback to old static monsters
      const staticMatch = MONSTERS.find(
        (m) => m.name.toLowerCase() === params.monster?.toLowerCase()
      );
      if (staticMatch && staticMatch.name !== "Custom target") {
        setSelectedMonster({
          name: staticMatch.name,
          version: null,
          combatLevel: 0,
          hitpoints: staticMatch.hp,
          maxHit: 0,
          attackSpeed: 0,
          attackStyles: [],
          attackLevel: 0,
          strengthLevel: 0,
          defenceLevel: staticMatch.defLevel,
          magicLevel: 0,
          rangedLevel: 0,
          slayerLevel: 0,
          slayerXp: 0,
          defStab: staticMatch.defStab,
          defSlash: staticMatch.defSlash,
          defCrush: staticMatch.defCrush,
          defMagic: staticMatch.defMagic,
          defRanged: staticMatch.defRanged,
          attackBonus: 0,
          strengthBonus: 0,
          magicAttackBonus: 0,
          rangedAttackBonus: 0,
          magicDamageBonus: 0,
          image: null,
          examine: null,
        });
      }
    }
  }, [params.monster, wikiMonsters]);

  // Reset stance and prayer when combat style changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset dependent state on style change
    setStanceIdx(0);
    setPrayerIdx(0);
    setAttackSpeed(DEFAULT_SPEED[combatStyle]);
    setActiveModifiers(new Set());
  }, [combatStyle]);

  const stances = STANCES[combatStyle];
  const stance = stances[stanceIdx] ?? stances[0];
  const filteredPrayers = useMemo(
    () => PRAYERS.filter((p) => p.style === combatStyle),
    [combatStyle]
  );
  const prayer: Prayer = filteredPrayers[prayerIdx] ?? filteredPrayers[0];

  const isCustom = !selectedMonster;
  const targetDefLevel = isCustom
    ? customDef.defLevel
    : selectedMonster.defenceLevel;
  const targetDefBonus = isCustom
    ? customDef.defBonus
    : getDefBonus(selectedMonster, combatStyle);
  const targetHp = isCustom ? customDef.hp : selectedMonster.hitpoints;

  const modifierList = useMemo<DpsModifier[]>(
    () =>
      [...activeModifiers]
        .map((id) => DPS_MODIFIERS[id])
        .filter((m): m is DpsModifier => m != null),
    [activeModifiers]
  );

  const result = useMemo(
    () =>
      calculateDps({
        attackLevel,
        strengthLevel,
        rangedLevel,
        magicLevel,
        attackBonus,
        strengthBonus,
        prayerAttackMult: prayer.attackMult,
        prayerStrengthMult: prayer.strengthMult,
        stanceAttackBonus: stance.attackBonus,
        stanceStrengthBonus: stance.strengthBonus,
        attackSpeed,
        combatStyle,
        targetDefLevel,
        targetDefBonus,
        targetHp,
        targetMagicLevel: selectedMonster?.magicLevel,
        modifiers: modifierList,
      }),
    [
      attackLevel,
      strengthLevel,
      rangedLevel,
      magicLevel,
      attackBonus,
      strengthBonus,
      prayer,
      stance,
      attackSpeed,
      combatStyle,
      targetDefLevel,
      targetDefBonus,
      targetHp,
      selectedMonster?.magicLevel,
      modifierList,
    ]
  );

  const toggleModifier = useCallback((id: string) => {
    setActiveModifiers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-5">DPS Calculator</h2>

      <div className="space-y-5">
        {/* Combat Style */}
        <div className="flex gap-2">
          {(["melee", "ranged", "magic"] as const).map((style) => (
            <button
              key={style}
              onClick={() => setCombatStyle(style)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                combatStyle === style
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Stats + Equipment side by side */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="section-kicker mb-3">Player Stats</div>
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
            <div className="section-kicker mb-3">Equipment Bonuses</div>
            <div className="space-y-2">
              <StatInput label="Attack bonus" value={attackBonus} onChange={setAttackBonus} min={-64} max={300} />
              <StatInput label="Strength bonus" value={strengthBonus} onChange={setStrengthBonus} min={0} max={300} />
              <StatInput label="Attack speed" value={attackSpeed} onChange={setAttackSpeed} min={1} max={12} suffix="ticks" />
            </div>
          </div>
        </div>

        {/* Prayer + Stance */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="section-kicker mb-3">Prayer</div>
            <select
              value={prayerIdx}
              onChange={(e) => setPrayerIdx(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            >
              {filteredPrayers.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                  {p.attackMult > 1 || p.strengthMult > 1
                    ? ` (+${Math.round((p.attackMult - 1) * 100)}% atk, +${Math.round((p.strengthMult - 1) * 100)}% str)`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="section-kicker mb-3">Stance</div>
            <select
              value={stanceIdx}
              onChange={(e) => setStanceIdx(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm"
            >
              {stances.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                  {s.attackBonus > 0 ? ` (+${s.attackBonus} atk)` : ""}
                  {s.strengthBonus > 0 ? ` (+${s.strengthBonus} str)` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modifiers */}
        <div>
          <div className="section-kicker mb-3">Modifiers</div>
          <ModifierToggles
            activeIds={activeModifiers}
            onToggle={toggleModifier}
            combatStyle={combatStyle}
          />
        </div>

        {/* Target */}
        <div>
          <div className="section-kicker mb-3">Target</div>
          <MonsterSearch
            monsters={wikiMonsters}
            selected={selectedMonster}
            onSelect={setSelectedMonster}
            combatStyle={combatStyle}
          />

          {isCustom && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <StatInput
                label="Def level"
                value={customDef.defLevel}
                onChange={(v) => setCustomDef((p) => ({ ...p, defLevel: v }))}
                min={1}
                max={500}
              />
              <StatInput
                label="Def bonus"
                value={customDef.defBonus}
                onChange={(v) => setCustomDef((p) => ({ ...p, defBonus: v }))}
                min={-100}
                max={500}
              />
              <StatInput
                label="HP"
                value={customDef.hp}
                onChange={(v) => setCustomDef((p) => ({ ...p, hp: v }))}
                min={1}
                max={10000}
              />
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-kicker">Results</div>
            <button
              onClick={() => setShowBreakdown((p) => !p)}
              className="text-xs text-text-secondary hover:text-accent transition-colors"
            >
              {showBreakdown ? "Hide" : "Show"} breakdown
            </button>
          </div>
          <DpsBreakdown
            maxHit={result.maxHit}
            accuracy={result.accuracy}
            dps={result.dps}
            ttk={result.ttk}
            attackRoll={result.attackRoll}
            defenseRoll={result.defenseRoll}
          />
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex items-center gap-3">
      <label className="w-28 text-sm text-text-secondary shrink-0">
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
          className="w-full bg-bg-tertiary border border-border rounded px-3 py-1.5 text-sm tabular-nums"
        />
        {suffix && (
          <span className="text-xs text-text-secondary shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
