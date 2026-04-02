/* eslint-disable react-refresh/only-export-components */
import { lazy, type LazyExoticComponent, type ComponentType, type ReactNode } from "react";
import type { HiscoreData } from "./api/hiscores";
import type { View } from "./features";

const Home = lazy(() => import("../features/home/Home"));
const Overview = lazy(() => import("../features/overview/Overview"));
const SkillCalculator = lazy(() => import("../features/skill-calc/SkillCalculator"));
const DryCalculator = lazy(() => import("../features/dry-calc/DryCalculator"));
const XpTable = lazy(() => import("../features/xp-table/XpTable"));
const News = lazy(() => import("../features/news/News"));
const XpTracker = lazy(() => import("../features/tracker/XpTracker"));
const BossGuide = lazy(() => import("../features/boss-guide/BossGuide"));
const SlayerHelper = lazy(() => import("../features/slayer/SlayerHelper"));
const PetCalculator = lazy(() => import("../features/pet-calc/PetCalculator"));
const DpsCalculator = lazy(() => import("../features/dps-calc/DpsCalculator"));
const Watchlist = lazy(() => import("../features/watchlist/Watchlist"));
const FarmTimers = lazy(() => import("../features/timers/FarmTimers"));
const MoneyMaking = lazy(() => import("../features/money-making/MoneyMaking"));
const CombatTasks = lazy(() => import("../features/combat-tasks/CombatTasks"));
const ClueHelper = lazy(() => import("../features/clue-helper/ClueHelper"));
const ShootingStars = lazy(() => import("../features/stars/ShootingStars"));
const WikiLookup = lazy(() => import("../features/wiki-lookup/WikiLookup"));
const About = lazy(() => import("../features/about/About"));
const Settings = lazy(() => import("../features/settings/Settings"));
const Market = lazy(() => import("../features/market/Market"));
const PlayerLookup = lazy(() => import("../features/player-lookup/PlayerLookup"));
const Loot = lazy(() => import("../features/loot/Loot"));
const Progress = lazy(() => import("../features/progress/Progress"));
const GearCompare = lazy(() => import("../features/gear-compare/GearCompare"));
const WorldMap = lazy(() => import("../features/world-map/WorldMap"));
import EmptyState from "../components/EmptyState";
import { NAV_ICONS } from "./sprites";
const TrainingPlan = lazy(() => import("../features/training-plan/TrainingPlan"));
const CollectionLog = lazy(() => import("../features/collection-log/CollectionLog"));
const Raids = lazy(() => import("../features/raids/Raids"));

interface AppViewContext {
  hiscores: {
    rsn: string;
    data: HiscoreData | null;
  };
}

type ViewRenderer = (context: AppViewContext) => ReactNode;

function renderComponent(Component: LazyExoticComponent<ComponentType>) {
  return () => <Component />;
}

export const VIEW_RENDERERS: Record<View, ViewRenderer> = {
  home: ({ hiscores }) => <Home hiscores={hiscores} />,
  overview: ({ hiscores }) =>
    hiscores.data ? (
      <Overview hiscores={hiscores.data} rsn={hiscores.rsn} />
    ) : (
      <EmptyState
        icon={NAV_ICONS.overview}
        title="Set your RSN to get started"
        description="Enter your RuneScape name above to turn RuneWise into a personalized command center."
      />
    ),
  lookup: renderComponent(PlayerLookup),
  "skill-calc": ({ hiscores }) => <SkillCalculator hiscores={hiscores.data} />,
  "dry-calc": renderComponent(DryCalculator),
  "xp-table": renderComponent(XpTable),
  "collection-log": renderComponent(CollectionLog),
  tracker: ({ hiscores }) => <XpTracker rsn={hiscores.rsn} />,
  bosses: ({ hiscores }) => <BossGuide hiscores={hiscores.data} />,
  raids: renderComponent(Raids),
  loot: () => <Loot key={window.location.hash} />,
  progress: ({ hiscores }) => <Progress key={window.location.hash} hiscores={hiscores.data} />,
  slayer: renderComponent(SlayerHelper),
  news: renderComponent(News),
  "pet-calc": ({ hiscores }) => <PetCalculator hiscores={hiscores.data} />,
  "dps-calc": ({ hiscores }) => <DpsCalculator hiscores={hiscores.data} />,
  "training-plan": ({ hiscores }) => <TrainingPlan hiscores={hiscores.data} />,
  "gear-compare": renderComponent(GearCompare),
  watchlist: renderComponent(Watchlist),
  timers: renderComponent(FarmTimers),
  "money-making": ({ hiscores }) => <MoneyMaking hiscores={hiscores.data} />,
  "combat-tasks": () => <CombatTasks key={window.location.hash} />,
  "clue-helper": renderComponent(ClueHelper),
  "world-map": renderComponent(WorldMap),
  stars: renderComponent(ShootingStars),
  wiki: () => <WikiLookup key={window.location.hash} />,
  market: renderComponent(Market),
  about: renderComponent(About),
  settings: renderComponent(Settings),
};
