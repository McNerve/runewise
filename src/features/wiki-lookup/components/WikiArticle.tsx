import type { ReactNode } from "react";
import type { WikiLookupDocument } from "../../../lib/wiki/lookup";
import SourceAttribution from "../../../components/SourceAttribution";
import WikiSectionContent from "./WikiSectionContent";
import WikiToc from "./WikiToc";
import WikiInfobox from "./WikiInfobox";
import { extractTocEntries, sectionContentClasses, shouldCollapseSection } from "../wikiLookupUtils";
import type { GESnapshot } from "../wikiLookupGe";

interface WikiArticleProps {
  document: WikiLookupDocument;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onContentClick: React.MouseEventHandler<HTMLElement>;
  geSnapshot?: GESnapshot | null;
  pageUrl?: string | null;
  readProgress?: number;
  /** Extra actions next to the title (Open in Market, Open Guide, …). */
  actions?: ReactNode;
  /** When set, replaces a section's raw HTML (e.g. structured gear tables). */
  enhanceSection?: (title: string, html: string) => ReactNode | null;
  /** Embedded in Boss Guides — skip the giant page chrome. */
  variant?: "page" | "embedded";
  related?: ReactNode;
}

export default function WikiArticle({
  document,
  contentRef,
  onContentClick,
  geSnapshot = null,
  pageUrl = null,
  readProgress = 0,
  actions,
  enhanceSection,
  variant = "page",
  related,
}: WikiArticleProps) {
  const tocEntries = extractTocEntries(document.sections);
  const embedded = variant === "embedded";

  return (
    <div
      ref={contentRef}
      className={`relative min-w-0 overflow-hidden ${
        embedded
          ? ""
          : "rounded-xl border border-border/40 bg-bg-primary/25 p-4 sm:p-5"
      }`}
    >
      {!embedded ? (
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-0.5 bg-accent/80 transition-[width] duration-150"
          style={{ width: `${readProgress}%` }}
          aria-hidden
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] min-w-0">
        <section className="min-w-0 space-y-4 overflow-hidden">
          <div className="space-y-2">
            {!embedded ? (
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
                <span>OSRS Wiki</span>
                {readProgress > 5 ? (
                  <span className="normal-case tracking-normal text-text-secondary/35">
                    · {readProgress}% read
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                {!embedded ? (
                  <h3 className="wiki-article-title text-3xl font-semibold tracking-tight">
                    {document.title.includes("/")
                      ? document.title.replace(/\//g, " · ")
                      : document.title}
                  </h3>
                ) : null}
                {document.hatnotes.map((html, i) => (
                  <div
                    key={i}
                    className="wiki-hatnote article-content"
                    onClick={onContentClick}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))}
                {document.summary && !embedded ? (
                  <p className="max-w-3xl text-sm leading-6 text-text-secondary">
                    {document.summary}
                  </p>
                ) : null}
                {related}
                {!embedded ? (
                  <SourceAttribution
                    source="OSRS Wiki"
                    fetchedAt={document.fetchedAt}
                    cacheLabel="1 hour"
                  />
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
          </div>

          {tocEntries.length >= 2 ? (
            <div className="xl:hidden -mx-1 overflow-x-auto sidebar-scroll sticky top-0 z-10 bg-bg-primary/95 backdrop-blur-sm py-1.5 border-b border-border/30">
              <div className="flex min-w-max gap-1.5 px-1">
                {tocEntries
                  .filter((e) => e.level === 2)
                  .slice(0, 16)
                  .map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() =>
                        contentRef.current
                          ?.querySelector(`#${CSS.escape(entry.id)}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                      className="shrink-0 rounded-full border border-border/60 bg-bg-secondary/50 px-3 py-1 text-xs text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                    >
                      {entry.text}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}

          {document.leadHtml ? (
            <section>
              <div
                className="article-content"
                onClick={onContentClick}
                dangerouslySetInnerHTML={{ __html: document.leadHtml }}
              />
            </section>
          ) : null}

          {document.sections.map((section) => {
            const extra = sectionContentClasses(section.title);
            const collapsed = shouldCollapseSection(section.title);
            const enhanced = enhanceSection?.(section.title, section.html) ?? null;
            const body = enhanced ?? (
              <WikiSectionContent
                html={section.html}
                className={`article-content${extra ? ` ${extra}` : ""}`}
                onClick={onContentClick}
              />
            );
            return collapsed ? (
              <details key={section.id} id={section.id} className="article-content-collapse scroll-mt-4">
                <summary className="wiki-section-heading mb-4 cursor-pointer text-text-primary hover:text-accent transition-colors">
                  {section.title}
                </summary>
                {body}
              </details>
            ) : (
              <section key={section.id} id={section.id} className="scroll-mt-4">
                <h4 className="wiki-section-heading mb-4">{section.title}</h4>
                {body}
              </section>
            );
          })}
        </section>

        <aside className="space-y-6">
          {document.infoboxHtml || document.infoboxFields.length > 0 || geSnapshot ? (
            <WikiInfobox
              title={document.infoboxTitle ?? document.title}
              image={document.infoboxImage}
              html={document.infoboxHtml}
              fields={document.infoboxFields}
              totalFields={document.totalInfoboxFields}
              geSnapshot={geSnapshot}
              pageUrl={pageUrl}
              onContentClick={onContentClick}
            />
          ) : null}
          <div className="xl:sticky xl:top-4">
            <WikiToc entries={tocEntries} contentRef={contentRef} />
          </div>
        </aside>
      </div>
    </div>
  );
}
