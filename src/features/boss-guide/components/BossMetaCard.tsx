import type { BossMetadata } from "../../../lib/data/boss-metadata";

interface BossMetaCardProps {
  meta: BossMetadata;
  combatLevel?: number;
  hitpoints?: number;
  maxHit?: number;
  weakness?: string | null;
}

const TEAM_LABELS: Record<string, string> = {
  solo: "Solo",
  duo: "Duo",
  small: "Small team",
  mass: "Mass",
};

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= level ? "bg-accent" : "bg-bg-tertiary"
          }`}
        />
      ))}
    </div>
  );
}

export default function BossMetaCard({
  meta,
  combatLevel,
  hitpoints,
  maxHit,
  weakness,
}: BossMetaCardProps) {
  return (
    <div className="mb-5">
      {/* Stat row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-secondary">Difficulty</span>
          <DifficultyDots level={meta.difficulty} />
        </div>
        <span className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-text-secondary">
          {TEAM_LABELS[meta.teamSize] ?? meta.teamSize}
        </span>
        {combatLevel != null && combatLevel > 0 && (
          <span className="text-xs text-text-secondary">
            Lv <span className="text-text-primary font-medium">{combatLevel}</span>
          </span>
        )}
        {hitpoints != null && hitpoints > 0 && (
          <span className="text-xs text-text-secondary">
            HP <span className="text-text-primary font-medium">{hitpoints}</span>
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
        {meta.slayerReq && (
          <span className="text-xs text-text-secondary">
            Slayer <span className="text-text-primary font-medium">{meta.slayerReq}</span>
          </span>
        )}
        {meta.recommendedCombatLevel && (
          <span className="text-xs text-text-secondary">
            Rec. <span className="text-text-primary font-medium">{meta.recommendedCombatLevel}+</span>
          </span>
        )}
      </div>

      {/* Mechanics summary */}
      <p className="text-sm text-text-secondary leading-relaxed">
        {meta.mechanicsSummary}
      </p>

      {/* Quest requirements */}
      {meta.questReqs && meta.questReqs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
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
  );
}
