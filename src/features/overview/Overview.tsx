import { useState, useEffect, lazy, Suspense } from "react";
import { type HiscoreData } from "../../lib/api/hiscores";
import { fetchWomPlayer, type WomPlayer } from "../../lib/api/wom";
import { xpForLevel } from "../../lib/formulas/xp";
import { combatLevel } from "../../lib/formulas/combat";
import { WIKI_IMG, SKILL_ICONS, NAV_ICONS, bossIconSmall, bossIcon, itemIcon } from "../../lib/sprites";
import { useNavigation } from "../../lib/NavigationContext";
import WikiImage from "../../components/WikiImage";
import { TRAINING_METHODS } from "../../lib/data/training-methods";
import QuestTracker from "../quests/QuestTracker";
import DiaryTracker from "../diaries/DiaryTracker";
const CombatTasks = lazy(() => import("../combat-tasks/CombatTasks"));

type ProfileTab = "overview" | "quests" | "diaries" | "combat" | "unlock";

function ProgressRing({ obtained, total, size = 22 }: { obtained: number; total: number; size?: number }) {
  const pct = total > 0 ? obtained / total : 0;
  const r = (size - 3) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={2} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 1 ? "var(--color-success)" : "var(--color-accent)"}
        strokeWidth={2} strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

interface Props {
  hiscores: HiscoreData;
  rsn: string;
}

function hoursTo99(skillName: string, currentXp: number): string | null {
  const methods = TRAINING_METHODS[skillName];
  if (!methods || methods.length === 0) return null;
  const targetXp = xpForLevel(99);
  const xpNeeded = targetXp - currentXp;
  if (xpNeeded <= 0) return null;
  const best = methods.reduce((a, b) => ((b.xpPerHour ?? 0) > (a.xpPerHour ?? 0) ? b : a));
  if (!best.xpPerHour || best.xpPerHour <= 0) return null;
  const hours = xpNeeded / best.xpPerHour;
  if (hours < 1) return `${Math.ceil(hours * 60)}m`;
  if (hours < 100) return `${hours.toFixed(0)}h`;
  return `${Math.round(hours)}h`;
}

const SKILL_ORDER = [
  "Attack", "Hitpoints", "Mining",
  "Strength", "Agility", "Smithing",
  "Defence", "Herblore", "Fishing",
  "Ranged", "Thieving", "Cooking",
  "Prayer", "Crafting", "Firemaking",
  "Magic", "Fletching", "Woodcutting",
  "Runecraft", "Slayer", "Farming",
  "Construction", "Hunter", "Sailing",
];

export default function Overview({ hiscores, rsn }: Props) {
  const { navigate, params } = useNavigation();
  const [womPlayer, setWomPlayer] = useState<WomPlayer | null>(null);
  const initialTab: ProfileTab =
    params.tab === "quests" ? "quests" :
    params.tab === "diaries" ? "diaries" :
    params.tab === "combat" ? "combat" :
    params.tab === "unlock" ? "unlock" :
    "overview";
  const [profileTab, setProfileTab] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    if (!rsn) return;
    fetchWomPlayer(rsn).then(setWomPlayer).catch(() => { /* WOM data is optional */ });
  }, [rsn]);
  const totalLevel = hiscores.skills
    .filter((s) => s.name !== "Overall")
    .reduce((sum, s) => sum + s.level, 0);
  const totalXp = hiscores.skills.find((s) => s.name === "Overall")?.xp ?? 0;
  const overallRank = hiscores.skills.find((s) => s.name === "Overall")?.rank ?? 0;

  const get = (name: string) =>
    hiscores.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());

  const cmb = combatLevel({
    attack: get("Attack")?.level ?? 1,
    strength: get("Strength")?.level ?? 1,
    defence: get("Defence")?.level ?? 1,
    hitpoints: get("Hitpoints")?.level ?? 1,
    prayer: get("Prayer")?.level ?? 1,
    ranged: get("Ranged")?.level ?? 1,
    magic: get("Magic")?.level ?? 1,
  });

  const maxedSkills = hiscores.skills.filter(
    (s) => s.name !== "Overall" && s.level >= 99
  ).length;

  const collectionLog = hiscores.activities?.find(
    (a) => a.name === "Collections Logged"
  )?.score ?? null;

  const clueScrollsAll = hiscores.activities?.find(
    (a) => a.name === "Clue Scrolls (all)"
  )?.score ?? null;

  const colosseumGlory = hiscores.activities?.find(
    (a) => a.name === "Colosseum Glory"
  )?.score ?? null;

  const questPoints = hiscores.activities?.find(
    (a) => a.name === "Quest Points"
  )?.score ?? null;


  const clueTiers = ["beginner", "easy", "medium", "hard", "elite", "master"].map((tier) => ({
    tier,
    count: hiscores.activities?.find((a) => a.name.toLowerCase() === `clue scrolls (${tier})`)?.score ?? 0,
  })).filter((c) => c.count > 0);

  const NON_BOSS = ["Clue", "Points", "Rank", "Zeal", "Rifts", "Glory", "Collections", "Grid", "League", "Deadman", "Bounty", "LMS"];
  const bossActivities = hiscores.activities?.filter((a) =>
    a.score > 0 && a.id >= 20 && !NON_BOSS.some((k) => a.name.includes(k))
  ) ?? [];
  const totalBossKills = bossActivities.reduce((sum, a) => sum + a.score, 0);

  // Minigames
  const wintertodt = hiscores.activities?.find((a) => a.name === "Wintertodt")?.score ?? 0;
  const tempoross = hiscores.activities?.find((a) => a.name === "Tempoross")?.score ?? 0;
  const rifts = hiscores.activities?.find((a) => a.name === "Rifts closed")?.score ?? 0;
  const gauntlet = hiscores.activities?.find((a) => a.name === "The Corrupted Gauntlet")?.score ?? 0;
  const hasMinigames = wintertodt > 0 || tempoross > 0 || rifts > 0 || gauntlet > 0;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">{rsn}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="flex flex-col items-center gap-1">
          <img src={`${WIKI_IMG}/Attack_style_icon.png`} alt="" className="w-5 h-5 opacity-50" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="text-2xl font-bold text-accent">
            {cmb.toFixed(0)}
          </div>
          <div className="text-xs text-text-secondary">Combat</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <img src={`${WIKI_IMG}/Stats_icon.png`} alt="" className="w-5 h-5 opacity-50" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="text-2xl font-bold">{totalLevel.toLocaleString()}</div>
          <div className="text-xs text-text-secondary">Total Level</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <img src={`${WIKI_IMG}/Antique_lamp.png`} alt="" className="w-5 h-5 opacity-50" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="text-2xl font-bold">
            {totalXp >= 1_000_000_000
              ? `${(totalXp / 1_000_000_000).toFixed(1)}B`
              : `${(totalXp / 1_000_000).toFixed(0)}M`}
          </div>
          <div className="text-xs text-text-secondary">Total XP</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {maxedSkills >= 24 ? (
            <img src={`${WIKI_IMG}/Max_cape.png`} alt="" className="w-5 h-5 opacity-50" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <ProgressRing obtained={maxedSkills} total={24} size={22} />
          )}
          <div className={`text-2xl font-bold ${maxedSkills >= 24 ? "text-success" : ""}`}>
            {maxedSkills}/24
          </div>
          <div className="text-xs text-text-secondary">Maxed Skills</div>
        </div>
      </div>

      {/* Activity stats — sourced from hiscores activities */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {collectionLog != null && collectionLog > 0 && (
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <WikiImage src={NAV_ICONS["collection-log"]} alt="" className="w-4 h-4" fallback="C" />
              <div className="text-lg font-bold">{collectionLog}<span className="text-xs text-text-secondary font-normal">/1,699</span></div>
            </div>
            <div className="text-xs text-text-secondary">Collection Log</div>
          </div>
        )}
        {totalBossKills > 0 && (
          <button
            onClick={() => navigate("loot", { tab: "profit" })}
            className="p-3 text-center rounded-lg transition-colors hover:bg-bg-secondary/50"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <WikiImage src={NAV_ICONS.bosses} alt="" className="w-4 h-4" fallback="B" />
              <div className="text-lg font-bold">{totalBossKills.toLocaleString()}</div>
            </div>
            <div className="text-xs text-text-secondary">Boss Kills</div>
          </button>
        )}
        {clueScrollsAll != null && clueScrollsAll > 0 && (
          <button
            onClick={() => navigate("clue-helper")}
            className="p-3 text-center rounded-lg transition-colors hover:bg-bg-secondary/50"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <WikiImage src={NAV_ICONS["clue-helper"]} alt="" className="w-4 h-4" fallback="C" />
              <div className="text-lg font-bold">{clueScrollsAll}</div>
            </div>
            <div className="text-xs text-text-secondary">Clue Scrolls</div>
          </button>
        )}
        {colosseumGlory != null && (
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <WikiImage src={itemIcon("Dizana's quiver (uncharged)")} alt="" className="w-4 h-4" fallback="Q" />
              <div className="text-lg font-bold">{colosseumGlory.toLocaleString()}</div>
            </div>
            <div className="text-xs text-text-secondary">Colosseum Glory</div>
          </div>
        )}
      </div>

      {/* WOM data: Rank, EHP, EHB, account type */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {overallRank > 0 && (
          <div className="text-center px-3 py-1.5">
            <div className="text-sm font-bold tabular-nums">#{overallRank.toLocaleString()}</div>
            <div className="text-[10px] text-text-secondary">Overall Rank</div>
          </div>
        )}
        {womPlayer?.ehp != null && womPlayer.ehp > 0 && (
          <div className="text-center px-3 py-1.5" title="Efficient Hours Played">
            <div className="text-sm font-bold tabular-nums">{womPlayer.ehp.toFixed(0)}</div>
            <div className="text-[10px] text-text-secondary">EHP</div>
          </div>
        )}
        {womPlayer?.ehb != null && womPlayer.ehb > 0 && (
          <div className="text-center px-3 py-1.5" title="Efficient Hours Bossed">
            <div className="text-sm font-bold tabular-nums">{womPlayer.ehb.toFixed(0)}</div>
            <div className="text-[10px] text-text-secondary">EHB</div>
          </div>
        )}
        {womPlayer?.type && womPlayer.type !== "regular" && (
          <div className="text-center px-3 py-1.5">
            <div className="text-sm font-bold text-accent capitalize">{womPlayer.type.replace("_", " ")}</div>
            <div className="text-[10px] text-text-secondary">Account Type</div>
          </div>
        )}
      </div>

      {/* Profile sub-tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto justify-center">
        {([
          { id: "overview" as const, label: "Overview", icon: `${WIKI_IMG}/Stats_icon.png` },
          { id: "quests" as const, label: `Quests${questPoints ? ` (${questPoints} QP)` : ""}`, icon: `${WIKI_IMG}/Quest_point_icon.png` },
          { id: "diaries" as const, label: "Diaries", icon: `${WIKI_IMG}/Achievement_Diaries_icon.png` },
          { id: "combat" as const, label: "Combat Tasks", icon: `${WIKI_IMG}/Combat_Achievements_icon.png` },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setProfileTab(tab.id)}
            aria-pressed={profileTab === tab.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              profileTab === tab.id
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-bg-secondary/50"
            }`}
          >
            <img src={tab.icon} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sub-tab: Quests ── */}
      {profileTab === "quests" && <QuestTracker hiscores={hiscores} />}

      {/* ── Sub-tab: Diaries ── */}
      {profileTab === "diaries" && <DiaryTracker hiscores={hiscores} />}

      {/* ── Sub-tab: Combat Tasks ── */}
      {profileTab === "combat" && (
        <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
          <CombatTasks />
        </Suspense>
      )}


      {/* ── Sub-tab: Overview (skills, bosses, etc.) ── */}
      {profileTab === "overview" && (
      <>
      {/* Skill grid — 3 columns, OSRS layout */}
      <div className="grid grid-cols-3 gap-1.5">
        {SKILL_ORDER.map((skillName) => {
          const skill = get(skillName);
          if (!skill) return null;
          const progress =
            skill.level < 99
              ? ((skill.xp - xpForLevel(skill.level)) /
                  (xpForLevel(skill.level + 1) - xpForLevel(skill.level))) *
                100
              : 100;

          return (
            <button
              key={skillName}
              onClick={() => navigate("skill-calc", { skill: skillName })}
              className="bg-bg-secondary rounded px-3 py-2 flex items-center justify-between hover:bg-bg-tertiary transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <WikiImage src={SKILL_ICONS[skillName]} alt="" className="w-4 h-4" fallback={skillName[0]} />
                <span
                  className={`text-sm font-medium ${
                    skill.level >= 99 ? "text-success" : ""
                  }`}
                >
                  {skill.level}
                </span>
                <span className="text-xs text-text-secondary">{skillName}</span>
              </div>
              <div className="flex items-center gap-2">
                {skill.level < 99 ? (
                  <>
                    {(() => {
                      const h = hoursTo99(skillName, skill.xp);
                      return h ? (
                        <span className="text-[10px] text-text-secondary/50 tabular-nums">{h}</span>
                      ) : null;
                    })()}
                    <div className="w-12 bg-bg-tertiary rounded-full h-1.5">
                      <div
                        className="bg-accent rounded-full h-1.5"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-success">MAX</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {/* Clue scroll breakdown */}
      {clueTiers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-2">
            Clue Scrolls
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {clueTiers.map((c) => (
              <div key={c.tier} className="flex items-center gap-2 px-4 py-2.5">
                <WikiImage src={itemIcon(`Clue scroll (${c.tier})`)} alt="" className="w-5 h-5" fallback="C" />
                <div>
                  <div className="text-sm font-bold">{c.count}</div>
                  <div className="text-[10px] text-text-secondary capitalize">{c.tier}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Minigames */}
      {hasMinigames && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-2">
            Minigames
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {wintertodt > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5">
                <img src={`${WIKI_IMG}/Wintertodt_icon.png`} alt="" className="w-5 h-5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div>
                  <div className="text-sm font-bold">{wintertodt.toLocaleString()}</div>
                  <div className="text-[10px] text-text-secondary">Wintertodt</div>
                </div>
              </div>
            )}
            {tempoross > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5">
                <img src={`${WIKI_IMG}/Tempoross.png`} alt="" className="w-5 h-5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div>
                  <div className="text-sm font-bold">{tempoross.toLocaleString()}</div>
                  <div className="text-[10px] text-text-secondary">Tempoross</div>
                </div>
              </div>
            )}
            {rifts > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5">
                <img src={`${WIKI_IMG}/Guardians_of_the_Rift_logo.png`} alt="" className="w-5 h-5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div>
                  <div className="text-sm font-bold">{rifts.toLocaleString()}</div>
                  <div className="text-[10px] text-text-secondary">GOTR Rifts</div>
                </div>
              </div>
            )}
            {gauntlet > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5">
                <img src={`${WIKI_IMG}/Crystalline_Hunllef_icon.png`} alt="" className="w-5 h-5" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div>
                  <div className="text-sm font-bold">{gauntlet.toLocaleString()}</div>
                  <div className="text-[10px] text-text-secondary">Corrupted Gauntlet</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boss Kill Counts */}
      {bossActivities.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary/60 mb-2">
            Boss Kill Counts
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {[...bossActivities].sort((a, b) => b.score - a.score).map((boss) => (
              <button
                key={boss.name}
                onClick={() => navigate("bosses", { boss: boss.name })}
                className="bg-bg-secondary rounded px-2 py-2 hover:bg-bg-tertiary transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 shrink-0 relative">
                  <img
                    src={bossIconSmall(boss.name)}
                    alt=""
                    className="w-6 h-6 rounded"
                    onError={(e) => {
                      // Try the large icon as fallback
                      const fallback = bossIcon(boss.name);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      } else {
                        e.currentTarget.style.display = "none";
                        const sib = e.currentTarget.nextElementSibling as HTMLElement;
                        if (sib) sib.style.display = "flex";
                      }
                    }}
                  />
                  <div
                    className="w-6 h-6 rounded bg-bg-tertiary text-[10px] font-bold text-text-secondary items-center justify-center hidden"
                  >
                    {boss.name[0]}
                  </div>
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-sm font-bold">{boss.score.toLocaleString()}</div>
                  <div className="text-[10px] text-text-secondary truncate" title={boss.name}>{boss.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      </>
      )}
    </div>
  );
}
