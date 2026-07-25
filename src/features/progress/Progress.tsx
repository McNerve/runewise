import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigation } from "../../lib/NavigationContext";
import type { HiscoreData } from "../../lib/api/hiscores";
import QuestTracker from "../quests/QuestTracker";
import DiaryTracker from "../diaries/DiaryTracker";
import EmptyState from "../../components/EmptyState";
import { NAV_ICONS } from "../../lib/sprites";
import Tabs, { type TabItem } from "../../components/primitives/Tabs";

const CombatTasks = lazy(() => import("../combat-tasks/CombatTasks"));
const QuestUnlock = lazy(() => import("./components/QuestUnlock"));
const QuestMap = lazy(() => import("../quest-map/QuestMap"));

type Tab = "quests" | "diaries" | "combat-tasks" | "unlock" | "quest-map";

const TABS: readonly TabItem<Tab>[] = [
  { id: "quests", label: "Quests" },
  { id: "diaries", label: "Diaries" },
  { id: "combat-tasks", label: "Combat Tasks" },
  { id: "unlock", label: "What Can I Do?" },
  { id: "quest-map", label: "Quest Map" },
];

interface Props {
  hiscores?: HiscoreData | null;
}

function resolveTab(raw: string | undefined, hasHiscores: boolean): Tab {
  if (raw === "diaries" || raw === "combat-tasks" || raw === "unlock" || raw === "quest-map" || raw === "quests") {
    return raw;
  }
  // With an account, lead with available-now quests instead of the full list.
  return hasHiscores ? "unlock" : "quests";
}

export default function Progress({ hiscores }: Props) {
  const { params } = useNavigation();
  const hasHiscores = Boolean(hiscores);
  const [activeTab, setActiveTab] = useState<Tab>(() => resolveTab(params.tab, hasHiscores));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from nav params
    setActiveTab(resolveTab(params.tab, hasHiscores));
  }, [params.tab, hasHiscores]);

  return (
    <div>
      <Tabs
        items={TABS}
        activeId={activeTab}
        onChange={setActiveTab}
        className="mb-6"
        ariaLabel="Progress sections"
      />

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
      {activeTab === "quest-map" && (
        <Suspense fallback={<div className="py-8 text-center"><div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-3/4 mx-auto" /></div>}>
          <QuestMap />
        </Suspense>
      )}
    </div>
  );
}
