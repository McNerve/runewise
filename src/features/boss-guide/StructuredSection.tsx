import WikiImage from "../../components/WikiImage";

interface StructuredSectionProps {
  title: string;
  html: string;
}

interface IconTextItem {
  icon: string | null;
  text: string;
}

interface LoadoutRow {
  slot: IconTextItem;
  options: IconTextItem[];
}

const INVALID_LOADOUT_LABELS = [
  "n/a",
  "see ranged",
  "see melee",
  "see magic",
  "see mage",
  "see inventory",
  "see equipment",
  "ranged",
  "melee",
  "magic",
  "mage",
] as const;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseDocument(html: string) {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

function parseListItems(doc: Document, title: string): IconTextItem[] {
  const items = Array.from(doc.querySelectorAll("li, p"))
    .map((node) => ({
      icon: node.querySelector("img")?.getAttribute("src") ?? null,
      text: normalizeText(node.textContent ?? ""),
    }))
    .filter((item) => item.text.length > 0)
    .filter((item) => item.text.toLowerCase() !== title.trim().toLowerCase());

  return items;
}

function normalizeItemLabel(value: string) {
  return normalizeText(
    value
      .replace(/\s*[>•|]\s*/g, "\n")
      .replace(/\s+or\s+/gi, "\n")
      .replace(/\s+\/\s+/g, "\n")
  );
}

function extractSlotLabel(cell: HTMLTableCellElement): string {
  const image = cell.querySelector("img");
  const fromImage =
    image?.getAttribute("alt") ||
    image?.getAttribute("title") ||
    image?.closest("a")?.getAttribute("title") ||
    "";

  const fromText = normalizeText(cell.textContent ?? "");
  const raw = fromText || fromImage;
  const cleaned = raw
    .replace(/_+/g, " ")
    .replace(/\bslot\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Slot";
}

function extractItemsFromCell(cell: HTMLTableCellElement): IconTextItem[] {
  const linkedItems = Array.from(cell.querySelectorAll("a"))
    .map((link) => {
      const text = normalizeText(link.textContent ?? "");
      if (!text) return null;
      const image =
        link.querySelector("img")?.getAttribute("src") ??
        link.previousElementSibling?.tagName === "IMG"
          ? link.previousElementSibling?.getAttribute("src") ?? null
          : null;
      return { icon: image, text };
    })
    .filter((item): item is IconTextItem => item !== null);

  if (linkedItems.length > 0) {
    const seen = new Set<string>();
    return linkedItems.filter((item) => {
      const key = item.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const images = Array.from(cell.querySelectorAll("img")).map((img) => img.getAttribute("src"));
  const textParts = normalizeItemLabel(cell.textContent ?? "")
    .split("\n")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return textParts.map((text, index) => ({
    icon: images[index] ?? images[0] ?? null,
    text,
  }));
}

function isValidLoadoutItem(item: IconTextItem) {
  const normalized = item.text.trim().toLowerCase();
  if (!normalized) return false;
  return !INVALID_LOADOUT_LABELS.includes(normalized as (typeof INVALID_LOADOUT_LABELS)[number]);
}

function parseLoadoutRows(doc: Document): LoadoutRow[] {
  const rows = Array.from(doc.querySelectorAll("table tr")).slice(1);

  return rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 2) return null;

      const slotCell = cells[0];
      const slot: IconTextItem = {
        icon: slotCell.querySelector("img")?.getAttribute("src") ?? null,
        text: extractSlotLabel(slotCell),
      };

      const options = cells
        .slice(1)
        .flatMap((cell) => extractItemsFromCell(cell as HTMLTableCellElement))
        .filter(isValidLoadoutItem);

      if (options.length === 0) return null;
      return { slot, options };
    })
    .filter((row): row is LoadoutRow => row !== null);
}

function sectionKind(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("requirements")) return "requirements";
  if (lower.includes("recommended skills") || lower.includes("suggested skills")) return "skills";
  if (lower.includes("equipment") || lower.includes("inventory")) return "loadout";
  return null;
}

function renderIcon(icon: string | null, text: string) {
  return icon ? (
    <WikiImage
      src={icon}
      alt=""
      className="h-9 w-9 rounded-full bg-bg-primary/60 p-1.5 object-contain"
      fallback={text[0]}
    />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-primary/60 text-xs font-semibold text-text-secondary">
      {text[0]}
    </span>
  );
}

export default function StructuredSection({ title, html }: StructuredSectionProps) {
  const kind = sectionKind(title);
  if (!kind) return null;

  const doc = parseDocument(html);

  if (kind === "requirements" || kind === "skills") {
    const items = parseListItems(doc, title);
    if (items.length === 0) return null;

    return (
      <div className="grid gap-2.5 xl:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex items-center gap-3 rounded-2xl border border-border/70 bg-bg-primary/40 px-3.5 py-3"
          >
            {renderIcon(item.icon, item.text)}
            <div className="min-w-0 text-sm leading-6 text-text-primary">{item.text}</div>
          </div>
        ))}
      </div>
    );
  }

  const rows = parseLoadoutRows(doc);
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={`${title}-row-${index}`}
          className="rounded-2xl border border-border/70 bg-bg-primary/38 p-3.5"
        >
          <div className="grid gap-3 xl:grid-cols-[170px_minmax(0,1fr)] xl:items-start">
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-bg-secondary/55 px-3 py-2.5">
              {renderIcon(row.slot.icon, row.slot.text)}
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-text-secondary/52">Slot</div>
                <div className="truncate text-sm font-semibold text-text-primary">{row.slot.text}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {row.options.map((option, optionIndex) => (
                <div
                  key={`${title}-row-${index}-option-${optionIndex}`}
                  className={`flex min-w-[190px] max-w-full items-center gap-2.5 rounded-xl border px-3 py-2 ${
                    optionIndex === 0
                      ? "border-accent/25 bg-accent/8"
                      : "border-border/65 bg-bg-secondary/62"
                  }`}
                >
                  {renderIcon(option.icon, option.text)}
                  <div className="min-w-0">
                    <div className="truncate text-sm leading-5 text-text-primary">{option.text}</div>
                    {optionIndex === 0 ? (
                      <div className="text-[10px] uppercase tracking-[0.16em] text-accent/80">Best</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
