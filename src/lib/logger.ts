function format(context: string, err: unknown): string {
  const detail = err instanceof Error ? err.message : String(err ?? "");
  return detail ? `[RuneWise] ${context}: ${detail}` : `[RuneWise] ${context}`;
}

export function warn(context: string, err?: unknown) {
  console.warn(format(context, err));
}

export function error(context: string, err?: unknown) {
  console.error(format(context, err));
}
