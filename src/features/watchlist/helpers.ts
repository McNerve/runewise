export function parseThresholdInput(value: string): number | null {
  const trimmed = value.trim().toLowerCase().replace(/,/g, "");
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const multiplier =
    match[2] === "b" ? 1_000_000_000 :
    match[2] === "m" ? 1_000_000 :
    match[2] === "k" ? 1_000 :
    1;

  return Math.round(amount * multiplier);
}
