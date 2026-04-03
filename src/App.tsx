import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import GlobalSearch from "./components/GlobalSearch";
const UpdateDialog = lazy(() => import("./components/UpdateDialog"));
import ErrorBoundary from "./components/ErrorBoundary";
import { CardSkeleton } from "./components/Skeleton";
import { useHiscores } from "./hooks/useHiscores";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { NavigationProvider, useNavigation } from "./lib/NavigationContext";
import { SettingsContext } from "./hooks/useSettings";
import { useSettingsProvider } from "./hooks/useSettings";
import { VIEW_RENDERERS } from "./lib/viewRegistry";
import { getFeatureAccent } from "./lib/featureAccent";

function AppContent() {
  const { view, navigate } = useNavigation();
  const hiscores = useHiscores();
  useKeyboardNav(navigate);
  const renderView = VIEW_RENDERERS[view];

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
          <main
            className="content-area flex-1 overflow-y-auto p-6"
            style={{ "--feature-accent": getFeatureAccent(view) } as React.CSSProperties}
          >
            <div className="max-w-5xl mx-auto">
              <ErrorBoundary>
                <Suspense fallback={<div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={view}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      {renderView
                        ? renderView({
                            hiscores: {
                              rsn: hiscores.rsn,
                              data: hiscores.data,
                            },
                          })
                        : <div className="py-16 text-center text-text-secondary">View not found.</div>}
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      <GlobalSearch />
      <Suspense fallback={null}>
        <UpdateDialog />
      </Suspense>
    </>
  );
}

function App() {
  const settingsValue = useSettingsProvider();

  return (
    <SettingsContext.Provider value={settingsValue}>
      <Tooltip.Provider delayDuration={300}>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </Tooltip.Provider>
    </SettingsContext.Provider>
  );
}

export default App;
