/**
 * Renders a wiki section's HTML.  Wikitables that match the comparison-table
 * signature are lifted out and rendered as <ComparisonTable>; everything else
 * stays as injected HTML.
 */
import { useMemo } from "react";
import { isComparisonTable, parseComparisonTable } from "../../../lib/wiki/tables";
import ComparisonTable from "./ComparisonTable";

interface WikiSectionContentProps {
  html: string;
  className?: string;
  onLinkClick?: (href: string) => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

interface ParsedBlock {
  type: "html" | "comparison";
  html?: string;
  tableIndex?: number;
}

/**
 * Splits the section HTML into a list of blocks — regular HTML fragments and
 * extracted comparison-table nodes.
 */
function splitBlocks(html: string): {
  blocks: ParsedBlock[];
  tables: HTMLTableElement[];
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  const tables: HTMLTableElement[] = [];
  const blocks: ParsedBlock[] = [];

  const children = Array.from(body.childNodes);
  let htmlBuffer = "";

  for (const node of children) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === "TABLE" &&
      (node as HTMLTableElement).classList.contains("wikitable") &&
      isComparisonTable(node as HTMLTableElement)
    ) {
      // Flush pending HTML
      if (htmlBuffer.trim()) {
        blocks.push({ type: "html", html: htmlBuffer });
        htmlBuffer = "";
      }
      const tableIdx = tables.length;
      tables.push((node as HTMLTableElement).cloneNode(true) as HTMLTableElement);
      blocks.push({ type: "comparison", tableIndex: tableIdx });
    } else {
      htmlBuffer += (node as Element).outerHTML ?? (node as Text).textContent ?? "";
    }
  }

  if (htmlBuffer.trim()) {
    blocks.push({ type: "html", html: htmlBuffer });
  }

  return { blocks, tables };
}

export default function WikiSectionContent({
  html,
  className = "article-content",
  onLinkClick,
  onClick,
}: WikiSectionContentProps) {
  const { blocks, tables } = useMemo(() => splitBlocks(html), [html]);

  // If no comparison tables were found, render as a single block
  if (!blocks.some((b) => b.type === "comparison")) {
    return (
      <div
        className={className}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={`${className} space-y-4`} onClick={onClick}>
      {blocks.map((block, idx) => {
        if (block.type === "comparison" && block.tableIndex !== undefined) {
          const tableEl = tables[block.tableIndex];
          const data = parseComparisonTable(tableEl);
          if (data.rows.length === 0) {
            // Fallback: inject raw table
            return (
              <div
                key={idx}
                dangerouslySetInnerHTML={{ __html: tableEl.outerHTML }}
              />
            );
          }
          return (
            <ComparisonTable
              key={idx}
              data={data}
              onLinkClick={onLinkClick}
            />
          );
        }

        if (block.html) {
          return (
            <div
              key={idx}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
