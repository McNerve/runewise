// Browser-style page history for the wiki reader. Pure transitions so the
// stack logic is testable; the component keeps the current value in state and
// mirrors it into a module-level slot so it survives view remounts.

export interface WikiHistory {
  stack: string[];
  index: number;
}

export const EMPTY_HISTORY: WikiHistory = { stack: [], index: -1 };

/** Records a visit: drops any forward entries, dedupes consecutive repeats. */
export function visit(history: WikiHistory, page: string): WikiHistory {
  if (history.stack[history.index] === page) return history;
  const stack = [...history.stack.slice(0, history.index + 1), page];
  return { stack, index: stack.length - 1 };
}

export function canGoBack(history: WikiHistory): boolean {
  return history.index > 0;
}

export function canGoForward(history: WikiHistory): boolean {
  return history.index >= 0 && history.index < history.stack.length - 1;
}

export function goBack(history: WikiHistory): WikiHistory {
  return canGoBack(history) ? { ...history, index: history.index - 1 } : history;
}

export function goForward(history: WikiHistory): WikiHistory {
  return canGoForward(history) ? { ...history, index: history.index + 1 } : history;
}

export function currentPage(history: WikiHistory): string | null {
  return history.stack[history.index] ?? null;
}

// Survives WikiLookup unmounting (view switches) for the lifetime of the app.
let persisted: WikiHistory = EMPTY_HISTORY;

export function loadPersistedHistory(): WikiHistory {
  return persisted;
}

export function persistHistory(history: WikiHistory): void {
  persisted = history;
}
