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
import { useNavigation, type View } from "../../lib/NavigationContext";
import { loadRecentEntities } from "../../lib/recentEntities";
import {
  initWikiInteractive,
  handleLightboxClick,
} from "../../lib/wiki/interactive";
import { useGEData } from "../../hooks/useGEData";
import { fetchMapping } from "../../lib/api/ge";
import { isDatePill, extractTocEntries, upgradeImageUrl, type TocEntry } from "./wikiLookupUtils";

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

// Task 3 & 7: Workspace fallback labels
function getKindLabel(kind: WikiEntityKind) {
  if (kind === "item") return "Item";
  if (kind === "boss") return "Boss";
  if (kind === "quest") return "Quest";
  return "Wiki";
}

function getWorkspaceLabel(kind: WikiEntityKind): string | null {
  if (kind === "item") return "Open in Item Workspace";
  if (kind === "boss") return "Open in Boss Guide";
  if (kind === "quest") return "Open in Quest Workspace";
  return null;
}

// Infer extended type from infobox fields for workspace fallbacks
type ExtendedPageType = WikiEntityKind | "minigame" | "skill" | "location" | "npc";

function inferExtendedPageType(doc: WikiLookupDocument): ExtendedPageType {
  if (doc.pageType !== "reference") return doc.pageType;
  const fieldLabels = new Set(doc.infoboxFields.map((f) => f.label.toLowerCase()));
  const fieldValues = doc.infoboxFields.map((f) => f.value.toLowerCase()).join(" ");
  if (fieldLabels.has("skill") || fieldLabels.has("level required") || fieldLabels.has("experience")) return "skill";
  if (fieldLabels.has("location") && fieldLabels.has("activity")) return "minigame";
  if (fieldLabels.has("map") || (fieldLabels.has("location") && !fieldValues.includes("npc"))) return "location";
  if (fieldLabels.has("examine") && (fieldLabels.has("race") || fieldLabels.has("attack style"))) return "npc";
  return "reference";
}

function getExtendedWorkspaceButton(
  extendedType: ExtendedPageType,
  doc: WikiLookupDocument,
  navigate: (view: View, params?: Record<string, string>) => void
): { label: string; onClick: () => void } | null {
  if (extendedType === "minigame") {
    return { label: "Open in Activity Workspace", onClick: () => navigate("news") };
  }
  if (extendedType === "skill") {
    return { label: "Open Skill Calculator", onClick: () => navigate("skill-calc") };
  }
  if (extendedType === "boss") {
    return { label: "Open Boss Guide", onClick: () => navigate("bosses", { boss: doc.title }) };
  }
  if (extendedType === "location") {
    return { label: "Open World Map", onClick: () => navigate("world-map") };
  }
  if (extendedType === "npc") {
    const sellsField = doc.infoboxFields.find((f) => f.label.toLowerCase().includes("sell"));
    if (sellsField) {
      return { label: "Open Shop Helper", onClick: () => navigate("shop-helper", { query: doc.title }) };
    }
  }
  return null;
}

// Task 5: TOC component
function WikiToc({
  entries,
  activeId,
  onClickEntry,
}: {
  entries: TocEntry[];
  activeId: string | null;
  onClickEntry: (id: string) => void;
}) {
  // Initialize collapse based on current viewport width — no effect needed
  const [collapsed, setCollapsed] = useState(
    () => !window.matchMedia("(min-width: 1024px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setCollapsed(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (entries.length < 3) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="text-xs text-text-secondary"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between text-[10px] uppercase tracking-[0.2em] text-text-secondary/45 hover:text-text-secondary transition-colors"
        aria-expanded={!collapsed}
      >
        <span>Contents</span>
        <span className="text-[10px]">{collapsed ? "▶" : "▼"}</span>
      </button>
      {!collapsed && (
        <ol className="mt-2 space-y-0.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={entry.level === 3 ? "pl-3" : ""}
            >
              <button
                type="button"
                onClick={() => onClickEntry(entry.id)}
                className={`w-full text-left py-0.5 transition-colors ${
                  activeId === entry.id
                    ? "text-accent font-medium"
                    : "text-text-secondary/70 hover:text-text-primary"
                }`}
              >
                {entry.text}
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

// Task 3: Snapshot with live GE price
function WikiSnapshot({
  document,
}: {
  document: WikiLookupDocument;
}) {
  const geData = useGEData();
  const [itemData, setItemData] = useState<{
    price: number | null;
    buyLimit: number | null;
    dailyVolume: number | null;
    itemId: number | null;
  } | null>(null);

  const isItem = document.pageType === "item" ||
    document.infoboxFields.some(
      (f) => f.label.toLowerCase() === "tradeable" && f.value.toLowerCase().includes("yes")
    );

  useEffect(() => {
    if (!isItem) return;

    let cancelled = false;

    void (async () => {
      try {
        await geData.fetchIfNeeded();
        const mapping = await fetchMapping();
        const match = mapping.find(
          (m) => m.name.toLowerCase() === document.title.toLowerCase()
        );
        if (cancelled || !match) return;

        const price = geData.priceOf(match.id);
        const { fetchVolumes } = await import("../../lib/api/ge");
        const volumeData = await fetchVolumes();
        const volume = volumeData[String(match.id)] ?? null;

        if (!cancelled) {
          setItemData({
            price,
            buyLimit: match.limit ?? null,
            dailyVolume: volume,
            itemId: match.id,
          });
        }
      } catch {
        // silently skip GE enrichment on failure
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.title, isItem]);

  const imageUrl = upgradeImageUrl(document.infoboxImage);

  function formatPrice(price: number | null): string {
    if (price == null) return "";
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(2)}B`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
    return price.toLocaleString();
  }

  const priceFormatted = itemData?.price != null ? formatPrice(itemData.price) : null;
  const isHighValue = itemData?.price != null && itemData.price >= 1_000_000;

  return (
    <div className="space-y-4">
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
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

        {/* Task 3: Live GE price block */}
        {isItem && priceFormatted ? (
          <div className="mt-2 space-y-0.5">
            <div
              className={`text-xl font-bold tracking-tight ${
                isHighValue ? "text-yellow-400" : "text-text-primary"
              }`}
            >
              {priceFormatted} <span className="text-sm font-normal text-text-secondary">coins</span>
            </div>
            {(itemData?.buyLimit != null || itemData?.dailyVolume != null) && (
              <div className="text-xs text-text-secondary/70">
                {itemData.buyLimit != null && (
                  <span>Buy limit: {itemData.buyLimit.toLocaleString()}</span>
                )}
                {itemData.buyLimit != null && itemData.dailyVolume != null && (
                  <span className="mx-1">·</span>
                )}
                {itemData.dailyVolume != null && (
                  <span>Daily volume: {itemData.dailyVolume.toLocaleString()}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1 text-xs text-text-secondary">
            Quick-reference facts pulled from the page infobox where available.
          </div>
        )}
      </div>

      <div className="space-y-2">
        {document.infoboxFields.length > 0 ? (
          <>
            {document.infoboxFields.map((field) => (
              <div key={field.label} className="px-3 py-2">
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
  );
}

// Task 2: Strips the first paragraph from leadHtml if it matches the summary
function LeadContent({
  html,
  summary,
  onContentClick,
}: {
  html: string;
  summary: string | null;
  onContentClick: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const processedHtml = useMemo(() => {
    if (!summary) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.querySelector(".mw-parser-output") ?? doc.body;

    const firstP = body.querySelector("p");
    if (firstP) {
      const pText = (firstP.textContent ?? "").trim();
      if (pText.includes(summary.slice(0, 60))) {
        firstP.remove();
      }
    }

    return body.innerHTML.trim();
  }, [html, summary]);

  return (
    <div
      className="article-content"
      onClick={onContentClick}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
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
  // Task 8: dim body while typing
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchDirty, setSearchDirty] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  // Task 5: active TOC heading
  const [activeTocId, setActiveTocId] = useState<string | null>(null);

  // Task 1: Breadcrumb — history trail (prev pages), current page shown separately
  const breadcrumbTrail = useMemo(() => {
    const rawTrail = params.trail?.split("|").filter(Boolean) ?? [];
    return rawTrail.slice(-5);
  }, [params.trail]);

  const recentWikiPages = useMemo(
    () => loadRecentEntities().filter((e) => e.category === "Wiki").slice(0, 5),
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
  const visibleResults = debouncedQuery.trim().length < 2 ? [] : results;
  const showResultsPanel = dropdownOpen && (query.trim().length >= 2 || visibleResults.length > 0 || loadingResults);

  // Task 8: body dimmed when search has focus and user has typed
  const bodyDimmed = searchFocused && searchDirty;

  function openPage(page: string) {
    // Task 1: push selectedPage into trail, new page becomes current
    const nextTrail = selectedPage && selectedPage !== page
      ? [...breadcrumbTrail, selectedPage].slice(-5)
      : breadcrumbTrail;

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
    setSearchDirty(false);
    setActiveTocId(null);
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
      initWikiInteractive(contentRef.current);
    }
  }, [loadingDocument, document]);

  // Task 5: IntersectionObserver for active TOC heading
  useEffect(() => {
    if (!document || !contentRef.current) return;

    const headingEls = contentRef.current.querySelectorAll<HTMLElement>("[data-section-id]");
    if (headingEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.sectionId;
            if (id) setActiveTocId(id);
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );

    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [document, loadingDocument]);

  function scrollToSection(id: string) {
    const el = contentRef.current?.querySelector(`[data-section-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveTocId(id);
    }
  }

  const pageUrl = useMemo(
    () =>
      document
        ? `https://oldschool.runescape.wiki/w/${encodeURIComponent(document.title.replace(/ /g, "_"))}`
        : null,
    [document]
  );

  // Task 4: filter date pills
  const filteredRelatedPages = useMemo(() => {
    if (!document) return [];
    return document.relatedPages.filter((p) => !isDatePill(p.title));
  }, [document]);

  // Task 5: TOC entries
  const tocEntries = useMemo(() => {
    if (!document) return [];
    return extractTocEntries(document.sections);
  }, [document]);

  // Task 7: extended page type for workspace fallbacks
  const extendedPageType = useMemo(() => {
    if (!document) return "reference" as ExtendedPageType;
    return inferExtendedPageType(document);
  }, [document]);

  const workspaceButton = useMemo(() => {
    if (!document) return null;
    if (document.pageType !== "reference") {
      const label = getWorkspaceLabel(document.pageType);
      if (label) {
        return {
          label,
          onClick: () => navigateToTypedPage(document.title, document.pageType),
        };
      }
    }
    return getExtendedWorkspaceButton(extendedPageType, document, navigate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, extendedPageType]);

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
              onChange={(e) => {
                setQuery(e.target.value);
                setDropdownOpen(true);
                setSearchDirty(true);
              }}
              onFocus={() => {
                setDropdownOpen(true);
                setSearchFocused(true);
              }}
              onBlur={() => setSearchFocused(false)}
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
            <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
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
        // Task 8: dim body while search is focused and dirty
        <div
          ref={contentRef}
          className={`rounded-xl border border-border/40 bg-bg-primary/25 p-5 transition-opacity duration-200 ${
            bodyDimmed ? "opacity-40 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0 space-y-4">
              <div>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
                      OSRS Wiki
                    </div>
                    {/* Task 1: Breadcrumb with current page always last (bold) */}
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
                      {breadcrumbTrail.map((page) => (
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
                      <span>/</span>
                      <span className="max-w-40 truncate font-semibold text-text-primary" title={document.title}>
                        {document.title}
                      </span>
                    </nav>
                    <h3 className="text-3xl font-semibold tracking-tight">{document.title}</h3>
                    {/* Task 2: summary only shown here; body's leading paragraph skipped in LeadContent */}
                    {document.summary ? (
                      <p className="max-w-3xl text-sm leading-6 text-text-secondary">
                        {document.summary}
                      </p>
                    ) : null}
                    {/* Task 4: date pills filtered */}
                    {filteredRelatedPages.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {filteredRelatedPages.slice(0, 8).map((page) => (
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
                        {document.totalRelatedPages > filteredRelatedPages.slice(0, 8).length ? (
                          <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">
                            +{document.totalRelatedPages - filteredRelatedPages.slice(0, 8).length} more
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
                      {/* Task 7: workspace button with fallbacks */}
                      {workspaceButton ? (
                        <button
                          type="button"
                          onClick={workspaceButton.onClick}
                          className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:border-accent/45 hover:text-accent-hover"
                        >
                          {workspaceButton.label}
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

              {/* Task 2: leadHtml with first paragraph stripped to avoid dup with summary */}
              {document.leadHtml ? (
                <section>
                  <LeadContent
                    html={document.leadHtml}
                    summary={document.summary}
                    onContentClick={handleContentClick}
                  />
                </section>
              ) : null}

              {/* Task 5: section headings with data-section-id for TOC / IntersectionObserver */}
              {document.sections.map((section) => {
                const extra = sectionExtraClasses(section.title);
                const collapsed = shouldCollapse(section.title);
                return collapsed ? (
                  <details key={section.id} className="article-content-collapse">
                    <summary
                      data-section-id={section.id}
                      className="mb-4 text-lg font-semibold tracking-tight cursor-pointer text-text-primary hover:text-accent transition-colors"
                    >
                      {section.title}
                    </summary>
                    <div
                      className={`article-content${extra ? ` ${extra}` : ""}`}
                      onClick={handleContentClick}
                      dangerouslySetInnerHTML={{ __html: section.html }}
                    />
                  </details>
                ) : (
                  <section key={section.id}>
                    <h4
                      data-section-id={section.id}
                      className="mb-4 text-lg font-semibold tracking-tight scroll-mt-4"
                    >
                      {section.title}
                    </h4>
                    <div
                      className={`article-content${extra ? ` ${extra}` : ""}`}
                      onClick={handleContentClick}
                      dangerouslySetInnerHTML={{ __html: section.html }}
                    />
                  </section>
                );
              })}
            </section>

            <aside className="space-y-4">
              {/* Task 5: TOC in sidebar */}
              {tocEntries.length >= 3 ? (
                <section>
                  <WikiToc
                    entries={tocEntries}
                    activeId={activeTocId}
                    onClickEntry={scrollToSection}
                  />
                </section>
              ) : null}

              <section>
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
                  Snapshot
                </div>
                <div className="mt-3">
                  <WikiSnapshot document={document} />
                </div>
              </section>
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  );
}
