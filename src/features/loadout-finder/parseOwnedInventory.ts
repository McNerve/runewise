/**
 * Parse free-text / RuneLite-style bank dumps into owned item names
 * for Loadout Finder (count as 0 gp).
 *
 * Accepts:
 * - One item name per line
 * - "qty x Name" / "Name x qty" / "Name, qty"
 * - Simple CSV (name in first column, or "name,quantity")
 * - Comma / semicolon separated lists
 * - JSON array of strings, or objects with name/itemName/item fields
 *   (RuneLite bank tags export, simple plugin dumps)
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

function parseJsonOwned(text: string): string[] | null {
  const t = text.trim();
  if (!t.startsWith("[") && !t.startsWith("{")) return null;
  try {
    const data = JSON.parse(t) as unknown;
    const items: string[] = [];
    const push = (v: unknown) => {
      if (typeof v === "string") {
        const n = normalizeOwnedToken(v);
        if (n) items.push(n);
      } else if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        const name =
          o.name ?? o.itemName ?? o.item ?? o.Name ?? o["item name"];
        if (typeof name === "string") {
          const n = normalizeOwnedToken(name);
          if (n) items.push(n);
        }
      }
    };
    if (Array.isArray(data)) {
      for (const row of data) push(row);
    } else if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      // { items: [...] } or { bank: [...] }
      const arr = o.items ?? o.bank ?? o.inventory ?? o.data;
      if (Array.isArray(arr)) for (const row of arr) push(row);
    }
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

/**
 * Parse a multi-line bank dump / CSV / JSON paste into unique item names
 * (order preserved, case kept from first sighting).
 */
export function parseOwnedInventory(text: string): string[] {
  if (!text?.trim()) return [];

  const fromJson = parseJsonOwned(text);
  if (fromJson) {
    // Dedupe
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of fromJson) {
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
    return out;
  }

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
