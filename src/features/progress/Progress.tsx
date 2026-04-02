import { lazy, Suspense, useState } from "react";
import { useNavigation } from "../../lib/NavigationContext";
import type { HiscoreData } from "../../lib/api/hiscores";
import QuestTracker from "../quests/QuestTracker";
import DiaryTracker from "../diaries/DiaryTracker";
import EmptyState from "../../components/EmptyState";
import { NAV_ICONS } from "../../lib/sprites";

const CombatTasks = lazy(() => import("../combat-tasks/CombatTasks"));
const QuestUnlock = lazy(() => import("./components/QuestUnlock"));

type Tab = "quests" | "diaries" | "combat-tasks" | "unlock";

const TABS: { id: Tab; label: string }[] = [
  { id: "quests", label: "Quests" },
  { id: "diaries", label: "Diaries" },
  { id: "combat-tasks", label: "Combat Tasks" },
  { id: "unlock", label: "What Can I Do?" },
];

interface Props {
  hiscores?: HiscoreData | null;
}

export default function Progress({ hiscores }: Props) {
  const { params } = useNavigation();
  const initialTab: Tab =
    params.tab === "diaries" ? "diaries" :
    params.tab === "combat-tasks" ? "combat-tasks" :
    params.tab === "unlock" ? "unlock" :
    "quests";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "quests" && <QuestTracker hiscores={hiscores ?? null} />}
      {activeTab === "diaries" && <DiaryTracker hiscores={hiscores ?? null} />}
      {activeTab === "combat-tasks" && (
        <Suspense fallback={<div className="py-8 text-center text-sm text-text-secondary">Loading...</div>}>
          <CombatTasks />
        </Suspense>
      )}
      {activeTab === "unlock" && hiscores && (
        <Suspense fallback={<div className="py-8 text-center text-sm text-text-secondary">Loading...</div>}>
          <QuestUnlock hiscores={hiscores} />
        </Suspense>
      )}
      {activeTab === "unlock" && !hiscores && (
        <EmptyState
          icon={NAV_ICONS.progress}
          title="No hiscores loaded"
          description="Look up your RSN above to see which quests you can tackle."
        />
      )}
    </div>
  );
}
