// Simple event bus so sidebar pill can show/open the update dialog

const UPDATE_OPEN_EVENT = "runewise:update-open";
const UPDATE_AVAILABLE_EVENT = "runewise:update-available";

export interface UpdateAvailableDetail {
  version: string;
}

export function emitOpenUpdate() {
  window.dispatchEvent(new Event(UPDATE_OPEN_EVENT));
}

export function onOpenUpdate(handler: () => void) {
  window.addEventListener(UPDATE_OPEN_EVENT, handler);
  return () => window.removeEventListener(UPDATE_OPEN_EVENT, handler);
}

export function emitUpdateAvailable(detail: UpdateAvailableDetail) {
  window.dispatchEvent(new CustomEvent<UpdateAvailableDetail>(UPDATE_AVAILABLE_EVENT, { detail }));
}

export function onUpdateAvailable(handler: (detail: UpdateAvailableDetail) => void) {
  const wrapper = (e: Event) => handler((e as CustomEvent<UpdateAvailableDetail>).detail);
  window.addEventListener(UPDATE_AVAILABLE_EVENT, wrapper);
  return () => window.removeEventListener(UPDATE_AVAILABLE_EVENT, wrapper);
}

export const UPDATE_MODE_KEY = "runewise_update_mode";
export type UpdateMode = "modal" | "pill";

export function getUpdateMode(): UpdateMode {
  return (localStorage.getItem(UPDATE_MODE_KEY) as UpdateMode) ?? "modal";
}

export function setUpdateMode(mode: UpdateMode) {
  localStorage.setItem(UPDATE_MODE_KEY, mode);
}
