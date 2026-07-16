import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { FEATURE_REGISTRY, type View } from "./features";
import { saveRecentEntity } from "./recentEntities";
import { recordToolHit } from "./toolUsage";

export type { View } from "./features";

interface NavState {
  view: View;
  params: Record<string, string>;
}

interface NavigationContextValue {
  view: View;
  params: Record<string, string>;
  navigate: (view: View, params?: Record<string, string>) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const STORAGE_KEY = "runewise_navigation";

const VALID_VIEWS = new Set(Object.keys(FEATURE_REGISTRY));

// Legacy hashes that should silently redirect to a canonical view.
const LEGACY_ALIASES: Record<string, { view: View; params?: Record<string, string> }> = {
  "profit-hub": { view: "money-making", params: { tab: "rankings" } },
};

function parseHash(hash: string): NavState | null {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;

  const [viewPart, queryPart] = raw.split("?");
  if (!viewPart) return null;

  const params = Object.fromEntries(new URLSearchParams(queryPart ?? "").entries());

  const alias = LEGACY_ALIASES[viewPart];
  if (alias) {
    return {
      view: alias.view,
      params: { ...(alias.params ?? {}), ...params },
    };
  }

  if (!VALID_VIEWS.has(viewPart)) return null;

  return {
    view: viewPart as View,
    params,
  };
}

function serializeHash(state: NavState): string {
  const query = new URLSearchParams(state.params).toString();
  return query ? `#${state.view}?${query}` : `#${state.view}`;
}

function isValidNavState(value: unknown): value is NavState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { view?: unknown; params?: unknown };
  if (typeof candidate.view !== "string" || !VALID_VIEWS.has(candidate.view)) return false;
  if (candidate.params == null) return true;
  if (typeof candidate.params !== "object" || Array.isArray(candidate.params)) return false;
  return Object.values(candidate.params as Record<string, unknown>).every(
    (v) => typeof v === "string"
  );
}

function loadInitialState(): NavState {
  const fromHash = parseHash(window.location.hash);
  if (fromHash) return fromHash;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { view: "home", params: {} };
    const parsed: unknown = JSON.parse(raw);
    if (isValidNavState(parsed)) {
      return {
        view: parsed.view,
        params: parsed.params ?? {},
      };
    }
    return { view: "home", params: {} };
  } catch {
    return { view: "home", params: {} };
  }
}

const NavigationContext = createContext<NavigationContextValue>({
  view: "home",
  params: {},
  navigate: () => {},
  goBack: () => {},
  goForward: () => {},
  canGoBack: false,
  canGoForward: false,
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavState>(loadInitialState);

  const navigate = useCallback((view: View, params?: Record<string, string>) => {
    const nextState = { view, params: params ?? {} };
    const nextHash = serializeHash(nextState);

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
      return;
    }

    setState(nextState);
  }, []);

  const goBack = useCallback(() => {
    if (state.view === "home" && Object.keys(state.params).length === 0) return;

    if (window.location.hash) {
      window.history.back();
      return;
    }

    setState({ view: "home", params: {} });
  }, [state.view, state.params]);

  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore persistence failures and keep navigation functional.
    }
  }, [state]);

  useEffect(() => {
    saveRecentEntity(state.view, state.params);
    recordToolHit(state.view);
  }, [state]);

  useEffect(() => {
    const handleHashChange = () => {
      const next = parseHash(window.location.hash);
      if (next) {
        setState(next);
        return;
      }

      setState({ view: "home", params: {} });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        view: state.view,
        params: state.params,
        navigate,
        goBack,
        goForward,
        canGoBack: state.view !== "home" || Object.keys(state.params).length > 0,
        // Browser history API does not expose a reliable forward-stack size.
        // Keep the flag conservative so UI never pretends forward is available.
        canGoForward: false,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNavigation() {
  return useContext(NavigationContext);
}
