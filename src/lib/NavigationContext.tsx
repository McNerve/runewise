import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { FEATURE_REGISTRY, type View } from "./features";
import { saveRecentEntity } from "./recentEntities";

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

function parseHash(hash: string): NavState | null {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;

  const [viewPart, queryPart] = raw.split("?");
  if (!viewPart || !VALID_VIEWS.has(viewPart)) return null;

  const params = Object.fromEntries(new URLSearchParams(queryPart ?? "").entries());
  return {
    view: viewPart as View,
    params,
  };
}

function serializeHash(state: NavState): string {
  const query = new URLSearchParams(state.params).toString();
  return query ? `#${state.view}?${query}` : `#${state.view}`;
}

function loadInitialState(): NavState {
  const fromHash = parseHash(window.location.hash);
  if (fromHash) return fromHash;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { view: "home", params: {} };
    return JSON.parse(raw) as NavState;
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
        canGoForward: window.history.length > 1,
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
