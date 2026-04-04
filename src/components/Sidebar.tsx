import { useMemo } from "react";

declare const __APP_VERSION__: string;
import * as Tooltip from "@radix-ui/react-tooltip";
import type { View } from "../lib/NavigationContext";
import { isMac } from "../lib/env";
import { useSettings } from "../hooks/useSettings";
import { FEATURE_FAMILIES, SIDEBAR_FEATURES } from "../lib/features";
import { getFeatureAccent } from "../lib/featureAccent";
import ShellIcon from "./ShellIcon";

const mod = isMac ? "⌘" : "Ctrl+";
const OPEN_SEARCH_EVENT = "runewise:open-search";

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { settings, update } = useSettings();
  const collapsed = settings.sidebar.collapsed;

  const toggleCollapse = () => {
    update({ sidebar: { collapsed: !collapsed } });
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
        {groupedFeatures.map((section, index) => (
          <div key={section.family}>
            {index > 0 && (
              <div className={`border-t border-border/25 ${collapsed ? "my-1 mx-1" : "my-1.5 mx-2"}`} />
            )}
            <div>
              {section.items.map((item) => {
                const accent = getFeatureAccent(item.id);
                const navButton = (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
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
      <div className={`${collapsed ? "p-2" : "p-2.5"} space-y-2 border-t border-border/80`}>
        {!collapsed && (
          <button
            type="button"
            onClick={openGlobalSearch}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] text-text-secondary/70 transition hover:bg-bg-secondary/40 hover:text-text-primary"
          >
            <span>Search</span>
            <span className="rounded-md border border-border/80 px-1.5 py-0.5 font-mono text-[10px] text-text-secondary/65">
              {mod}K
            </span>
          </button>
        )}
        <button
          onClick={() => onNavigate("settings")}
          title={collapsed ? "Settings" : undefined}
          aria-current={currentView === "settings" ? "page" : undefined}
          style={{ "--item-accent": getFeatureAccent("settings") } as React.CSSProperties}
          className={`sidebar-nav-item w-full text-left ${collapsed ? "mx-auto h-9 w-9 justify-center px-0 py-0" : "px-2.5 py-[3px]"} rounded-lg text-[13px] flex items-center gap-2.5 transition-colors ${
            currentView === "settings"
              ? "font-medium"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <span
            className={`inline-flex shrink-0 items-center justify-center ${collapsed ? "h-7 w-7" : "h-5 w-5"}`}
            style={getIconStyle("settings", currentView === "settings")}
          >
            <ShellIcon view="settings" className={`${collapsed ? "h-4.5 w-4.5" : "h-[18px] w-[18px]"} shrink-0`} />
          </span>
          {!collapsed && <span className="flex-1">Settings</span>}
        </button>
        {!collapsed && (
          <div className="text-[10px] text-text-secondary/30 text-center mt-1 tabular-nums">
            v{__APP_VERSION__}
          </div>
        )}
      </div>
    </aside>
    </Tooltip.Provider>
  );
}
