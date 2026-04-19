import { useState, useEffect } from "react";
import WikiImage from "../../components/WikiImage";
import {
  parseEquipmentCellEntries,
  parseSuggestedSkill,
  type EquipmentEntry,
  type SuggestedSkill,
} from "../../lib/wiki/bossGuide";

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

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// Skills parsing
// -----------------------------------------------------------------------

/**
 * Parse all skill items from the section HTML.
 * Items that successfully parse become SuggestedSkill; others fall back
 * to raw text so we can still render them.
 */
function parseSkillItems(
  doc: Document,
  title: string
): Array<(SuggestedSkill & { icon?: string | null }) | { fallback: string; icon: string | null }> {
  return Array.from(doc.querySelectorAll("li, p"))
    .map((node) => {
      const text = normalizeText(node.textContent ?? "");
      const icon = node.querySelector("img")?.getAttribute("src") ?? null;
      if (!text || text.toLowerCase() === title.trim().toLowerCase()) return null;
      const parsed = parseSuggestedSkill(text);
      if (parsed) return { ...parsed, icon };
      // Keep items with icons (skill icons) even if parsing fails
      if (icon || text.length <= 80) return { fallback: text, icon };
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

// -----------------------------------------------------------------------
// Equipment (loadout) parsing
// -----------------------------------------------------------------------

function parseLoadoutRowsWithEntries(
  doc: Document
): Array<{ slot: IconTextItem; entries: EquipmentEntry[] }> {
  const rows = Array.from(doc.querySelectorAll("table tr")).slice(1);

  return rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 2) return null;

      const slotCell = cells[0] as HTMLTableCellElement;
      const slot: IconTextItem = {
        icon: slotCell.querySelector("img")?.getAttribute("src") ?? null,
        text: extractSlotLabel(slotCell),
      };

      const entries = cells
        .slice(1)
        .flatMap((cell) => parseEquipmentCellEntries(cell));

      const validEntries = entries.filter(
        (e) => e.type === "see-section" || (e.type === "item" && e.name.trim().length > 0)
      );

      if (validEntries.length === 0) return null;
      return { slot, entries: validEntries };
    })
    .filter(
      (row): row is { slot: IconTextItem; entries: EquipmentEntry[] } =>
        row !== null
    );
}

// Legacy loadout rows (for fallback)
function normalizeItemLabel(value: string) {
  return normalizeText(
    value
      .replace(/\s*[>•|]\s*/g, "\n")
      .replace(/\s+or\s+/gi, "\n")
      .replace(/\s+\/\s+/g, "\n")
  );
}

function extractItemsFromCell(cell: HTMLTableCellElement): IconTextItem[] {
  const linkedItems = Array.from(cell.querySelectorAll("a"))
    .map((link) => {
      const text = normalizeText(link.textContent ?? "");
      if (!text) return null;
      const image =
        link.querySelector("img")?.getAttribute("src") ??
        (link.previousElementSibling?.tagName === "IMG"
          ? link.previousElementSibling?.getAttribute("src") ?? null
          : null);
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

  const images = Array.from(cell.querySelectorAll("img")).map((img) =>
    img.getAttribute("src")
  );
  const textParts = normalizeItemLabel(cell.textContent ?? "")
    .split("\n")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return textParts.map((text, index) => ({
    icon: images[index] ?? images[0] ?? null,
    text,
  }));
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

function isValidLoadoutItem(item: IconTextItem) {
  const normalized = item.text.trim().toLowerCase();
  if (!normalized) return false;
  return !INVALID_LOADOUT_LABELS.includes(
    normalized as (typeof INVALID_LOADOUT_LABELS)[number]
  );
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
        text: extractSlotLabel(slotCell as HTMLTableCellElement),
      };

      const options = cells
        .slice(1)
        .flatMap((cell) =>
          extractItemsFromCell(cell as HTMLTableCellElement)
        )
        .filter(isValidLoadoutItem);

      if (options.length === 0) return null;
      return { slot, options };
    })
    .filter((row): row is LoadoutRow => row !== null);
}

// -----------------------------------------------------------------------
// Section kind
// -----------------------------------------------------------------------

function sectionKind(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("requirements")) return "requirements";
  if (lower.includes("recommended skills") || lower.includes("suggested skills"))
    return "skills";
  if (lower.includes("equipment") || lower.includes("inventory"))
    return "loadout";
  return null;
}

// -----------------------------------------------------------------------
// Render helpers
// -----------------------------------------------------------------------

function renderIcon(icon: string | null, text: string, size: "sm" | "md" = "md") {
  const sizeClass = size === "sm" ? "h-6 w-6 p-1" : "h-8 w-8 p-1.5";
  const fallbackSize =
    size === "sm" ? "h-6 w-6 text-[8px]" : "h-8 w-8 text-[9px]";
  return icon ? (
    <WikiImage
      src={icon}
      alt=""
      className={`${sizeClass} rounded-md bg-bg-primary/60 object-contain`}
      fallback={text[0]}
    />
  ) : (
    <span
      className={`flex ${fallbackSize} items-center justify-center rounded-md bg-bg-primary/60 font-semibold text-text-secondary`}
    >
      {text[0]}
    </span>
  );
}

function RawHtmlFallback({
  html,
  kind,
}: {
  html: string;
  kind: string | null;
}) {
  const extraClass =
    kind === "loadout"
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

// -----------------------------------------------------------------------
// Skills tile renderer
// -----------------------------------------------------------------------

function SkillTile({
  item,
}: {
  item: (SuggestedSkill & { icon?: string | null }) | { fallback: string; icon: string | null };
}) {
  if ("fallback" in item) {
    return (
      <div
        title={item.fallback}
        className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-bg-primary/40 px-3 py-2"
      >
        {renderIcon(item.icon, item.fallback[0] ?? "?", "sm")}
        <div className="min-w-0 text-sm leading-snug text-text-primary whitespace-normal break-words">
          {item.fallback}
        </div>
      </div>
    );
  }

  const s = item;
  const isUnknownSkill = !s.skill || s.skill.toLowerCase() === "unknown";
  const primaryText = isUnknownSkill ? `Level ${s.level}+` : `${s.skill} ${s.level}+`;
  const tooltip = s.description ?? undefined;

  return (
    <div
      title={tooltip}
      className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-bg-primary/40 px-3 py-2"
    >
      {s.icon ? (
        <WikiImage
          src={s.icon}
          alt={s.skill || ""}
          className="h-6 w-6 shrink-0 rounded-md bg-bg-primary/60 object-contain p-0.5"
          fallback={String(s.level)}
        />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-bg-primary/60 text-[9px] font-semibold text-accent">
          {s.level}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-medium leading-5 text-text-primary">
          <span>{primaryText}</span>
          {s.boostAllowed && (
            <span className="text-[10px] font-normal text-accent/70">(boostable)</span>
          )}
          {s.optional && (
            <span className="text-[10px] font-normal text-text-secondary/60">(optional)</span>
          )}
        </div>
        {s.qualifier && (
          <div className="mt-0.5 text-xs text-text-secondary truncate" title={s.qualifier}>
            {s.qualifier}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Equipment pill renderer
// -----------------------------------------------------------------------

function EquipmentPill({
  entry,
  index,
  onScrollTo,
}: {
  entry: EquipmentEntry;
  index: number;
  onScrollTo?: (id: string) => void;
}) {
  if (entry.type === "see-section") {
    const targetId = entry.targetSectionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return (
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          else onScrollTo?.(targetId);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-2 py-1 text-xs text-accent hover:bg-accent/15 transition"
      >
        See {entry.targetSectionTitle} section ↑
      </button>
    );
  }

  const isBest = index === 0;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
        isBest
          ? "border-accent/25 bg-accent/8"
          : "border-border/40 bg-bg-secondary/40"
      }`}
    >
      {entry.imageUrl && (
        <WikiImage
          src={entry.imageUrl}
          alt=""
          className="h-6 w-6 p-0.5 rounded-md bg-bg-primary/60 object-contain"
          fallback={entry.name[0]}
        />
      )}
      <span className="text-xs text-text-primary truncate max-w-[160px]">
        {entry.name}
      </span>
      {isBest && (
        <span className="text-[9px] uppercase tracking-wide text-accent/70 font-semibold">
          Best
        </span>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------

export default function StructuredSection({
  title,
  html,
  bossSlug,
}: StructuredSectionProps) {
  const kind = sectionKind(title);
  if (!kind) return null;

  const doc = parseDocument(html);

  // --- Skills ---
  if (kind === "skills" || kind === "requirements") {
    const items = parseSkillItems(doc, title);
    if (items.length === 0) return <RawHtmlFallback html={html} kind={kind} />;

    // Inline chips when <=2 items, grid otherwise
    const layoutClass = items.length <= 2
      ? "flex flex-wrap gap-2"
      : "grid gap-2 sm:grid-cols-2 xl:grid-cols-3";

    return (
      <div className={layoutClass}>
        {items.map((item, index) => (
          <SkillTile key={`${title}-${index}`} item={item} />
        ))}
      </div>
    );
  }

  return <LoadoutTable title={title} html={html} doc={doc} bossSlug={bossSlug} />;
}

function LoadoutTable({ title, html, doc, bossSlug }: { title: string; html: string; doc: Document; bossSlug?: string }) {
  const entryRows = parseLoadoutRowsWithEntries(doc);
  const legacyRows = entryRows.length === 0 ? parseLoadoutRows(doc) : [];
  const hasData = entryRows.length > 0 || legacyRows.length > 0;

  const [owned, setOwned] = useState<Record<string, boolean>>(() => {
    if (!bossSlug) return {};
    return loadGearOwned()[bossSlug] ?? {};
  });

  useEffect(() => {
    if (!bossSlug) return;
    const all = loadGearOwned();
    all[bossSlug] = owned;
    saveGearOwned(all);
  }, [owned, bossSlug]);

  if (!hasData) return <RawHtmlFallback html={html} kind="loadout" />;

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

      {/* Preferred: structured entry rows with see-section + split pills */}
      {entryRows.map((row, index) => {
        const slotLabel = titleCaseSlot(row.slot.text);
        const slotKey = slotLabel.toLowerCase().replace(/\s+/g, "-");
        return (
          <div
            key={`${title}-entry-row-${index}`}
            className="flex items-start gap-3 rounded-lg border border-border/40 bg-bg-primary/30 px-3 py-2.5"
          >
            <div className="flex shrink-0 items-start gap-2 w-32">
              {renderIcon(row.slot.icon, row.slot.text, "sm")}
              <span className="text-xs font-medium text-text-secondary leading-tight break-words whitespace-normal">
                {slotLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
              {row.entries.map((entry, entryIndex) => (
                <EquipmentPill
                  key={`${title}-entry-row-${index}-entry-${entryIndex}`}
                  entry={entry}
                  index={entryIndex}
                />
              ))}
            </div>
            <div className="flex w-8 shrink-0 items-center justify-center pt-0.5">
              <input
                type="checkbox"
                checked={owned[slotKey] ?? false}
                onChange={() => toggleOwned(slotKey)}
                aria-label={`Mark ${slotLabel} item as owned`}
                title="Track items you own"
                className="h-4 w-4 cursor-pointer appearance-none rounded border border-border/60 bg-bg-tertiary checked:border-accent checked:bg-accent checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M3.5%208.5l3%203%206-6%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%222.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat hover:border-accent/60 transition-colors"
              />
            </div>
          </div>
        );
      })}

      {/* Fallback: legacy parser rows */}
      {legacyRows.map((row, index) => {
        const slotLabel = titleCaseSlot(row.slot.text);
        const slotKey = slotLabel.toLowerCase().replace(/\s+/g, "-");
        return (
          <div
            key={`${title}-legacy-row-${index}`}
            className="flex items-start gap-3 rounded-lg border border-border/40 bg-bg-primary/30 px-3 py-2.5"
          >
            <div className="flex shrink-0 items-start gap-2 w-32">
              {renderIcon(row.slot.icon, row.slot.text, "sm")}
              <span className="text-xs font-medium text-text-secondary leading-tight break-words whitespace-normal">
                {slotLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
              {row.options.map((option, optionIndex) => (
                <div
                  key={`${title}-legacy-row-${index}-option-${optionIndex}`}
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
            <div className="flex w-8 shrink-0 items-center justify-center pt-0.5">
              <input
                type="checkbox"
                checked={owned[slotKey] ?? false}
                onChange={() => toggleOwned(slotKey)}
                aria-label={`Mark ${slotLabel} item as owned`}
                title="Track items you own"
                className="h-4 w-4 cursor-pointer appearance-none rounded border border-border/60 bg-bg-tertiary checked:border-accent checked:bg-accent checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20viewBox%3D%220%200%2016%2016%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M3.5%208.5l3%203%206-6%22%20stroke%3D%22%231a1a1a%22%20stroke-width%3D%222.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat hover:border-accent/60 transition-colors"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
