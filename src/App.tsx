import { useState, lazy, Suspense } from "react";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";

const Overview = lazy(() => import("./features/overview/Overview"));
const SkillCalculator = lazy(() => import("./features/skill-calc/SkillCalculator"));
const CombatCalculator = lazy(() => import("./features/combat-calc/CombatCalculator"));
const DryCalculator = lazy(() => import("./features/dry-calc/DryCalculator"));
const GrandExchange = lazy(() => import("./features/ge/GrandExchange"));
const ItemDatabase = lazy(() => import("./features/item-db/ItemDatabase"));
const XpTable = lazy(() => import("./features/xp-table/XpTable"));
const News = lazy(() => import("./features/news/News"));
const DropTable = lazy(() => import("./features/drops/DropTable"));
const XpTracker = lazy(() => import("./features/tracker/XpTracker"));
const BossGuide = lazy(() => import("./features/boss-guide/BossGuide"));
const QuestTracker = lazy(() => import("./features/quests/QuestTracker"));
const DiaryTracker = lazy(() => import("./features/diaries/DiaryTracker"));
const SlayerHelper = lazy(() => import("./features/slayer/SlayerHelper"));
import { useHiscores } from "./hooks/useHiscores";
import { useKeyboardNav } from "./hooks/useKeyboardNav";

export type View =
  | "overview"
  | "skill-calc"
  | "combat-calc"
  | "dry-calc"
  | "ge"
  | "item-db"
  | "xp-table"
  | "drops"
  | "tracker"
  | "bosses"
  | "quests"
  | "diaries"
  | "slayer"
  | "news";

function App() {
  const [view, setView] = useState<View>("overview");
  const hiscores = useHiscores();
  useKeyboardNav(setView);

  const renderView = () => {
    switch (view) {
      case "overview":
        return hiscores.data ? (
          <Overview hiscores={hiscores.data} rsn={hiscores.rsn} />
        ) : (
          <div className="text-text-secondary text-sm">
            Enter your RSN above to see your stats overview.
          </div>
        );
      case "skill-calc":
        return <SkillCalculator hiscores={hiscores.data} />;
      case "combat-calc":
        return <CombatCalculator hiscores={hiscores.data} />;
      case "dry-calc":
        return <DryCalculator />;
      case "ge":
        return <GrandExchange />;
      case "item-db":
        return <ItemDatabase />;
      case "xp-table":
        return <XpTable />;
      case "drops":
        return <DropTable />;
      case "tracker":
        return <XpTracker rsn={hiscores.rsn} />;
      case "bosses":
        return <BossGuide />;
      case "quests":
        return <QuestTracker hiscores={hiscores.data} />;
      case "diaries":
        return <DiaryTracker hiscores={hiscores.data} />;
      case "slayer":
        return <SlayerHelper />;
      case "news":
        return <News />;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentView={view} onNavigate={setView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PlayerBar
          rsn={hiscores.rsn}
          loading={hiscores.loading}
          error={hiscores.error}
          onLookup={hiscores.lookup}
          onClear={hiscores.clear}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-sm text-text-secondary">Loading...</p></div>}>
            {renderView()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
