/**
 * Pure helpers for in-app back navigation.
 *
 * When the user lands via a deep link (or first load), there is no in-app
 * history depth — calling history.back() would leave the app. In that case
 * fall back to home instead.
 */

export type GoBackAction = "history-back" | "navigate-home" | "noop";

export function resolveGoBackAction(
  inAppDepth: number,
  view: string,
  params: Record<string, string>
): GoBackAction {
  if (inAppDepth > 0) return "history-back";
  const onBareHome = view === "home" && Object.keys(params).length === 0;
  if (onBareHome) return "noop";
  return "navigate-home";
}

/** Back is available when we have stack depth or are not on bare home. */
export function resolveCanGoBack(
  inAppDepth: number,
  view: string,
  params: Record<string, string>
): boolean {
  if (inAppDepth > 0) return true;
  return view !== "home" || Object.keys(params).length > 0;
}
