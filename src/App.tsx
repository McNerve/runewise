import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as Tooltip from "@radix-ui/react-tooltip";
import Sidebar from "./components/Sidebar";
import PlayerBar from "./components/PlayerBar";
import GlobalSearch from "./components/GlobalSearch";
const UpdateDialog = lazy(() => import("./components/UpdateDialog"));
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
import { initDiscordRpc, updateDiscordRpc } from "./lib/discord-rpc";

function AppContent() {
  const { view, navigate } = useNavigation();
  const hiscores = useHiscores();
  const { settings, update: updateSettings } = useSettings();
  useKeyboardNav(navigate);
  const renderView = VIEW_RENDERERS[view];

  // Auto-toggle ironman mode when an ironman account is detected
  useEffect(() => {
    const isIronman = hiscores.ironmanType !== "none";
    if (isIronman !== settings.ironmanMode) {
      updateSettings({ ironmanMode: isIronman });
    }
  }, [hiscores.ironmanType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close-to-tray: listen for Rust close-requested event and hide instead of closing
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | null = null;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("runewise:close-requested", async () => {
        const { settings: currentSettings } = await import("./lib/settings").then((m) => ({
          settings: m.loadSettings(),
        }));
        if (currentSettings.closeToTray) {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          await getCurrentWindow().hide();
        } else {
          const { exit } = await import("@tauri-apps/plugin-process");
          await exit(0);
        }
      }).then((fn) => { unlisten = fn; });
    });
    return () => { unlisten?.(); };
  }, []); // intentionally runs once — listener references stable Tauri API

  // Discord Rich Presence: init when enabled, update on view change
  useEffect(() => {
    if (!isTauri || !settings.discordRpc) return;
    initDiscordRpc();
  }, [settings.discordRpc]);

  useEffect(() => {
    if (!isTauri || !settings.discordRpc) return;
    updateDiscordRpc(view, hiscores.rsn);
  }, [view, hiscores.rsn, settings.discordRpc]);

  return (
    <>
      <div className="flex h-screen">
        <Sidebar currentView={view} onNavigate={navigate} rsn={hiscores.rsn} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PlayerBar
            rsn={hiscores.rsn}
            loading={hiscores.loading}
            error={hiscores.error}
            onLookup={hiscores.lookup}
            onClear={hiscores.clear}
          />
          <main
            aria-label="Main content"
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
                              ironmanType: hiscores.ironmanType,
                              lastFetched: hiscores.lastFetched,
                              onRefresh: () => { void hiscores.lookup(hiscores.rsn); },
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
