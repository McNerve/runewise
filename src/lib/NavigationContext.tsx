import { createContext, useContext, useState, useCallback } from "react";

export type View =
  | "overview"
  | "skill-calc"
  | "combat-calc"
  | "dry-calc"
  | "ge"
  | "item-db"
  | "xp-table"
  | "drops"
  | "tracker"
  | "bosses"
  | "quests"
  | "diaries"
  | "slayer"
  | "news"
  | "about";

interface NavState {
  view: View;
  params: Record<string, string>;
}

interface NavigationContextValue {
  view: View;
  params: Record<string, string>;
  navigate: (view: View, params?: Record<string, string>) => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  view: "overview",
  params: {},
  navigate: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavState>({ view: "overview", params: {} });

  const navigate = useCallback((view: View, params?: Record<string, string>) => {
    setState({ view, params: params ?? {} });
  }, []);

  return (
    <NavigationContext.Provider value={{ view: state.view, params: state.params, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNavigation() {
  return useContext(NavigationContext);
}
