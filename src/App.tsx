import { lazy, Suspense } from "react";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import GlobalSearch from "./components/GlobalSearch";
import { CardSkeleton } from "./components/Skeleton";

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
const AlchCalculator = lazy(() => import("./features/alch-calc/AlchCalculator"));
const PetCalculator = lazy(() => import("./features/pet-calc/PetCalculator"));
const BossLootCalculator = lazy(() => import("./features/boss-loot/BossLootCalculator"));
const DpsCalculator = lazy(() => import("./features/dps-calc/DpsCalculator"));
const PriceChart = lazy(() => import("./features/price-charts/PriceChart"));
const Watchlist = lazy(() => import("./features/watchlist/Watchlist"));
const FarmTimers = lazy(() => import("./features/timers/FarmTimers"));
const MoneyMaking = lazy(() => import("./features/money-making/MoneyMaking"));
const CombatTasks = lazy(() => import("./features/combat-tasks/CombatTasks"));
const ClueHelper = lazy(() => import("./features/clue-helper/ClueHelper"));
const RuneLiteData = lazy(() => import("./features/runelite/RuneLiteData"));
const About = lazy(() => import("./features/about/About"));
import { useHiscores } from "./hooks/useHiscores";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { NavigationProvider, useNavigation } from "./lib/NavigationContext";

function AppContent() {
  const { view, navigate } = useNavigation();
  const hiscores = useHiscores();
  useKeyboardNav(navigate);

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
      case "alch-calc":
        return <AlchCalculator />;
      case "pet-calc":
        return <PetCalculator hiscores={hiscores.data} />;
      case "boss-loot":
        return <BossLootCalculator />;
      case "dps-calc":
        return <DpsCalculator hiscores={hiscores.data} />;
      case "price-charts":
        return <PriceChart />;
      case "watchlist":
        return <Watchlist />;
      case "timers":
        return <FarmTimers />;
      case "money-making":
        return <MoneyMaking hiscores={hiscores.data} />;
      case "combat-tasks":
        return <CombatTasks hiscores={hiscores.data} />;
      case "clue-helper":
        return <ClueHelper />;
      case "runelite":
        return <RuneLiteData />;
      case "about":
        return <About />;
    }
  };

  return (
    <>
      <div className="flex h-screen">
        <Sidebar currentView={view} onNavigate={navigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PlayerBar
            rsn={hiscores.rsn}
            loading={hiscores.loading}
            error={hiscores.error}
            onLookup={hiscores.lookup}
            onClear={hiscores.clear}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <Suspense fallback={<div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>}>
              {renderView()}
            </Suspense>
          </main>
        </div>
      </div>
      <GlobalSearch />
    </>
  );
}

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;
