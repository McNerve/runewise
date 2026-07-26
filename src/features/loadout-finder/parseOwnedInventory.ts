/**
 * Parse free-text / RuneLite-style bank dumps into owned item names
 * for Loadout Finder (count as 0 gp).
 *
 * Accepts:
 * - One item name per line
 * - "qty x Name" / "Name x qty" / "Name, qty"
 * - Simple CSV (name in first column, or "name,quantity")
 * - Comma / semicolon separated lists
 */

const QTY_PREFIX = /^\s*(\d+)\s*[x×]\s+(.+)$/i;
const QTY_SUFFIX = /^(.+?)\s*[x×]\s*(\d+)\s*$/i;
const CSV_QTY = /^(.+?)\s*,\s*(\d+)\s*$/;

const HEADER_RE = /^(name|item|item name|quantity|qty|count|id)$/i;

/** Normalize a single token into an item name, or null if junk. */
export function normalizeOwnedToken(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  // Strip BOM / quotes
  s = s.replace(/^\uFEFF/, "").replace(/^["']|["']$/g, "").trim();
  if (!s || HEADER_RE.test(s)) return null;

  let m = s.match(QTY_PREFIX);
  if (m) s = m[2]!.trim();
  else {
    m = s.match(QTY_SUFFIX);
    if (m) s = m[1]!.trim();
    else {
      m = s.match(CSV_QTY);
      if (m) s = m[1]!.trim();
      else if (s.includes(",")) {
        // "name,quantity" header or "Item name, notes" → first field
        s = (s.split(",")[0] ?? "").trim();
      }
    }
  }

  if (!s || HEADER_RE.test(s) || /^\d+$/.test(s)) return null;
  // Collapse internal whitespace
  s = s.replace(/\s+/g, " ").trim();
  if (s.length < 2) return null;
  return s;
}

/**
 * Parse a multi-line bank dump / CSV paste into unique item names
 * (order preserved, case kept from first sighting).
 */
export function parseOwnedInventory(text: string): string[] {
  if (!text?.trim()) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  const add = (name: string | null) => {
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(name);
  };

  // Prefer line-based parse (RuneLite export, bank tags, etc.)
  const lines = text.split(/\r?\n/);
  const multiLine = lines.length > 1 || text.includes("\t");

  if (multiLine) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // TSV: take first column
      if (trimmed.includes("\t")) {
        const col = trimmed.split("\t")[0] ?? "";
        add(normalizeOwnedToken(col));
        continue;
      }
      // CSV with many columns: first field
      if (trimmed.includes(",") && trimmed.split(",").length > 2) {
        const first = trimmed.split(",")[0] ?? "";
        add(normalizeOwnedToken(first));
        continue;
      }
      add(normalizeOwnedToken(trimmed));
    }
    return out;
  }

  // Single line: comma / semicolon separated
  for (const part of text.split(/[,;|]/)) {
    add(normalizeOwnedToken(part));
  }
  return out;
}
