import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import OfflineBanner from "./components/OfflineBanner";
import GlobalSearch from "./components/GlobalSearch";
const UpdateDialog = lazy(() => import("./components/UpdateDialog"));
const Welcome = lazy(() => import("./features/onboarding/Welcome"));
import ErrorBoundary from "./components/ErrorBoundary";
import { initItemIconCache } from "./lib/itemIcons";
import { migrateFromLocalStorage } from "./lib/storage";
import { GEDataProvider, useGEDataProvider } from "./hooks/useGEData";
import { CardSkeleton } from "./components/Skeleton";
import { useHiscores } from "./hooks/useHiscores";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { NavigationProvider, useNavigation } from "./lib/NavigationContext";
import { SettingsContext, useSettings } from "./hooks/useSettings";
import { useSettingsProvider } from "./hooks/useSettings";
import { VIEW_RENDERERS } from "./lib/viewRegistry";
import { getFeatureAccent } from "./lib/featureAccent";
import { isTauri } from "./lib/env";
import { ONBOARDING_KEY, RSN_KEY } from "./features/onboarding/constants";

function AppContent() {
  const { view, navigate } = useNavigation();
  const hiscores = useHiscores();
  const { settings, update: updateSettings } = useSettings();
  useKeyboardNav(navigate);

  const [showOnboarding, setShowOnboarding] = useState(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const hasRsn = Boolean(localStorage.getItem(RSN_KEY));
    return !completed && !hasRsn;
  });
  /** Mobile nav drawer (sidebar overlay below md). */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const renderView = VIEW_RENDERERS[view];

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileNavOpen(false);
  }, [view]);

  // Seed ironman mode from account detection ONCE, then leave it to the user.
  // Never auto-disable (detection failures shouldn't flip the setting) and
  // never re-apply on relaunch (that clobbered a manual toggle every launch).
  useEffect(() => {
    if (hiscores.ironmanType === "none") return;
    const APPLIED_KEY = "runewise_ironman_autodetected";
    if (localStorage.getItem(APPLIED_KEY)) return;
    localStorage.setItem(APPLIED_KEY, "1");
    if (!settings.ironmanMode) updateSettings({ ironmanMode: true });
  }, [hiscores.ironmanType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close-to-tray: sync the setting into Rust state. Rust handles the close
  // event synchronously with that state — no event listener roundtrip, no
  // race between `listen()` registering and the first close click.
  useEffect(() => {
    if (!isTauri) return;
    import("@tauri-apps/api/core").then(({ invoke }) => {
      void invoke("set_close_to_tray", { enabled: settings.closeToTray });
    });
  }, [settings.closeToTray]);

  return (
    <>
      <div className="flex h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:flex h-full shrink-0">
          <Sidebar currentView={view} onNavigate={navigate} rsn={hiscores.rsn} />
        </div>

        {/* Mobile drawer overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex h-full w-56 max-w-[85vw] shadow-2xl">
              <Sidebar
                currentView={view}
                onNavigate={(v, p) => {
                  navigate(v, p);
                  setMobileNavOpen(false);
                }}
                rsn={hiscores.rsn}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <PlayerBar
            rsn={hiscores.rsn}
            loading={hiscores.loading}
            error={hiscores.error}
            onLookup={hiscores.lookup}
            onClear={hiscores.clear}
            onOpenNav={() => setMobileNavOpen(true)}
          />
          <OfflineBanner />
          <main
            aria-label="Main content"
            className="content-area flex-1 overflow-y-auto p-4 sm:p-5 md:p-6"
            style={{ "--feature-accent": getFeatureAccent(view) } as React.CSSProperties}
          >
            <div className="max-w-5xl mx-auto">
              <ErrorBoundary resetKey={view}>
                <Suspense fallback={<div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={view}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                    >
                      {renderView
                        ? renderView({
                            hiscores: {
                              rsn: hiscores.rsn,
                              data: hiscores.data,
                              ironmanType: hiscores.ironmanType,
                              lastFetched: hiscores.lastFetched,
                              onRefresh: () => { void hiscores.lookup(hiscores.rsn); },
                              loading: hiscores.loading,
                              error: hiscores.error,
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
      {showOnboarding && (
        <Suspense fallback={null}>
          <Welcome
            onDismiss={() => {
              setShowOnboarding(false);
              const savedRsn = localStorage.getItem(RSN_KEY)?.trim();
              if (savedRsn && savedRsn !== hiscores.rsn) {
                void hiscores.lookup(savedRsn);
              }
            }}
          />
        </Suspense>
      )}
    </>
  );
}

function App() {
  useEffect(() => {
    migrateFromLocalStorage();
    initItemIconCache();
  }, []);
  const settingsValue = useSettingsProvider();
  const geData = useGEDataProvider();

  return (
    <SettingsContext.Provider value={settingsValue}>
      <GEDataProvider value={geData}>
        <Tooltip.Provider delayDuration={300}>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </Tooltip.Provider>
      </GEDataProvider>
    </SettingsContext.Provider>
  );
}

export default App;
