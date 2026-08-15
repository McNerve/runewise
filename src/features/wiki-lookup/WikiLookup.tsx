import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import {
  classifyWikiPage,
  fetchWikiLookupDocument,
  resolveWikiPageFromHref,
  searchWikiPages,
  searchWikiPagesRich,
  type WikiEntityKind,
  type WikiLookupDocument,
  type WikiSearchResult,
} from "../../lib/wiki/lookup";
import { Skeleton } from "../../components/Skeleton";
import { useNavigation } from "../../lib/NavigationContext";
import { loadRecentEntities } from "../../lib/recentEntities";
import {
  initWikiInteractive,
  handleLightboxClick,
} from "../../lib/wiki/interactive";
import { useGEData } from "../../hooks/useGEData";
import { fetchVolumes } from "../../lib/api/ge";
import WikiArticle from "./components/WikiArticle";
import { POPULAR_PAGES, WIKI_HOME_CATEGORIES } from "./wikiLookupConstants";
import {
  loadPersistedHistory,
  persistHistory,
  visit,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  currentPage,
  type WikiHistory,
} from "./wikiHistory";
import {
  stripWikiStrategySuffix,
  isWikiStrategyTitle,
} from "./wikiLookupUtils";
import { buildGeSnapshot, wikiKindLabel, type GESnapshot } from "./wikiLookupGe";
import { findBossByName } from "../../lib/data/bosses";

export default function WikiLookup() {
  const { params, navigate } = useNavigation();
  const [query, setQuery] = useState(params.query ?? "");
  const debouncedQuery = useDebounce(query, 180);
  const [results, setResults] = useState<WikiSearchResult[]>([]);
  const [resultsQuery, setResultsQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(params.page ?? "");
  const [document, setDocument] = useState<WikiLookupDocument | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(Boolean(params.page));
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [geSnapshot, setGeSnapshot] = useState<GESnapshot | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const { mapping, prices, fetchIfNeeded } = useGEData();
  // Reading history survives view switches via the module-level slot.
  const [pageHistory, setPageHistory] = useState<WikiHistory>(() => {
    const initial = loadPersistedHistory();
    const initialPage = params.page?.trim();
    const next = initialPage ? visit(initial, initialPage) : initial;
    persistHistory(next);
    return next;
  });

  function recordVisit(page: string) {
    setPageHistory((h) => {
      const next = visit(h, page);
      persistHistory(next);
      return next;
    });
  }

  // Fetch GE mapping on mount so it's ready for enrichment.
  useEffect(() => { fetchIfNeeded(); }, [fetchIfNeeded]);

  // GE enrichment: when an item page loads, look up live price/limit/volume.
  useEffect(() => {
    if (!document || document.pageType !== "item") {
      setGeSnapshot(null);
      return;
    }

    // Sync lookup first so untradeables / misses clear immediately.
    const base = buildGeSnapshot(document.title, mapping, prices);
    if (!base) {
      setGeSnapshot(null);
      return;
    }

    let cancelled = false;
    fetchVolumes()
      .then((vols) => {
        if (cancelled) return;
        setGeSnapshot(buildGeSnapshot(document.title, mapping, prices, vols));
      })
      .catch(() => {
        if (!cancelled) setGeSnapshot(base);
      });

    return () => { cancelled = true; };
  }, [document, mapping, prices]);

  // Close dropdown on outside click or Escape key.
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    window.document.addEventListener("mousedown", handleOutsideClick);
    window.document.addEventListener("keydown", handleEscape);
    return () => {
      window.document.removeEventListener("mousedown", handleOutsideClick);
      window.document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
    // Stay on the wiki — this view is a wiki mirror. Workspace jumps are
    // explicit buttons on the article, not silent redirects.
    void kind;
    openPage(page);
  }

  async function routeWikiPage(page: string) {
    const kind = await classifyWikiPage(page);
    navigateToTypedPage(page, kind);
  }

  function getKindLabel(kind: WikiEntityKind) {
    return wikiKindLabel(kind);
  }

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) return;

    let cancelled = false;
    searchWikiPagesRich(debouncedQuery)
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

  // Sync selected page when route params.page changes (browser history / hash edits)
  useEffect(() => {
    const routePage = params.page?.trim() ?? "";
    if (!routePage) return;
    if (routePage === selectedPage) return;
    setLoadingDocument(true);
    setError(null);
    setSelectedPage(routePage);
    recordVisit(routePage);
  }, [params.page]); // eslint-disable-line react-hooks/exhaustive-deps

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
        recordVisit(nextPage);
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
    recordVisit(page);
    navigate("wiki", {
      page,
      query: page,
      ...(nextTrail.length > 0 ? { trail: nextTrail.join("|") } : {}),
    });
  }

  // Alt+←/→ mirror the on-screen back/forward buttons. The handler lives in
  // a ref so the listener registers once without stale closures.
  const historyKeyHandler = useRef<(direction: "back" | "forward") => void>(() => {});
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault();
      historyKeyHandler.current(e.key === "ArrowLeft" ? "back" : "forward");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Back/forward re-open pages from the history stack without re-recording
  // them or growing the breadcrumb trail.
  function navigateHistory(direction: "back" | "forward") {
    const next = direction === "back" ? goBack(pageHistory) : goForward(pageHistory);
    if (next === pageHistory) return;
    const page = currentPage(next);
    if (!page) return;
    persistHistory(next);
    setPageHistory(next);
    setSelectedPage(page);
    setQuery(page);
    setDropdownOpen(false);
    setLoadingDocument(true);
    setError(null);
    navigate("wiki", { page, query: page });
  }
  useEffect(() => {
    historyKeyHandler.current = navigateHistory;
  });

  function resolveSubmittedPage() {
    const trimmed = query.trim();
    if (!trimmed) return null;

    const exactVisibleMatch = visibleResults.find(
      (page) => page.title.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactVisibleMatch) return exactVisibleMatch.title;

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
      return initWikiInteractive(contentRef.current);
    }
  }, [loadingDocument, document]);

  // Reading progress for long wiki articles (scroll within main content-area).
  useEffect(() => {
    if (!document) {
      setReadProgress(0);
      return;
    }
    const scroller = window.document.querySelector("main.content-area");
    if (!scroller) return;
    function onScroll() {
      const el = scroller as HTMLElement;
      const max = el.scrollHeight - el.clientHeight;
      setReadProgress(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [document, loadingDocument]);

  const pageUrl = useMemo(
    () =>
      document
        ? `https://oldschool.runescape.wiki/w/${encodeURIComponent(document.title.replace(/ /g, "_"))}`
        : null,
    [document]
  );

  return (
    <div className="space-y-5 min-w-0">
      <section className="min-w-0">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1 min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">OSRS Wiki</h2>
            {!document ? (
              <p className="max-w-2xl text-sm text-text-secondary">
                Search and read any OSRS Wiki page with formatted content.
              </p>
            ) : null}
          </div>
          {!document ? (
            <div className="text-[11px] uppercase tracking-[0.18em] text-text-secondary/60">
              Reference
            </div>
          ) : null}
        </div>

        <div className="mt-4 min-w-0">
          <div ref={searchRef} className="min-w-0">
          <form className="relative" onSubmit={handleSubmit}>
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
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-border/60 bg-bg-primary shadow-lg max-h-[60vh] overflow-y-auto">
                {loadingResults ? (
                  <div className="space-y-2 px-4 py-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ) : visibleResults.length > 0 ? (
                  visibleResults.map((page) => (
                    <button
                      key={page.title}
                      type="button"
                      onClick={() => openPage(page.title)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                        selectedPage === page.title
                          ? "bg-accent/10 text-text-primary"
                          : "text-text-secondary hover:bg-bg-tertiary/80 hover:text-text-primary"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {page.thumbnail ? (
                          <img
                            src={page.thumbnail}
                            alt=""
                            loading="lazy"
                            className="h-8 w-8 shrink-0 rounded-md object-contain bg-bg-tertiary/40"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : null}
                        <span className="min-w-0">
                          <span className="block truncate">{page.title}</span>
                          {page.snippet ? (
                            <span className="mt-0.5 block truncate text-xs text-text-secondary/55">
                              {page.snippet}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      {selectedPage === page.title ? (
                        <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-accent">
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

      {!loadingDocument && !document && !error ? (
        <div className="space-y-6 py-2">
          {recentWikiPages.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
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
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {WIKI_HOME_CATEGORIES.map((cat) => (
              <button
                key={cat.page}
                type="button"
                onClick={() => openPage(cat.page)}
                className="home-tile rounded-xl border border-border/50 bg-bg-tertiary/40 px-4 py-3 text-left"
              >
                <div className="text-sm font-medium text-text-primary">{cat.title}</div>
                <div className="mt-0.5 text-xs text-text-secondary">{cat.blurb}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
              Popular
            </span>
            {POPULAR_PAGES.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => openPage(page)}
                className="rounded-full border border-border/60 bg-bg-secondary/50 px-3 py-1 text-xs text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {document ? (
        <div className="space-y-3">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-text-secondary/60">
            <span className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => navigateHistory("back")}
                disabled={!canGoBack(pageHistory)}
                aria-label="Back to previous wiki page"
                title="Back (Alt+←)"
                className="rounded-md border border-border/60 p-1 transition enabled:hover:border-accent/40 enabled:hover:text-text-primary disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => navigateHistory("forward")}
                disabled={!canGoForward(pageHistory)}
                aria-label="Forward to next wiki page"
                title="Forward (Alt+→)"
                className="rounded-md border border-border/60 p-1 transition enabled:hover:border-accent/40 enabled:hover:text-text-primary disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </span>
            <button type="button" onClick={() => navigate("home")} className="transition hover:text-text-primary">
              Home
            </button>
            <span>/</span>
            <button type="button" onClick={() => navigate("wiki")} className="transition hover:text-text-primary">
              Wiki
            </button>
            {breadcrumbPages.map((page) => (
              <div key={page} className="contents">
                <span>/</span>
                <button
                  type="button"
                  onClick={() => openPage(page)}
                  className="max-w-40 truncate text-accent transition hover:underline cursor-pointer"
                  title={page}
                >
                  {page}
                </button>
              </div>
            ))}
          </nav>
          <WikiArticle
            document={document}
            contentRef={contentRef}
            onContentClick={handleContentClick}
            geSnapshot={geSnapshot}
            pageUrl={pageUrl}
            readProgress={readProgress}
            related={
              document.relatedPages.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {document.relatedPages.slice(0, 5).map((page) => (
                    <button
                      key={page.title}
                      type="button"
                      onClick={() => openPage(page.title)}
                      className="rounded-full border border-border bg-bg-primary/55 px-3 py-1 text-xs text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                    >
                      <span className="mr-1.5 hidden text-[10px] uppercase tracking-[0.16em] text-text-secondary/45 sm:inline">
                        {getKindLabel(page.kind)}
                      </span>
                      {page.title}
                    </button>
                  ))}
                </div>
              ) : null
            }
            actions={
              <>
                {document.pageType === "item" ? (
                  <button
                    type="button"
                    onClick={() => navigate("market", { query: document.title })}
                    className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:border-accent/45"
                  >
                    Open in Items
                  </button>
                ) : null}
                {document.pageType === "boss" || isWikiStrategyTitle(document.title) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const bossName = stripWikiStrategySuffix(document.title);
                      const known = findBossByName(bossName);
                      navigate("bosses", { boss: known?.name ?? bossName });
                    }}
                    className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:border-accent/45"
                  >
                    {isWikiStrategyTitle(document.title)
                      ? `Open ${stripWikiStrategySuffix(document.title)} Guide`
                      : "Open Boss Guide"}
                  </button>
                ) : null}
                {document.pageType === "quest" ? (
                  <button
                    type="button"
                    onClick={() => navigate("progress", { quest: document.title, tab: "quests" })}
                    className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:border-accent/45"
                  >
                    Open in Quests
                  </button>
                ) : null}
                {pageUrl ? (
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-border bg-bg-primary/60 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                  >
                    Open Full Wiki Page
                  </a>
                ) : null}
              </>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
