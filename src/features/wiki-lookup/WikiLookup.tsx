import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import {
  classifyWikiPage,
  fetchWikiLookupDocument,
  resolveWikiPageFromHref,
  searchWikiPages,
  type WikiEntityKind,
  type WikiLookupDocument,
} from "../../lib/wiki/lookup";
import SourceAttribution from "../../components/SourceAttribution";
import { Skeleton } from "../../components/Skeleton";
import { useNavigation } from "../../lib/NavigationContext";
import { loadRecentEntities } from "../../lib/recentEntities";
import {
  initWikiInteractive,
  handleLightboxClick,
} from "../../lib/wiki/interactive";
import WikiSectionContent from "./components/WikiSectionContent";
import RequirementsSection from "./components/RequirementsSection";

const COLLAPSED_SECTIONS = [
  "used in recommended equipment",
  "item sources",
  "products",
  "gallery",
  "drop sources",
  "spawns",
  "combat stats",
  "changes",
];

function shouldCollapse(title: string): boolean {
  const lower = title.toLowerCase();
  return COLLAPSED_SECTIONS.some((s) => lower.includes(s));
}

function sectionExtraClasses(title: string): string {
  const lower = title.toLowerCase();
  if (
    lower.includes("suggested skills") ||
    lower.includes("recommended skills") ||
    lower.includes("requirements")
  ) {
    return "article-content--structured article-content--requirements";
  }
  if (
    lower.includes("equipment") ||
    lower.includes("inventory") ||
    lower.includes("gear")
  ) {
    return "article-content--structured article-content--loadout article-content--loadout-table";
  }
  return "";
}

export default function WikiLookup() {
  const { params, navigate } = useNavigation();
  const [query, setQuery] = useState(params.query ?? "");
  const debouncedQuery = useDebounce(query, 180);
  const [results, setResults] = useState<string[]>([]);
  const [resultsQuery, setResultsQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(params.page ?? "");
  const [document, setDocument] = useState<WikiLookupDocument | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(Boolean(params.page));
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const breadcrumbPages = useMemo(() => {
    const rawTrail = params.trail?.split("|").filter(Boolean) ?? [];
    return rawTrail.slice(-5);
  }, [params.trail]);

  const recentWikiPages = useMemo(
    () => loadRecentEntities().filter((e) => e.category === "Wiki").slice(0, 5),
    // Refresh whenever a page opens so recents stay in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPage]
  );

  function navigateToTypedPage(page: string, kind: WikiEntityKind) {
    if (kind === "item") {
      navigate("market", { query: page });
      return;
    }

    if (kind === "boss") {
      navigate("bosses", { boss: page });
      return;
    }

    if (kind === "quest") {
      navigate("progress", { quest: page, tab: "quests" });
      return;
    }

    openPage(page);
  }

  async function routeWikiPage(page: string) {
    const kind = await classifyWikiPage(page);
    navigateToTypedPage(page, kind);
  }

  function getKindLabel(kind: WikiEntityKind) {
    if (kind === "item") return "Item";
    if (kind === "boss") return "Boss";
    if (kind === "quest") return "Quest";
    return "Wiki";
  }

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) return;

    let cancelled = false;
    searchWikiPages(debouncedQuery)
      .then((pages) => {
        if (!cancelled) {
          setResults(pages);
          setResultsQuery(debouncedQuery);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setResultsQuery(debouncedQuery);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const routeQuery = params.query?.trim() ?? "";
    const routePage = params.page?.trim() ?? "";

    if (routePage || !routeQuery) return;

    let cancelled = false;

    searchWikiPages(routeQuery)
      .then((pages) => {
        if (cancelled) return;
        const exactMatch = pages.find(
          (page) => page.toLowerCase() === routeQuery.toLowerCase()
        );
        const nextPage = exactMatch ?? pages[0] ?? routeQuery;
        setLoadingDocument(true);
        setError(null);
        setSelectedPage(nextPage);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingDocument(true);
          setError(null);
          setSelectedPage(routeQuery);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.page, params.query]);

  useEffect(() => {
    if (!selectedPage) return;
    let cancelled = false;
    fetchWikiLookupDocument(selectedPage)
      .then((nextDocument) => {
        if (!cancelled) setDocument(nextDocument);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDocument(null);
          setError(err instanceof Error ? err.message : "Failed to load wiki content.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDocument(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, selectedPage]);

  const loadingResults = debouncedQuery.trim().length >= 2 && resultsQuery !== debouncedQuery;
  const visibleResults =
    debouncedQuery.trim().length < 2 ? [] : results;
  const showResultsPanel = dropdownOpen && (query.trim().length >= 2 || visibleResults.length > 0 || loadingResults);

  function openPage(page: string) {
    const nextTrail = selectedPage && selectedPage !== page
      ? [...breadcrumbPages, selectedPage].slice(-5)
      : breadcrumbPages;

    if (selectedPage === page) {
      setLoadingDocument(true);
      setError(null);
      setRefreshKey((value) => value + 1);
    }

    setSelectedPage(page);
    setQuery(page);
    setDropdownOpen(false);
    setResults([]);
    setResultsQuery("");
    setLoadingDocument(true);
    setError(null);
    navigate("wiki", {
      page,
      query: page,
      ...(nextTrail.length > 0 ? { trail: nextTrail.join("|") } : {}),
    });
  }

  function resolveSubmittedPage() {
    const trimmed = query.trim();
    if (!trimmed) return null;

    const exactVisibleMatch = visibleResults.find(
      (page) => page.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactVisibleMatch) return exactVisibleMatch;

    if (document?.title && document.title.toLowerCase() === trimmed.toLowerCase()) {
      return document.title;
    }

    return trimmed;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextPage = resolveSubmittedPage();
    if (!nextPage) return;
    openPage(nextPage);
  }

  function handleContentClick(event: React.MouseEvent<HTMLElement>) {
    const rawTarget = event.target;
    const elementTarget =
      rawTarget instanceof HTMLElement
        ? rawTarget
        : rawTarget instanceof Node
          ? rawTarget.parentElement
          : null;
    if (!elementTarget) return;

    if (elementTarget instanceof HTMLImageElement) {
      handleLightboxClick(event);
      return;
    }

    const link = elementTarget.closest("a");
    if (!(link instanceof HTMLAnchorElement)) return;

    const internalPage = link.dataset.wikiPage || resolveWikiPageFromHref(link.href);
    if (!internalPage) return;

    event.preventDefault();
    void routeWikiPage(internalPage);
  }

  useEffect(() => {
    if (!loadingDocument && document && contentRef.current) {
      const pageSlug = document.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      initWikiInteractive(contentRef.current, pageSlug);
    }
  }, [loadingDocument, document]);

  const pageUrl = useMemo(
    () =>
      document
        ? `https://oldschool.runescape.wiki/w/${encodeURIComponent(document.title.replace(/ /g, "_"))}`
        : null,
    [document]
  );

  return (
    <div className="space-y-5">
      <section>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">OSRS Wiki</h2>
            <p className="max-w-2xl text-sm text-text-secondary">
              Search and read any OSRS Wiki page with formatted content.
            </p>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-secondary/60">
            Reference
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <form className="space-y-2" onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const nextPage = resolveSubmittedPage();
                  if (nextPage) openPage(nextPage);
                }
              }}
              placeholder="Search the OSRS Wiki for an item, place, NPC, or activity..."
              aria-label="Search OSRS Wiki"
              className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm outline-none transition focus:border-accent"
            />
            {showResultsPanel ? (
              <div className="rounded-xl border border-border/60 bg-bg-primary/55">
                {loadingResults ? (
                  <div className="space-y-2 px-4 py-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ) : visibleResults.length > 0 ? (
                  visibleResults.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => openPage(page)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                        selectedPage === page
                          ? "bg-accent/10 text-text-primary"
                          : "text-text-secondary hover:bg-bg-tertiary/80 hover:text-text-primary"
                      }`}
                    >
                      <span className="truncate">{page}</span>
                      {selectedPage === page ? (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-accent">
                          Open
                        </span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-text-secondary">
                    No wiki pages found for that query.
                  </div>
                )}
              </div>
            ) : null}
          </form>

          <div className="text-sm text-text-secondary">
            <div className="text-[10px] uppercase tracking-[0.18em] text-text-secondary/45">
              Great For
            </div>
            <div className="mt-3 space-y-2">
              <p>Items and untradeables</p>
              <p>Shops, NPCs, and locations</p>
              <p>Skilling methods and mechanics</p>
              <p>Quick in-app reference while playing</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loadingDocument ? (
        <div className="space-y-4 py-6">
          <div className="animate-pulse bg-bg-tertiary/50 h-6 rounded w-1/3" />
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-2/3" />
          <div className="animate-pulse bg-bg-tertiary/50 h-4 rounded w-1/2" />
          <div className="animate-pulse bg-bg-tertiary/40 h-32 rounded-xl w-full mt-4" />
        </div>
      ) : null}

      {!loadingDocument && !document ? (
        <div className="py-10 text-center text-sm text-text-secondary space-y-4">
          <p>
            Search for something like <span className="text-text-primary">Dusuri&apos;s Star Shop</span>,
            <span className="text-text-primary"> Dragon defender</span>, or
            <span className="text-text-primary"> Guardians of the Rift</span> to open a structured wiki view.
          </p>
          {recentWikiPages.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                Recent
              </span>
              {recentWikiPages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openPage(p.name)}
                  className="rounded-full border border-border/60 bg-bg-secondary/50 px-3 py-1 text-xs text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {document ? (
        <div ref={contentRef} className="rounded-xl border border-border/40 bg-bg-primary/25 p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 space-y-4">
            <div>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
                    OSRS Wiki
                  </div>
                  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-text-secondary/60">
                    <button
                      type="button"
                      onClick={() => navigate("home")}
                      className="transition hover:text-text-primary"
                    >
                      Home
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => navigate("wiki")}
                      className="transition hover:text-text-primary"
                    >
                      Wiki Lookup
                    </button>
                    {breadcrumbPages.map((page) => (
                      <div key={page} className="contents">
                        <span>/</span>
                        <button
                          type="button"
                          onClick={() => openPage(page)}
                          className="max-w-40 truncate transition hover:text-text-primary"
                          title={page}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                  </nav>
                  <h3 className="text-3xl font-semibold tracking-tight">{document.title}</h3>
                  {document.summary ? (
                    <p className="max-w-3xl text-sm leading-6 text-text-secondary">
                      {document.summary}
                    </p>
                    ) : null}
                  {document.relatedPages.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {document.relatedPages.slice(0, 8).map((page) => (
                        <button
                          key={page.title}
                          type="button"
                          onClick={() => navigateToTypedPage(page.title, page.kind)}
                          className="rounded-full border border-border bg-bg-primary/55 px-3 py-1 text-xs text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                        >
                          <span className="mr-1.5 text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                            {getKindLabel(page.kind)}
                          </span>
                          {page.title}
                        </button>
                      ))}
                      {document.totalRelatedPages > 8 ? (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                          +{document.totalRelatedPages - 8} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <SourceAttribution
                    source="OSRS Wiki"
                    fetchedAt={document.fetchedAt}
                    cacheLabel="1 hour"
                  />
                </div>
                {pageUrl ? (
                  <div className="flex flex-wrap gap-2">
                    {document.pageType !== "reference" ? (
                      <button
                        type="button"
                        onClick={() => navigateToTypedPage(document.title, document.pageType)}
                        className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:border-accent/45 hover:text-accent-hover"
                      >
                        Open in {getKindLabel(document.pageType)} Workspace
                      </button>
                    ) : null}
                    <a
                      href={pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                    >
                      Open Full Wiki Page
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            {document.leadHtml ? (
              <section>
                <div
                  className="article-content"
                  onClick={handleContentClick}
                  dangerouslySetInnerHTML={{ __html: document.leadHtml }}
                />
              </section>
            ) : null}

            {document.sections.map((section) => {
              const lower = section.title.toLowerCase();
              const isRequirements =
                lower.includes("requirements") &&
                !lower.includes("equipment");
              const extra = sectionExtraClasses(section.title);
              const collapsed = shouldCollapse(section.title);

              const sectionBody = isRequirements ? (
                <RequirementsSection
                  html={section.html}
                  onQuestClick={(questName) =>
                    navigate("progress", { quest: questName, tab: "quests" })
                  }
                />
              ) : (
                <WikiSectionContent
                  html={section.html}
                  className={`article-content${extra ? ` ${extra}` : ""}`}
                  onClick={handleContentClick}
                  onLinkClick={(href) => {
                    const page = resolveWikiPageFromHref(href);
                    if (page) void routeWikiPage(page);
                  }}
                />
              );

              return collapsed ? (
                <details key={section.id} className="article-content-collapse">
                  <summary className="mb-4 text-lg font-semibold tracking-tight cursor-pointer text-text-primary hover:text-accent transition-colors">
                    {section.title}
                  </summary>
                  {sectionBody}
                </details>
              ) : (
                <section key={section.id}>
                  <h4 className="mb-4 text-lg font-semibold tracking-tight">{section.title}</h4>
                  {sectionBody}
                </section>
              );
            })}
          </section>

          <aside className="space-y-4">
            <section>
              <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
                Snapshot
              </div>
              <div className="mt-3 space-y-4">
                {document.infoboxImage ? (
                  <>
                    <img
                      src={document.infoboxImage}
                      alt={document.infoboxTitle ?? document.title}
                      className="max-h-64 w-full rounded-xl border border-border object-contain bg-bg-tertiary/30"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        const fallback = el.nextElementSibling;
                        if (fallback instanceof HTMLElement) fallback.style.display = "flex";
                      }}
                    />
                    <div className="hidden h-32 w-full rounded-xl border border-border bg-bg-tertiary/30 items-center justify-center text-2xl text-text-secondary/30">
                      {(document.infoboxTitle ?? document.title)[0]}
                    </div>
                  </>
                ) : (
                  <div className="flex h-32 w-full rounded-xl border border-border bg-bg-tertiary/30 items-center justify-center text-2xl text-text-secondary/30">
                    {(document.infoboxTitle ?? document.title)[0]}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    {document.infoboxTitle ?? document.title}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    Quick-reference facts pulled from the page infobox where available.
                  </div>
                </div>
                <div className="space-y-2">
                  {document.infoboxFields.length > 0 ? (
                    <>
                      {document.infoboxFields.map((field) => (
                        <div
                          key={field.label}
                          className="px-3 py-2"
                        >
                          <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                            {field.label}
                          </div>
                          <div className="mt-1 text-sm text-text-primary">{field.value}</div>
                        </div>
                      ))}
                      {document.totalInfoboxFields > document.infoboxFields.length ? (
                        <div className="px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                          +{document.totalInfoboxFields - document.infoboxFields.length} more fields on wiki
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="px-3 py-3 text-sm text-text-secondary">
                      No structured infobox fields were found for this page.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
        </div>
      ) : null}
    </div>
  );
}
