import { lazy, Suspense, useEffect, useState } from "react";
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

function resolveTab(raw: string | undefined): Tab {
  if (raw === "diaries" || raw === "combat-tasks" || raw === "unlock") return raw;
  return "quests";
}

export default function Progress({ hiscores }: Props) {
  const { params } = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>(() => resolveTab(params.tab));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from nav params
    setActiveTab(resolveTab(params.tab));
  }, [params.tab]);

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-on-accent"
                : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "quests" && <QuestTracker hiscores={hiscores ?? null} />}
      {activeTab === "diaries" && <DiaryTracker hiscores={hiscores ?? null} />}
      {activeTab === "combat-tasks" && (
        <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
          <CombatTasks />
        </Suspense>
      )}
      {activeTab === "unlock" && hiscores && (
        <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
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
