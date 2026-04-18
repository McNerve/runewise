/**
 * Wiki comparison table parser.
 *
 * Detects wikitable elements that look like comparison tables (image/name column
 * + numeric stat columns + optional notes column) and converts them to typed
 * ComparisonTable structures.  Other wikitables fall through to HTML injection.
 */

import { normalizeImages } from "./helpers";

export interface ComparisonRow {
  image?: string;
  name: string;
  link?: string;
  stats: Record<string, string | number>;
  notes: string;
}

export interface ComparisonTable {
  caption?: string;
  columns: string[];
  rows: ComparisonRow[];
}

// ----- Heuristic classification -----

/**
 * Returns true when a <table> should be treated as a comparison table.
 *
 * Signature:
 *  - Has a header row with ≥ 3 columns
 *  - First column is an image / name column (short header or blank)
 *  - At least two numeric-ish columns (numbers in ≥ 50% of cells)
 *  - Optionally a "Notes" / "Description" last column
 */
export function isComparisonTable(table: HTMLTableElement): boolean {
  const headers = getHeaderCells(table);
  if (headers.length < 3) return false;

  // Collect data rows
  const rows = getDataRows(table);
  if (rows.length < 2) return false;

  // Count how many columns look numeric
  let numericCols = 0;
  for (let col = 1; col < headers.length; col++) {
    const headerText = (headers[col].textContent ?? "").trim().toLowerCase();
    // Skip the notes column
    if (headerText === "notes" || headerText === "description") continue;

    const numericCells = rows.filter((row) => {
      const cells = row.querySelectorAll("td");
      const cell = cells[col];
      if (!cell) return false;
      const text = (cell.textContent ?? "").trim();
      return /^[\d,+\-%.×x]+$/.test(text) && text.length > 0;
    }).length;

    if (numericCells / rows.length >= 0.5) numericCols++;
  }

  return numericCols >= 2;
}

function getHeaderCells(table: HTMLTableElement): HTMLTableCellElement[] {
  const thead = table.querySelector("thead tr") ?? table.querySelector("tr:first-child");
  if (!thead) return [];
  return Array.from(thead.querySelectorAll("th, td"));
}

function getDataRows(table: HTMLTableElement): HTMLTableRowElement[] {
  const allRows = Array.from(table.querySelectorAll("tr"));
  // Skip the first row (headers) and any rows that are entirely <th>
  return allRows.slice(1).filter((row) => row.querySelector("td") !== null);
}

// ----- Parser -----

export function parseComparisonTable(table: HTMLTableElement): ComparisonTable {
  // Resolve image srcs before we read them
  normalizeImages(table);

  const caption = table.querySelector("caption")?.textContent?.trim();
  const headers = getHeaderCells(table);
  const allColumns = headers.map((th) => (th.textContent ?? "").trim());

  // Detect notes column
  const lastHeader = allColumns[allColumns.length - 1].toLowerCase();
  const hasNotesCol = lastHeader === "notes" || lastHeader === "description" || lastHeader === "note";

  // columns exposed to callers excludes the first (image) col AND the notes col
  const columns = hasNotesCol ? allColumns.slice(1, -1) : allColumns.slice(1);

  const rows: ComparisonRow[] = [];

  for (const row of getDataRows(table)) {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length === 0) continue;

    // First cell is the image cell; the name/link may be in the same cell or the next.
    const firstCell = cells[0];
    const imgEl = firstCell.querySelector("img");
    const image = imgEl?.getAttribute("src") ?? undefined;

    // Check if the second cell exists and looks like a name column (has text / link)
    const secondCell = cells[1];
    const nameCell =
      (firstCell.querySelector("a") || (firstCell.textContent ?? "").trim())
        ? firstCell
        : secondCell ?? firstCell;

    const linkEl = nameCell?.querySelector("a") ?? null;
    const link = linkEl?.getAttribute("href") ?? undefined;

    // Prefer link text, then the cell text, then alt text
    const name =
      (linkEl?.textContent ?? "").trim() ||
      (nameCell?.textContent ?? "").trim() ||
      imgEl?.getAttribute("alt") ||
      "";

    if (!name) continue;

    // Build stats from remaining columns.
    // allColumns[0] is the image col, allColumns[1..] are stat/name/notes cols.
    // cells[0] = image, cells[1] = name, cells[2..] = stats, cells[last] = notes (when hasNotesCol).
    const statEndIndex = hasNotesCol ? cells.length - 1 : cells.length;

    const stats: Record<string, string | number> = {};
    // Start at cells[1] to match allColumns[1]; columns[] = allColumns.slice(1, maybeDropNotes)
    for (let i = 1; i < statEndIndex; i++) {
      const header = allColumns[i]; // use allColumns not columns to keep index alignment
      if (!header) continue;
      const raw = (cells[i]?.textContent ?? "").trim();
      const num = parseFloat(raw.replace(/,/g, ""));
      stats[header] = isNaN(num) ? raw : num;
    }

    // Notes: last cell when notes column exists
    let notes = "";
    if (hasNotesCol && cells[cells.length - 1]) {
      const notesCell = cells[cells.length - 1].cloneNode(true) as HTMLTableCellElement;
      notesCell.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
      notes = notesCell.innerHTML.trim();
    }

    rows.push({ image, name, link, stats, notes });
  }

  return { caption, columns, rows };
}
