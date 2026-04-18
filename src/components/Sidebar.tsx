import { memo, useMemo } from "react";

declare const __APP_VERSION__: string;
import * as Tooltip from "@radix-ui/react-tooltip";
import type { View } from "../lib/NavigationContext";
import { isMac } from "../lib/env";
import { useSettings } from "../hooks/useSettings";
import { FEATURE_FAMILIES, SIDEBAR_FEATURES } from "../lib/features";
import { getFeatureAccent } from "../lib/featureAccent";
import ShellIcon from "./ShellIcon";
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

  const getIconStyle = (view: View, active: boolean) => {
    const accent = getFeatureAccent(view);
    return {
      color: active ? accent : `color-mix(in srgb, ${accent} 72%, var(--color-text-secondary))`,
    };
  };

  return (
    <Tooltip.Provider delayDuration={200}>
    <aside
      className={`sidebar-shell ${collapsed ? "w-16" : "w-56"} flex flex-col overflow-hidden border-r border-border transition-all duration-200`}
    >
      <div
        className={`${collapsed ? "px-3 py-3 justify-center" : "px-4 py-3"} flex items-center border-b border-border/80`}
      >
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">RuneWise</h1>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary/70 transition-colors hover:bg-bg-secondary/50 hover:text-text-primary"
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
        className={`sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? "compact-sidebar-scroll px-2 py-2" : "px-2 py-2"}`}
      >
        {/* Pinned section */}
        {settings.sidebar.pinned.length > 0 && (
          <div>
            {settings.sidebar.pinned.map((pinnedId) => {
              const item = SIDEBAR_FEATURES.find((f) => f.id === pinnedId);
              if (!item) return null;
              const accent = getFeatureAccent(item.id);
              return (
                <button
                  key={`pin-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const next = settings.sidebar.pinned.filter((p) => p !== item.id);
                    update({ sidebar: { ...settings.sidebar, pinned: next } });
                  }}
                  aria-current={currentView === item.id ? "page" : undefined}
                  style={{ "--item-accent": accent } as React.CSSProperties}
                  className={`sidebar-nav-item w-full text-left ${collapsed ? "mx-auto h-9 w-9 justify-center px-0 py-0" : "px-2.5 py-[3px]"} rounded-lg text-[13px] flex items-center gap-2.5 transition-colors ${
                    currentView === item.id ? "font-medium" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className={`inline-flex shrink-0 items-center justify-center ${collapsed ? "h-7 w-7" : "h-5 w-5"}`} style={getIconStyle(item.id, currentView === item.id)}>
                    <ShellIcon view={item.id} className={`${collapsed ? "h-4.5 w-4.5" : "h-[18px] w-[18px]"} shrink-0`} />
                  </span>
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{item.navLabel}</span>}
                </button>
              );
            })}
            <div className={`border-t border-accent/20 ${collapsed ? "my-1 mx-1" : "my-1.5 mx-2"}`} />
          </div>
        )}

        {groupedFeatures.map((section, index) => (
          <div key={section.family}>
            {index > 0 && (
              <div className={`border-t border-border/25 ${collapsed ? "my-1 mx-1" : "my-1.5 mx-2"}`} />
            )}
            <div>
              {section.items.map((item) => {
                const accent = getFeatureAccent(item.id);
                const isPinned = settings.sidebar.pinned.includes(item.id);
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
                        update({ sidebar: { ...settings.sidebar, pinned: [...settings.sidebar.pinned, item.id] } });
                      }
                    }}
                    aria-current={currentView === item.id ? "page" : undefined}
                    style={{ "--item-accent": accent } as React.CSSProperties}
                    className={`sidebar-nav-item w-full text-left ${collapsed ? "mx-auto h-9 w-9 justify-center px-0 py-0" : "px-2.5 py-[3px]"} rounded-lg text-[13px] flex items-center gap-2.5 transition-colors ${
                      currentView === item.id
                        ? "font-medium"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span
                      className={`inline-flex shrink-0 items-center justify-center ${collapsed ? "h-7 w-7" : "h-5 w-5"}`}
                      style={getIconStyle(item.id, currentView === item.id)}
                    >
                      <ShellIcon view={item.id} className={`${collapsed ? "h-4.5 w-4.5" : "h-[18px] w-[18px]"} shrink-0`} />
                    </span>
                    {!collapsed && (
                      <span className="min-w-0 flex-1 truncate">{item.navLabel}</span>
                    )}
                    {!collapsed && settings.keybindsEnabled && viewKeys[item.id] && (
                      <span className="text-[10px] text-text-secondary/45 tabular-nums">{viewKeys[item.id]}</span>
                    )}
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip.Root key={item.id} delayDuration={200}>
                      <Tooltip.Trigger asChild>{navButton}</Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content className="tooltip-content" side="right" sideOffset={8}>
                          {item.navLabel}
                          <Tooltip.Arrow className="fill-bg-tertiary" />
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
      {!collapsed && (
        <SessionWidget rsn={rsn} onNavigate={onNavigate} />
      )}
      <div className={`${collapsed ? "p-2" : "px-2.5 py-2"} border-t border-border/80`}>
        {collapsed ? (
          <button
            onClick={() => onNavigate("settings")}
            title="Settings"
            aria-current={currentView === "settings" ? "page" : undefined}
            className="sidebar-nav-item mx-auto h-9 w-9 justify-center px-0 py-0 rounded-lg flex items-center transition-colors text-text-secondary hover:text-text-primary"
          >
            <ShellIcon view="settings" className="h-4.5 w-4.5 shrink-0" />
          </button>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={openGlobalSearch}
              className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-bg-secondary/30 px-2.5 py-1.5 text-[11px] text-text-secondary transition hover:bg-bg-secondary/60 hover:text-text-primary"
            >
              <span>Search</span>
              <kbd className="rounded border border-border/50 bg-bg-tertiary/40 px-1.5 py-0.5 font-mono text-[9px] text-text-secondary/60">
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
                    ? "text-accent"
                    : "text-text-secondary/60 hover:text-text-primary"
                }`}
              >
                <ShellIcon view="settings" className="h-3.5 w-3.5" />
                Settings
              </button>
              <span className="text-[9px] text-text-secondary/30 tabular-nums">v{__APP_VERSION__}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
    </Tooltip.Provider>
  );
});

export default Sidebar;
