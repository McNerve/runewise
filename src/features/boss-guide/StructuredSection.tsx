import { useState, useEffect } from "react";
import WikiImage from "../../components/WikiImage";

interface StructuredSectionProps {
  title: string;
  html: string;
  bossSlug?: string;
}

interface IconTextItem {
  icon: string | null;
  text: string;
}

interface LoadoutRow {
  slot: IconTextItem;
  options: IconTextItem[];
}

const GEAR_OWNED_KEY = "runewise_boss_gear_owned";

function loadGearOwned(): Record<string, Record<string, boolean>> {
  try {
    return JSON.parse(localStorage.getItem(GEAR_OWNED_KEY) ?? "{}") as Record<string, Record<string, boolean>>;
  } catch {
    return {};
  }
}

function saveGearOwned(data: Record<string, Record<string, boolean>>) {
  try {
    localStorage.setItem(GEAR_OWNED_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Normalize a slot label to Title Case
function titleCaseSlot(raw: string): string {
  if (!raw) return "Slot";
  const cleaned = raw
    .replace(/\bweapon\b/gi, "weapon")
    .replace(/\battack\b/gi, "attack")
    .replace(/\bone[\s-]handed\b/gi, "One-handed weapon")
    .replace(/\btwo[\s-]handed\b/gi, "Two-handed weapon");
  return cleaned
    .split(" ")
    .map((word) => {
      if (!word) return "";
      // preserve hyphenated words like "One-handed"
      if (word.includes("-")) {
        return word.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
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

// Threshold: items with text longer than this are likely descriptions, not requirements
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

function parseListItems(doc: Document, title: string): IconTextItem[] {
  const items = Array.from(doc.querySelectorAll("li, p"))
    .map((node) => ({
      icon: node.querySelector("img")?.getAttribute("src") ?? null,
      text: normalizeText(node.textContent ?? ""),
    }))
    .filter((item) => item.text.length > 0)
    .filter((item) => item.text.toLowerCase() !== title.trim().toLowerCase())
    // Filter out long description paragraphs — keep only actual requirements/skills
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

export default function StructuredSection({ title, html, bossSlug }: StructuredSectionProps) {
  const kind = sectionKind(title);
  if (!kind) return null;

  const doc = parseDocument(html);

  if (kind === "requirements" || kind === "skills") {
    const items = parseListItems(doc, title);
    if (items.length === 0) return <RawHtmlFallback html={html} kind={kind} />;

    // Inline chips when <=2 items, grid otherwise
    const layoutClass = items.length <= 2
      ? "flex flex-wrap gap-2"
      : "grid gap-2 sm:grid-cols-2 xl:grid-cols-3";

    return (
      <div className={layoutClass}>
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

  return <LoadoutTable title={title} html={html} doc={doc} bossSlug={bossSlug} />;
}

function LoadoutTable({ title, html, doc, bossSlug }: { title: string; html: string; doc: Document; bossSlug?: string }) {
  const rows = parseLoadoutRows(doc);

  const [owned, setOwned] = useState<Record<string, boolean>>(() => {
    if (!bossSlug) return {};
    return loadGearOwned()[bossSlug] ?? {};
  });

  // Persist on change
  useEffect(() => {
    if (!bossSlug) return;
    const all = loadGearOwned();
    all[bossSlug] = owned;
    saveGearOwned(all);
  }, [owned, bossSlug]);

  if (rows.length === 0) return <RawHtmlFallback html={html} kind="loadout" />;

  const toggleOwned = (slotKey: string) => {
    setOwned((prev) => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  return (
    <div className="space-y-1">
      {/* Column header row */}
      <div className="flex items-center gap-3 px-3 pb-1">
        <div className="w-32 shrink-0" />
        <div className="flex-1 text-[10px] uppercase tracking-[0.16em] text-text-secondary/40">
          Recommended items
        </div>
        <div className="w-8 shrink-0 text-center text-[10px] uppercase tracking-[0.16em] text-text-secondary/40">
          Own
        </div>
      </div>
      {rows.map((row, index) => {
        const slotLabel = titleCaseSlot(row.slot.text);
        const slotKey = slotLabel.toLowerCase().replace(/\s+/g, "-");
        return (
          <div
            key={`${title}-row-${index}`}
            className="flex items-start gap-3 rounded-lg border border-border/40 bg-bg-primary/30 px-3 py-2.5"
          >
            {/* Slot label — allow 2-line wrap, min-width to avoid truncation */}
            <div className="flex shrink-0 items-start gap-2 w-32">
              {renderIcon(row.slot.icon, row.slot.text, "sm")}
              <span className="text-xs font-medium text-text-secondary leading-tight break-words whitespace-normal">{slotLabel}</span>
            </div>
            {/* Item options */}
            <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
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
            {/* Ownership checkbox */}
            <div className="flex w-8 shrink-0 items-center justify-center pt-0.5">
              <input
                type="checkbox"
                checked={owned[slotKey] ?? false}
                onChange={() => toggleOwned(slotKey)}
                aria-label={`Mark ${slotLabel} item as owned`}
                title="Track items you own"
                className="h-4 w-4 cursor-pointer accent-accent"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
