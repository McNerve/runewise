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

// Threshold: items with text longer than this are likely prose descriptions.
// Items with an icon are kept regardless of length (scraper could resolve them).
const MAX_REQUIREMENT_LENGTH = 80;

function normalizeText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[•◦▪▸►●○◆◇‣⁃\-–—]\s*/, "")
    .trim();
}

function parseDocument(html: string) {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

/** True when the item text looks like a scraper-fallback "Unknown N+" sentinel. */
function isUnknownSentinel(text: string): boolean {
  return /^unknown\s+\d+\+?$/i.test(text.trim());
}

function parseListItems(doc: Document, title: string): IconTextItem[] {
  const items = Array.from(doc.querySelectorAll("li, p"))
    .map((node) => ({
      icon: node.querySelector("img")?.getAttribute("src") ?? null,
      text: normalizeText(node.textContent ?? ""),
    }))
    .filter((item) => item.text.length > 0)
    .filter((item) => item.text.toLowerCase() !== title.trim().toLowerCase())
    // Drop "Unknown N+" sentinels — they come from failed skill extraction
    .filter((item) => !isUnknownSentinel(item.text))
    // Keep items that have an icon or are short enough to be actual requirements/skills.
    // Long prose without an icon is treated as a fallback description — rendered differently.
    .filter((item) => item.text.length <= MAX_REQUIREMENT_LENGTH || item.icon !== null);

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

function renderIcon(icon: string | null, text: string, size: "sm" | "md" = "md") {
  const sizeClass = size === "sm" ? "h-6 w-6 p-1" : "h-8 w-8 p-1.5";
  const fallbackSize = size === "sm" ? "h-6 w-6 text-[8px]" : "h-8 w-8 text-[9px]";
  return icon ? (
    <WikiImage
      src={icon}
      alt=""
      className={`${sizeClass} rounded-md bg-bg-primary/60 object-contain`}
      fallback={text[0]}
    />
  ) : (
    <span className={`flex ${fallbackSize} items-center justify-center rounded-md bg-bg-primary/60 font-semibold text-text-secondary`}>
      {text[0]}
    </span>
  );
}

function RawHtmlFallback({ html, kind }: { html: string; kind: string | null }) {
  const extraClass = kind === "loadout"
    ? "article-content--loadout"
    : kind === "requirements" || kind === "skills"
      ? "article-content--structured article-content--requirements"
      : "";
  return (
    <div
      className={`article-content text-sm leading-7 text-text-secondary ${extraClass}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function StructuredSection({ title, html }: StructuredSectionProps) {
  const kind = sectionKind(title);
  if (!kind) return null;

  const doc = parseDocument(html);

  if (kind === "requirements" || kind === "skills") {
    const items = parseListItems(doc, title);
    if (items.length === 0) return <RawHtmlFallback html={html} kind={kind} />;

    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-bg-primary/40 px-3 py-2"
          >
            {renderIcon(item.icon, item.text, "sm")}
            <div className="min-w-0 text-sm leading-5 text-text-primary">{item.text}</div>
          </div>
        ))}
      </div>
    );
  }

  const rows = parseLoadoutRows(doc);
  if (rows.length === 0) return <RawHtmlFallback html={html} kind="loadout" />;

  return (
    <div className="space-y-1">
      {rows.map((row, index) => (
        <div
          key={`${title}-row-${index}`}
          className="flex items-start gap-3 rounded-lg border border-border/40 bg-bg-primary/30 px-3 py-2.5"
        >
          {/* Slot label */}
          <div className="flex shrink-0 items-center gap-2 w-28">
            {renderIcon(row.slot.icon, row.slot.text, "sm")}
            <span className="text-xs font-medium text-text-secondary truncate">{row.slot.text}</span>
          </div>
          {/* Item options */}
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {row.options.map((option, optionIndex) => (
              <div
                key={`${title}-row-${index}-option-${optionIndex}`}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
                  optionIndex === 0
                    ? "border-accent/25 bg-accent/8"
                    : "border-border/40 bg-bg-secondary/40"
                }`}
              >
                {renderIcon(option.icon, option.text, "sm")}
                <span className="text-xs text-text-primary truncate max-w-[160px]">{option.text}</span>
                {optionIndex === 0 && (
                  <span className="text-[9px] uppercase tracking-wide text-accent/70 font-semibold">Best</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
