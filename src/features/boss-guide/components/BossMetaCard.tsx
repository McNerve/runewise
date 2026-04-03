import type { BossMetadata } from "../../../lib/data/boss-metadata";
import { getSkillLevel, type HiscoreData } from "../../../lib/api/hiscores";
import { combatLevel as calcCombatLevel } from "../../../lib/formulas/combat";

interface BossMetaCardProps {
  meta: BossMetadata;
  combatLevel?: number;
  hitpoints?: number;
  maxHit?: number;
  weakness?: string | null;
  hiscores?: HiscoreData | null;
}

const TEAM_LABELS: Record<string, string> = {
  solo: "Solo",
  duo: "Duo",
  small: "Small team",
  mass: "Mass",
};

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            i <= level ? "bg-accent" : "bg-bg-tertiary"
          }`}
        />
      ))}
    </div>
  );
}

function Divider() {
  return <div className="h-4 w-px bg-border/50" />;
}

export default function BossMetaCard({
  meta,
  combatLevel,
  hitpoints,
  maxHit,
  weakness,
  hiscores,
}: BossMetaCardProps) {
  const playerSlayer = hiscores ? getSkillLevel(hiscores, "Slayer") : null;
  const playerCombat = hiscores
    ? calcCombatLevel({
        attack: getSkillLevel(hiscores, "Attack"),
        strength: getSkillLevel(hiscores, "Strength"),
        defence: getSkillLevel(hiscores, "Defence"),
        hitpoints: getSkillLevel(hiscores, "Hitpoints"),
        prayer: getSkillLevel(hiscores, "Prayer"),
        ranged: getSkillLevel(hiscores, "Ranged"),
        magic: getSkillLevel(hiscores, "Magic"),
      })
    : null;

  const slayerMet =
    meta.slayerReq && playerSlayer != null
      ? playerSlayer >= meta.slayerReq
      : null;
  const combatMet =
    meta.recommendedCombatLevel && playerCombat != null
      ? playerCombat >= meta.recommendedCombatLevel
      : null;

  const hasRequirements = meta.slayerReq || meta.recommendedCombatLevel || (meta.questReqs && meta.questReqs.length > 0);

  return (
    <div className="mb-5 rounded-xl border border-border/60 bg-bg-primary/40 p-4">
      {/* Core stats row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/50">Difficulty</span>
          <DifficultyDots level={meta.difficulty} />
        </div>
        <Divider />
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-bg-tertiary text-text-secondary">
          {TEAM_LABELS[meta.teamSize] ?? meta.teamSize}
        </span>
        {combatLevel != null && combatLevel > 0 && (
          <>
            <Divider />
            <span className="text-xs text-text-secondary">
              Lv <span className="text-text-primary font-medium">{combatLevel}</span>
            </span>
          </>
        )}
        {hitpoints != null && hitpoints > 0 && (
          <span className="text-xs text-text-secondary">
            HP <span className="text-text-primary font-medium">{hitpoints.toLocaleString()}</span>
          </span>
        )}
        {maxHit != null && maxHit > 0 && (
          <span className="text-xs text-text-secondary">
            Max <span className="text-danger font-medium">{maxHit}</span>
          </span>
        )}
        {weakness && (
          <span className="text-xs text-text-secondary">
            Weak to <span className="text-success font-medium">{weakness}</span>
          </span>
        )}
      </div>

      {/* Requirements row */}
      {hasRequirements && (
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/40">
          {meta.slayerReq && (
            <span className={`text-xs ${slayerMet === false ? "text-danger" : "text-text-secondary"}`}>
              {slayerMet != null && (
                <span className={slayerMet ? "text-success" : "text-danger"}>
                  {slayerMet ? "✓ " : "✗ "}
                </span>
              )}
              Slayer{" "}
              <span className={`font-medium ${slayerMet === true ? "text-success" : slayerMet === false ? "text-danger" : "text-text-primary"}`}>
                {meta.slayerReq}
              </span>
              {slayerMet === false && playerSlayer != null && (
                <span className="text-danger/60"> ({playerSlayer})</span>
              )}
            </span>
          )}
          {meta.recommendedCombatLevel && (
            <span className={`text-xs ${combatMet === false ? "text-warning" : "text-text-secondary"}`}>
              {combatMet != null && (
                <span className={combatMet ? "text-success" : "text-warning"}>
                  {combatMet ? "✓ " : "✗ "}
                </span>
              )}
              Rec.{" "}
              <span className={`font-medium ${combatMet === true ? "text-success" : combatMet === false ? "text-warning" : "text-text-primary"}`}>
                {meta.recommendedCombatLevel}+
              </span>
              {combatMet === false && playerCombat != null && (
                <span className="text-warning/60"> ({playerCombat})</span>
              )}
            </span>
          )}
          {meta.questReqs && meta.questReqs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meta.questReqs.map((quest) => (
                <span
                  key={quest}
                  className="px-2 py-0.5 rounded text-xs bg-warning/10 text-warning border border-warning/20"
                >
                  {quest}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mechanics summary */}
      <p className="mt-3 border-l-2 border-accent/30 pl-3 text-sm text-text-secondary leading-relaxed">
        {meta.mechanicsSummary}
      </p>
    </div>
  );
}
