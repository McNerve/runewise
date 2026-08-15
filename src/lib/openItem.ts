import type { View } from "./features";

type Navigate = (view: View, params?: Record<string, string>) => void;

/** Open an item as a wiki article (infobox + live GE), not a market row. */
export function openItemPage(navigate: Navigate, name: string) {
  navigate("wiki", { page: name, query: name });
}

export function itemWikiHash(name: string): string {
  const params = new URLSearchParams({ page: name, query: name });
  return `#wiki?${params.toString()}`;
}
