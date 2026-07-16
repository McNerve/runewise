import { memo, useMemo, useState, useEffect } from "react";

declare const __APP_VERSION__: string;
import * as Tooltip from "@radix-ui/react-tooltip";
import type { View } from "../lib/NavigationContext";
import { isMac } from "../lib/env";
import { useSettings } from "../hooks/useSettings";
import { FEATURE_FAMILIES, SIDEBAR_FEATURES } from "../lib/features";
import { getFeatureAccent } from "../lib/featureAccent";
import ShellIcon from "./ShellIcon";
import { onUpdateAvailable, emitOpenUpdate, getUpdateMode } from "../lib/updateBus";
import SessionWidget from "../features/session-intelligence/SessionWidget";

const mod = isMac ? "⌘" : "Ctrl+";
const OPEN_SEARCH_EVENT = "runewise:open-search";

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View, params?: Record<string, string>) => void;
  rsn?: string;
}

const Sidebar = memo(function Sidebar({ currentView, onNavigate, rsn = "" }: SidebarProps) {
  const { settings, update } = useSettings();
  const collapsed = settings.sidebar.collapsed;
  const [pillVersion, setPillVersion] = useState<string | null>(null);

  useEffect(() => {
    if (getUpdateMode() !== "pill") return;
    return onUpdateAvailable(({ version }) => setPillVersion(version));
  }, []);

  const toggleCollapse = () => {
    update({ sidebar: { ...settings.sidebar, collapsed: !collapsed } });
  };

  const openGlobalSearch = () => {
    window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
  };

  const viewKeys = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [view, key] of Object.entries(settings.keybinds)) {
      map[view] = `${mod}${key.toUpperCase()}`;
    }
    return map;
  }, [settings.keybinds]);

  const groupedFeatures = useMemo(
    () =>
      FEATURE_FAMILIES.map((family) => ({
        family,
        items: SIDEBAR_FEATURES.filter((feature) => feature.family === family),
      })),
    []
  );

  const navClass = (active: boolean, compact: boolean) =>
    `sidebar-nav-item w-full text-left rounded-xl text-[13px] flex items-center gap-2.5 ${
      compact ? "mx-auto h-10 w-10 justify-center px-0 py-0" : "px-2.5 py-1.5"
    } ${active ? "font-semibold text-text-primary" : "text-text-secondary hover:text-text-primary"}`;

  const renderNavIcon = (view: View, active: boolean, compact: boolean) => {
    const accent = getFeatureAccent(view);
    return (
      <span
        className={`sidebar-icon-chip shrink-0 ${compact ? "h-8 w-8" : "h-7 w-7"}`}
        style={
          {
            "--item-accent": accent,
            color: active
              ? accent
              : `color-mix(in srgb, ${accent} 78%, var(--color-text-secondary))`,
          } as React.CSSProperties
        }
      >
        <ShellIcon view={view} className={`${compact ? "h-4 w-4" : "h-[17px] w-[17px]"} shrink-0`} />
      </span>
    );
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <aside
        className={`sidebar-shell ${collapsed ? "w-[4.25rem]" : "w-60"} flex flex-col overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]`}
      >
        <div
          className={`h-[4.25rem] ${collapsed ? "px-2 justify-center" : "px-3.5"} flex items-center gap-2 border-b border-border/50`}
        >
          {!collapsed && (
            <div className="flex-1 min-w-0 pl-0.5">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                    <path d="M8 1.2 2.5 4.1v5.1c0 3.1 2.2 5.7 5.5 6.6 3.3-.9 5.5-3.5 5.5-6.6V4.1L8 1.2Zm0 1.7 4.2 2.2v3.9c0 2.2-1.5 4-4.2 4.8-2.7-.8-4.2-2.6-4.2-4.8V5.1L8 2.9Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h1 className="display-face text-[1.05rem] font-semibold tracking-tight text-text-primary leading-none">
                    RuneWise
                  </h1>
                  <p className="mt-1 text-[10px] font-medium tracking-[0.14em] uppercase text-text-tertiary">
                    OSRS Companion
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="pressable inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-text-secondary/70 hover:border-border/60 hover:bg-bg-secondary/40 hover:text-text-primary"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              )}
            </svg>
          </button>
        </div>

        <nav
          aria-label="Main navigation"
          className={`sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? "compact-sidebar-scroll px-1.5 py-2.5" : "px-2.5 py-3"}`}
        >
          {settings.sidebar.pinned.length > 0 && (
            <div className="mb-1">
              {settings.sidebar.pinned.map((pinnedId) => {
                const item = SIDEBAR_FEATURES.find((f) => f.id === pinnedId);
                if (!item) return null;
                const accent = getFeatureAccent(item.id);
                const active = currentView === item.id;
                return (
                  <button
                    key={`pin-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const next = settings.sidebar.pinned.filter((p) => p !== item.id);
                      update({ sidebar: { ...settings.sidebar, pinned: next } });
                    }}
                    aria-current={active ? "page" : undefined}
                    style={{ "--item-accent": accent } as React.CSSProperties}
                    className={`${navClass(active, collapsed)} mb-0.5`}
                  >
                    {renderNavIcon(item.id, active, collapsed)}
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.navLabel}</span>}
                  </button>
                );
              })}
              <div className={`border-t border-accent/20 ${collapsed ? "my-1.5 mx-1" : "my-2 mx-2"}`} />
            </div>
          )}

          {groupedFeatures.map((section, index) => (
            <div key={section.family} className={index > 0 ? "mt-0.5" : ""}>
              {index > 0 && collapsed && (
                <div className="border-t border-border/30 my-1.5 mx-1" />
              )}
              {!collapsed && section.family !== "Home" && (
                <div className={`section-kicker px-2.5 pb-1.5 ${index > 0 ? "pt-3.5" : "pt-1"}`}>
                  {section.family}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const accent = getFeatureAccent(item.id);
                  const isPinned = settings.sidebar.pinned.includes(item.id);
                  const active = currentView === item.id;
                  const navButton = (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (isPinned) {
                          const next = settings.sidebar.pinned.filter((p) => p !== item.id);
                          update({ sidebar: { ...settings.sidebar, pinned: next } });
                        } else if (settings.sidebar.pinned.length < 5) {
                          update({
                            sidebar: {
                              ...settings.sidebar,
                              pinned: [...settings.sidebar.pinned, item.id],
                            },
                          });
                        }
                      }}
                      aria-current={active ? "page" : undefined}
                      style={{ "--item-accent": accent } as React.CSSProperties}
                      className={navClass(active, collapsed)}
                    >
                      {renderNavIcon(item.id, active, collapsed)}
                      {!collapsed && (
                        <span className="min-w-0 flex-1 truncate">{item.navLabel}</span>
                      )}
                      {!collapsed && settings.keybindsEnabled && viewKeys[item.id] && (
                        <span className="text-[10px] text-text-tertiary num">{viewKeys[item.id]}</span>
                      )}
                    </button>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip.Root key={item.id} delayDuration={200}>
                        <Tooltip.Trigger asChild>{navButton}</Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" side="right" sideOffset={10}>
                            {item.navLabel}
                            <Tooltip.Arrow className="fill-bg-overlay" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    );
                  }

                  return navButton;
                })}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && <SessionWidget rsn={rsn} onNavigate={onNavigate} />}

        <div className={`${collapsed ? "p-1.5" : "px-2.5 py-2.5"} border-t border-border/50`}>
          {collapsed ? (
            <button
              onClick={() => onNavigate("settings")}
              title="Settings"
              aria-current={currentView === "settings" ? "page" : undefined}
              className="sidebar-nav-item mx-auto h-10 w-10 justify-center px-0 py-0 rounded-xl flex items-center text-text-secondary hover:text-text-primary"
            >
              <ShellIcon view="settings" className="h-4 w-4 shrink-0" />
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={openGlobalSearch}
                className="pressable flex w-full items-center justify-between rounded-xl border border-border/60 bg-bg-secondary/35 px-3 py-2 text-[12px] text-text-secondary hover:border-accent/30 hover:bg-bg-secondary/55 hover:text-text-primary"
              >
                <span className="font-medium">Search</span>
                <kbd className="rounded-md border border-border/60 bg-bg-primary/50 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
                  {mod}K
                </kbd>
              </button>
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={() => onNavigate("settings")}
                  aria-current={currentView === "settings" ? "page" : undefined}
                  title="Settings"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] transition-colors ${
                    currentView === "settings"
                      ? "text-accent font-medium"
                      : "text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  <ShellIcon view="settings" className="h-3.5 w-3.5" />
                  Settings
                </button>
                <span className="text-[10px] text-text-tertiary/70 num">v{__APP_VERSION__}</span>
              </div>
              {pillVersion && (
                <button
                  onClick={() => emitOpenUpdate()}
                  className="pressable flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/12 px-2.5 py-2 text-[11px] font-medium text-accent hover:bg-accent/20"
                >
                  <svg viewBox="0 0 16 10" className="w-3 h-2" fill="none">
                    <path
                      d="M1 5h12M9 1l4 4-4 4"
                      stroke="var(--color-accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  v{pillVersion} ready
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </Tooltip.Provider>
  );
});

export default Sidebar;
