import { useState, useMemo, useEffect } from "react";
import { calculateDps } from "../../lib/formulas/dps";
import { PRAYERS, type Prayer } from "../../lib/data/prayers";
import { MONSTERS, type Monster } from "../../lib/data/monsters";
import { type HiscoreData } from "../../lib/api/hiscores";
import { useNavigation } from "../../lib/NavigationContext";

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

function getDefBonus(monster: Monster, style: CombatStyle): number {
  if (style === "ranged") return monster.defRanged;
  if (style === "magic") return monster.defMagic;
  return Math.min(monster.defStab, monster.defSlash, monster.defCrush);
}

function formatTtk(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
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
  const [monsterIdx, setMonsterIdx] = useState(0);
  const [customDef, setCustomDef] = useState({ defLevel: 1, defBonus: 0, hp: 100 });

  useEffect(() => {
    if (hiscores) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external hiscores data
      setAttackLevel(getSkillLevel(hiscores, "Attack"));
      setStrengthLevel(getSkillLevel(hiscores, "Strength"));
      setRangedLevel(getSkillLevel(hiscores, "Ranged"));
      setMagicLevel(getSkillLevel(hiscores, "Magic"));
    }
  }, [hiscores]);

  useEffect(() => {
    if (!params.monster) return;
    const nextIndex = MONSTERS.findIndex(
      (monster) => monster.name.toLowerCase() === params.monster?.toLowerCase()
    );
    if (nextIndex >= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the selected target when navigating from boss guides
      setMonsterIdx(nextIndex);
    }
  }, [params.monster]);

  // Reset stance and prayer when combat style changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset dependent state on style change
    setStanceIdx(0);
    setPrayerIdx(0);
    setAttackSpeed(DEFAULT_SPEED[combatStyle]);
  }, [combatStyle]);

  const stances = STANCES[combatStyle];
  const stance = stances[stanceIdx] ?? stances[0];
  const filteredPrayers = useMemo(
    () => PRAYERS.filter((p) => p.style === combatStyle),
    [combatStyle]
  );
  const prayer: Prayer = filteredPrayers[prayerIdx] ?? filteredPrayers[0];
  const monster = MONSTERS[monsterIdx];
  const isCustom = monster.name === "Custom target";

  const targetDefLevel = isCustom ? customDef.defLevel : monster.defLevel;
  const targetDefBonus = isCustom
    ? customDef.defBonus
    : getDefBonus(monster, combatStyle);
  const targetHp = isCustom ? customDef.hp : monster.hp;

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
    ]
  );

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">DPS Calculator</h2>

      <div className="space-y-4">
        {/* Combat Style Selector */}
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

        {/* Stats + Equipment */}
        <div className="grid grid-cols-2 gap-4">
          {/* Player Stats */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
              Player Stats
            </h3>
            <div className="space-y-2">
              {combatStyle === "melee" && (
                <>
                  <StatInput
                    label="Attack"
                    value={attackLevel}
                    onChange={setAttackLevel}
                  />
                  <StatInput
                    label="Strength"
                    value={strengthLevel}
                    onChange={setStrengthLevel}
                  />
                </>
              )}
              {combatStyle === "ranged" && (
                <StatInput
                  label="Ranged"
                  value={rangedLevel}
                  onChange={setRangedLevel}
                />
              )}
              {combatStyle === "magic" && (
                <StatInput
                  label="Magic"
                  value={magicLevel}
                  onChange={setMagicLevel}
                />
              )}
            </div>
            {hiscores && (
              <p className="text-[10px] text-text-secondary/50 mt-2">
                Loaded from Hiscores
              </p>
            )}
          </div>

          {/* Equipment Bonuses */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
              Equipment Bonuses
            </h3>
            <div className="space-y-2">
              <StatInput
                label="Attack bonus"
                value={attackBonus}
                onChange={setAttackBonus}
                min={-64}
                max={300}
              />
              <StatInput
                label="Strength bonus"
                value={strengthBonus}
                onChange={setStrengthBonus}
                min={0}
                max={300}
              />
              <StatInput
                label="Attack speed"
                value={attackSpeed}
                onChange={setAttackSpeed}
                min={1}
                max={12}
                suffix="ticks"
              />
            </div>
          </div>
        </div>

        {/* Prayer + Stance */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
              Prayer
            </h3>
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
            <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
              Stance
            </h3>
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

        {/* Target */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-3">
            Target
          </h3>
          <select
            value={monsterIdx}
            onChange={(e) => setMonsterIdx(Number(e.target.value))}
            className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 text-sm mb-3"
          >
            {MONSTERS.map((m, i) => (
              <option key={m.name} value={i}>
                {m.name}
                {m.name !== "Custom target" ? ` (${m.hp} HP)` : ""}
              </option>
            ))}
          </select>

          {isCustom ? (
            <div className="grid grid-cols-3 gap-3">
              <StatInput
                label="Def level"
                value={customDef.defLevel}
                onChange={(v) =>
                  setCustomDef((p) => ({ ...p, defLevel: v }))
                }
                min={1}
                max={500}
              />
              <StatInput
                label="Def bonus"
                value={customDef.defBonus}
                onChange={(v) =>
                  setCustomDef((p) => ({ ...p, defBonus: v }))
                }
                min={0}
                max={500}
              />
              <StatInput
                label="HP"
                value={customDef.hp}
                onChange={(v) =>
                  setCustomDef((p) => ({ ...p, hp: v }))
                }
                min={1}
                max={10000}
              />
            </div>
          ) : (
            <div className="flex gap-4 text-xs text-text-secondary">
              <span>Def: {targetDefLevel}</span>
              <span>
                {combatStyle === "ranged"
                  ? "Ranged"
                  : combatStyle === "magic"
                    ? "Magic"
                    : "Best melee"}{" "}
                def: {targetDefBonus}
              </span>
              <span>HP: {targetHp}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="grid grid-cols-4 gap-3">
          <ResultCard
            label="Max Hit"
            value={String(result.maxHit)}
            color="text-accent"
          />
          <ResultCard
            label="Accuracy"
            value={`${(result.accuracy * 100).toFixed(1)}%`}
            color={
              result.accuracy >= 0.8
                ? "text-success"
                : result.accuracy >= 0.5
                  ? "text-warning"
                  : "text-danger"
            }
          />
          <ResultCard
            label="DPS"
            value={result.dps.toFixed(2)}
            color="text-accent"
          />
          <ResultCard
            label="Time to Kill"
            value={formatTtk(result.ttk)}
            color="text-text-primary"
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
          className="w-full bg-bg-tertiary border border-border rounded px-3 py-1.5 text-sm"
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

function ResultCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </div>
  );
}
