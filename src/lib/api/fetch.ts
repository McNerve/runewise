/**
 * Cross-environment fetch wrapper.
 * In Tauri: native fetch works fine — CSP allows the OSRS domains.
 * In browser dev: relies on Vite proxy for CORS.
 */

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return globalThis.fetch(url, options);
}
