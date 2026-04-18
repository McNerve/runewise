import WikiImage from "../../components/WikiImage";
import {
  parseLoadoutRowsWithEntries,
  parseSuggestedSkillItems,
  normalizeText,
  isSuggestedSkillFallback,
  type LoadoutRow,
  type SuggestedSkillResult,
} from "../../lib/wiki/scraper";

interface StructuredSectionProps {
  title: string;
  html: string;
}

interface IconTextItem {
  icon: string | null;
  text: string;
}

// MAX_REQUIREMENT_LENGTH: items longer than this without an icon are likely descriptions
const MAX_REQUIREMENT_LENGTH = 80;

function parseDocument(html: string) {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

function parseListItems(doc: Document, title: string): IconTextItem[] {
  return Array.from(doc.querySelectorAll("li, p"))
    .map((node) => ({
      icon: node.querySelector("img")?.getAttribute("src") ?? null,
      text: normalizeText(node.textContent ?? ""),
    }))
    .filter((item) => item.text.length > 0)
    .filter((item) => item.text.toLowerCase() !== title.trim().toLowerCase())
    .filter((item) => item.text.length <= MAX_REQUIREMENT_LENGTH || item.icon !== null);
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

function SkillTile({ result, index, titleKey }: { result: SuggestedSkillResult; index: number; titleKey: string }) {
  if (isSuggestedSkillFallback(result)) {
    return (
      <div
        key={`${titleKey}-${index}`}
        className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-bg-primary/40 px-3 py-2"
      >
        {result.icon ? renderIcon(result.icon, result.fallback, "sm") : (
          <span className="flex h-6 w-6 text-[8px] items-center justify-center rounded-md bg-bg-primary/60 font-semibold text-text-secondary">
            ?
          </span>
        )}
        <div className="min-w-0 text-sm leading-5 text-text-primary">{result.fallback}</div>
      </div>
    );
  }

  return (
    <div
      key={`${titleKey}-${index}`}
      className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-bg-primary/40 px-3 py-2"
    >
      <span className="flex h-6 w-6 text-[8px] items-center justify-center rounded-md bg-bg-primary/60 font-semibold text-text-secondary">
        {result.skill[0]}
      </span>
      <div className="min-w-0 text-sm leading-5 text-text-primary">
        <span className="font-medium">{result.skill}</span>
        {result.level !== null && (
          <span className="ml-1 text-text-secondary">{result.level}+</span>
        )}
      </div>
    </div>
  );
}

function LoadoutSection({ title, rows }: { title: string; rows: LoadoutRow[] }) {
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
                  option.type === "see-section"
                    ? "border-accent/40 bg-accent/12 cursor-pointer"
                    : optionIndex === 0
                      ? "border-accent/25 bg-accent/8"
                      : "border-border/40 bg-bg-secondary/40"
                }`}
              >
                {renderIcon(option.icon, option.text, "sm")}
                <span className="text-xs text-text-primary truncate max-w-[160px]">{option.text}</span>
                {option.type !== "see-section" && optionIndex === 0 && (
                  <span className="text-[9px] uppercase tracking-wide text-accent/70 font-semibold">Best</span>
                )}
                {option.type === "see-section" && (
                  <span className="text-[9px] uppercase tracking-wide text-accent/70 font-semibold">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StructuredSection({ title, html }: StructuredSectionProps) {
  const kind = sectionKind(title);
  if (!kind) return null;

  const doc = parseDocument(html);

  if (kind === "requirements") {
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

  if (kind === "skills") {
    const results = parseSuggestedSkillItems(doc, title);
    if (results.length === 0) return <RawHtmlFallback html={html} kind={kind} />;

    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((result, index) => (
          <SkillTile key={`${title}-skill-${index}`} result={result} index={index} titleKey={title} />
        ))}
      </div>
    );
  }

  // loadout
  const rows = parseLoadoutRowsWithEntries(doc);
  if (rows.length === 0) return <RawHtmlFallback html={html} kind="loadout" />;

  return <LoadoutSection title={title} rows={rows} />;
}
