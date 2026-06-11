import { useEffect, useState } from "react";
import type { TocEntry } from "../wikiLookupUtils";

interface WikiTocProps {
  entries: TocEntry[];
  /** Element that contains the rendered sections — observed for scrollspy. */
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export default function WikiToc({ entries, contentRef }: WikiTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || entries.length === 0) return;

    const targets = entries
      .map((entry) => root.querySelector<HTMLElement>(`#${CSS.escape(entry.id)}`))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // Track which headings sit above the reading line; the last one wins.
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (intersections) => {
        for (const entry of intersections) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        for (const tocEntry of entries) {
          if (visible.has(tocEntry.id)) {
            setActiveId(tocEntry.id);
            return;
          }
        }
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries, contentRef]);

  if (entries.length < 2) return null;

  const jump = (id: string) => {
    contentRef.current
      ?.querySelector(`#${CSS.escape(id)}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <nav aria-label="On this page">
      <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
        On This Page
      </div>
      <ul className="mt-3 space-y-0.5 border-l border-border/50">
        {entries.map((entry) => {
          const active = activeId === entry.id;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => jump(entry.id)}
                className={`block w-full truncate border-l-2 py-1 text-left text-xs transition ${
                  entry.level === 3 ? "pl-6" : "pl-3"
                } ${
                  active
                    ? "-ml-px border-accent text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
                title={entry.text}
              >
                {entry.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
