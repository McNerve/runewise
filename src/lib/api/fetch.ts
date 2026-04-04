import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../env";

interface ProxyResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  if (!isTauri) {
    const timeout = AbortSignal.timeout(20_000);
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout;
    return globalThis.fetch(url, { ...options, signal });
  }

  const headers: Record<string, string> = {};
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, options.headers);
    }
  }

  const result = await invoke<ProxyResponse>("proxy_fetch", {
    url,
    headers: Object.keys(headers).length > 0 ? headers : null,
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
