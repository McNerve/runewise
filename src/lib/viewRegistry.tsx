/* eslint-disable react-refresh/only-export-components */
import { lazy, type LazyExoticComponent, type ComponentType, type ReactNode } from "react";
import type { HiscoreData, IronmanType } from "./api/hiscores";
import type { View } from "./features";
import ViewErrorBoundary from "../components/ViewErrorBoundary";
import EmptyState from "../components/EmptyState";
import { NAV_ICONS } from "./sprites";

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
const Spells = lazy(() => import("../features/spells/Spells"));
const TrainingPlan = lazy(() => import("../features/training-plan/TrainingPlan"));
const CollectionLog = lazy(() => import("../features/collection-log/CollectionLog"));
const Raids = lazy(() => import("../features/raids/Raids"));
const ProductionCalc = lazy(() => import("../features/production/ProductionCalc"));
const ShopHelper = lazy(() => import("../features/shop-helper/ShopHelper"));
const Kingdom = lazy(() => import("../features/kingdom/Kingdom"));
const FlipJournal = lazy(() => import("../features/flip-journal/FlipJournal"));

interface AppViewContext {
  hiscores: {
    rsn: string;
    data: HiscoreData | null;
    ironmanType: IronmanType;
    lastFetched?: Date | null;
    onRefresh?: () => void;
    loading?: boolean;
    error?: string | null;
  };
}

type ViewRenderer = (context: AppViewContext) => ReactNode;

/** Wrap any view renderer so a crash stays isolated to that tool. */
function withBoundary(viewName: string, render: ViewRenderer): ViewRenderer {
  return (context) => (
    <ViewErrorBoundary viewName={viewName}>
      {render(context)}
    </ViewErrorBoundary>
  );
}

function renderComponent(Component: LazyExoticComponent<ComponentType>, name: string) {
  return withBoundary(name, () => <Component />);
}

export const VIEW_RENDERERS: Record<View, ViewRenderer> = {
  home: withBoundary("Home", ({ hiscores }) => <Home hiscores={hiscores} />),
  overview: withBoundary("Profile", ({ hiscores }) => {
    if (hiscores.loading && hiscores.rsn) {
      return (
        <div className="py-12 space-y-3 max-w-xl">
          <div className="animate-pulse bg-bg-tertiary/50 h-5 rounded w-1/3" />
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-2/3" />
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-1/2" />
        </div>
      );
    }
    if (hiscores.data) {
      return (
        <Overview
          hiscores={hiscores.data}
          rsn={hiscores.rsn}
          lastFetched={hiscores.lastFetched ?? null}
          onRefresh={hiscores.onRefresh}
        />
      );
    }
    if (hiscores.rsn && hiscores.error) {
      return (
        <EmptyState
          icon={NAV_ICONS.overview}
          title={`Could not load ${hiscores.rsn}`}
          description={hiscores.error}
        />
      );
    }
    if (hiscores.rsn) {
      return (
        <EmptyState
          icon={NAV_ICONS.overview}
          title="Profile unavailable"
          description="Hiscores data is not loaded yet. Retry from the player bar or check your connection."
        />
      );
    }
    return (
      <EmptyState
        icon={NAV_ICONS.overview}
        title="Set your RSN to get started"
        description="Enter your RuneScape name above to turn RuneWise into a personalized command center."
      />
    );
  }),
  lookup: renderComponent(PlayerLookup, "Hiscores Lookup"),
  "skill-calc": withBoundary("Skill Calculator", ({ hiscores }) => (
    <SkillCalculator hiscores={hiscores.data} />
  )),
  "dry-calc": withBoundary("Dry Calculator", ({ hiscores }) => (
    <DryCalculator hiscores={hiscores.data} />
  )),
  "xp-table": renderComponent(XpTable, "XP Table"),
  "collection-log": withBoundary("Collection Log", ({ hiscores }) => (
    <CollectionLog rsn={hiscores.rsn} />
  )),
  tracker: withBoundary("XP Tracker", ({ hiscores }) => (
    <XpTracker rsn={hiscores.rsn} />
  )),
  bosses: withBoundary("Boss Guides", ({ hiscores }) => (
    <BossGuide hiscores={hiscores.data} />
  )),
  raids: renderComponent(Raids, "Raid Guides"),
  loot: withBoundary("Loot", () => <Loot key={window.location.hash} />),
  progress: withBoundary("Character Progress", ({ hiscores }) => (
    <Progress key={window.location.hash} hiscores={hiscores.data} />
  )),
  slayer: renderComponent(SlayerHelper, "Slayer Helper"),
  news: renderComponent(News, "OSRS News"),
  "pet-calc": withBoundary("Pet Calculator", ({ hiscores }) => (
    <PetCalculator hiscores={hiscores.data} rsn={hiscores.rsn} />
  )),
  "dps-calc": withBoundary("DPS Calculator", ({ hiscores }) => (
    <DpsCalculator hiscores={hiscores.data} />
  )),
  "training-plan": withBoundary("Training Plan", ({ hiscores }) => (
    <TrainingPlan hiscores={hiscores.data} />
  )),
  "gear-compare": renderComponent(GearCompare, "Gear Compare"),
  watchlist: renderComponent(Watchlist, "Watchlist"),
  timers: renderComponent(FarmTimers, "Farming Timers"),
  "money-making": withBoundary("Money Making", ({ hiscores }) => (
    <MoneyMaking hiscores={hiscores.data} />
  )),
  "combat-tasks": withBoundary("Combat Tasks", () => (
    <CombatTasks key={window.location.hash} />
  )),
  "clue-helper": renderComponent(ClueHelper, "Clue Helper"),
  spells: renderComponent(Spells, "Spells"),
  "world-map": renderComponent(WorldMap, "World Map"),
  stars: renderComponent(ShootingStars, "Star Helper"),
  wiki: withBoundary("OSRS Wiki", () => <WikiLookup key={window.location.hash} />),
  market: renderComponent(Market, "Items & Watchlist"),
  "production-calc": renderComponent(ProductionCalc, "Recipe Calculator"),
  "shop-helper": renderComponent(ShopHelper, "Shop Helper"),
  kingdom: renderComponent(Kingdom, "Kingdom Calculator"),
  "flip-journal": renderComponent(FlipJournal, "Flip Journal"),
  about: renderComponent(About, "About"),
  settings: renderComponent(Settings, "Settings"),
};
