import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { apiFetch } from "../../lib/api/fetch";
import { isTauri } from "../../lib/env";
import EmptyState from "../../components/EmptyState";
import { TableSkeleton, CardSkeleton } from "../../components/Skeleton";
import { NAV_ICONS } from "../../lib/sprites";
import { warn } from "../../lib/logger";

interface NewsPost {
  title: string;
  url: string;
  date: string;
  category: string;
  status: "shipped" | "proposed" | "upcoming" | "unknown";
}

function classifyPost(category: string, title: string): NewsPost["status"] {
  const t = title.toLowerCase();
  const c = category.toLowerCase();

  if (c === "game updates") return "shipped";
  if (c === "future updates" || t.includes("coming soon") || t.includes("get ready"))
    return "upcoming";
  if (
    t.includes("poll") ||
    t.includes("qol") ||
    t.includes("rewards primer") ||
    t.includes("changes &")
  )
    return "proposed";
  if (c === "dev blogs") return "proposed";
  if (c === "community" && (t.includes("price") || t.includes("membership")))
    return "shipped";
  if (t.includes("leagues") || t.includes("demonic pacts")) return "upcoming";
  return "unknown";
}

async function fetchMonth(year: number, month: number): Promise<NewsPost[]> {
  const proxyUrl = isTauri
    ? `https://secure.runescape.com/m=news/archive?oldschool=1&year=${year}&month=${month}`
    : `/api/news/archive?oldschool=1&year=${year}&month=${month}`;

  try {
    const res = await apiFetch(proxyUrl);
    if (!res.ok) return [];

    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Try specific class first, fall back to generic <article> tag
    let articles = doc.querySelectorAll("article.news-list-article");
    if (articles.length === 0) articles = doc.querySelectorAll("article");
    if (articles.length === 0) return [];

    return Array.from(articles).map((article) => {
      // Title: try new class-based selector first, then generic
      const titleLink =
        article.querySelector(".news-list-article__title-link") ??
        article.querySelector("h4 a") ??
        article.querySelector("a");
      const title = titleLink?.textContent?.trim() ?? "Untitled";
      const url = titleLink?.getAttribute("href") ?? "#";

      // Category: try specific span, then h5, then fallback
      const category =
        article.querySelector(".news-list-article__category")?.textContent?.trim() ??
        article.querySelector("h5")?.textContent?.trim() ??
        "News";

      // Date: try time element, then date class
      const date =
        article.querySelector("time")?.textContent?.trim()?.replace(/^\| /, "") ??
        article.querySelector(".news-list-article__date")?.textContent?.trim() ??
        "";

      return {
        title,
        url,
        date,
        category,
        status: classifyPost(category, title),
      };
    });
  } catch (err: unknown) {
    warn("News: parse archive HTML", err);
    return [];
  }
}

async function fetchBlogPosts(): Promise<NewsPost[]> {
  const now = new Date();
  const months: { year: number; month: number }[] = [];

  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const results = await Promise.allSettled(
    months.map((m) => fetchMonth(m.year, m.month))
  );

  const seen = new Set<string>();
  const all: NewsPost[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const post of result.value) {
      if (!seen.has(post.url)) {
        seen.add(post.url);
        all.push(post);
      }
    }
  }
  return all;
}

function resolveArticleUrl(url: string): string {
  if (isTauri) {
    if (url.startsWith("http")) return url;
    return `https://secure.runescape.com${url}`;
  }
  // Dev mode: proxy through Vite to avoid CORS
  const path = url.startsWith("http")
    ? url.replace(/^https?:\/\/secure\.runescape\.com\/m=news/, "")
    : url.replace(/^\/m=news/, "");
  return `/api/news${path}`;
}

function extractArticleHtml(html: string): string {
  // Clean up encoding artifacts (replacement characters from charset mismatch)
  const cleaned = html
    .replace(/\uFFFD/g, "")
    .replace(/\?{3,}/g, "");
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, "text/html");

  const selectors = [
    ".news-article-content",
    ".article-content",
    "article .body",
    "article",
  ];

  let content: Element | null = null;
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el && el.innerHTML.trim().length > 0) {
      content = el;
      break;
    }
  }

  if (!content) return "<p>Could not extract article content.</p>";

  // Strip unwanted elements
  content
    .querySelectorAll("script, style, nav, header, footer, iframe, object, embed, form, .noprint, .jmod-reply, [class^='rsw-']")
    .forEach((el) => el.remove());

  // Strip hidden elements
  content.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") ?? "";
    if (style.includes("display:none") || style.includes("display: none")) el.remove();
  });

  // Strip "If you can't see the image above" fallback paragraphs
  content.querySelectorAll("p, center").forEach((el) => {
    const text = el.textContent?.trim() ?? "";
    if (text.match(/if you can'?t see the (image|asset) above/i)) el.remove();
  });

  // Convert .osrs-title divs to h3, .osrs-subtitle to h4, .osrs-subheading to h5
  content.querySelectorAll(".osrs-title").forEach((el) => {
    const h = document.createElement("h3");
    h.textContent = el.textContent?.trim() ?? "";
    el.replaceWith(h);
  });
  content.querySelectorAll(".osrs-subtitle").forEach((el) => {
    const h = document.createElement("h4");
    h.textContent = el.textContent?.trim() ?? "";
    el.replaceWith(h);
  });
  content.querySelectorAll(".osrs-subheading").forEach((el) => {
    const h = document.createElement("h5");
    h.textContent = el.textContent?.trim() ?? "";
    el.replaceWith(h);
  });

  // Convert .divider to <hr>
  content.querySelectorAll(".divider").forEach((el) => {
    el.replaceWith(document.createElement("hr"));
  });

  // Strip event handlers
  content.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    }
  });

  // Resolve relative image URLs
  content.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && src.startsWith("/")) {
      img.setAttribute("src", `https://secure.runescape.com${src}`);
    }
  });

  // Resolve relative link URLs and open in new tab
  content.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && href.startsWith("/")) {
      a.setAttribute("href", `https://secure.runescape.com${href}`);
    }
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  return DOMPurify.sanitize(content.innerHTML, {
    ALLOWED_TAGS: [
      "p", "h2", "h3", "h4", "h5", "ul", "ol", "li", "img",
      "strong", "em", "b", "i", "br", "hr", "table", "thead", "tbody",
      "tr", "th", "td", "span", "div", "figure", "figcaption",
      "blockquote", "dl", "dt", "dd", "sup", "sub", "a",
      "details", "summary", "center",
    ],
    ALLOWED_ATTR: ["src", "alt", "loading", "colspan", "rowspan", "class", "href", "target", "rel"],
  });
}

async function fetchArticleContent(url: string): Promise<string> {
  const fetchUrl = resolveArticleUrl(url);
  const res = await apiFetch(fetchUrl);
  if (!res.ok) throw new Error(`Failed to load article (${res.status})`);
  const html = await res.text();
  return extractArticleHtml(html);
}

type StatusFilter = "all" | "shipped" | "proposed" | "upcoming";

const STATUS_CONFIG: Record<
  Exclude<StatusFilter, "all">,
  { label: string; color: string }
> = {
  shipped: { label: "Shipped", color: "bg-success/20 text-success" },
  proposed: { label: "Proposed / Poll", color: "bg-warning/20 text-warning" },
  upcoming: { label: "Upcoming", color: "bg-purple-500/20 text-purple-400" },
};

export default function News() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [articleHtml, setArticleHtml] = useState<string | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const articleRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading state for async fetch
    setLoading(true);
    fetchBlogPosts().then((p) => {
      if (!cancelled) {
        setPosts(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function handlePostClick(post: NewsPost) {
    const id = ++articleRequestId.current;
    setSelectedPost(post);
    setArticleHtml(null);
    setArticleLoading(true);
    fetchArticleContent(post.url)
      .then((html) => { if (articleRequestId.current === id) setArticleHtml(html); })
      .catch(() => { if (articleRequestId.current === id) setArticleHtml("<p>Failed to load article.</p>"); })
      .finally(() => { if (articleRequestId.current === id) setArticleLoading(false); });
  }

  function handleBack() {
    setSelectedPost(null);
    setArticleHtml(null);
  }

  const filtered =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const statusBadge = (status: NewsPost["status"]) => {
    if (status === "unknown") return null;
    const cfg = STATUS_CONFIG[status];
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "Game Updates":
        return "bg-success/10 text-success/70";
      case "Community":
        return "bg-accent/10 text-accent/70";
      case "Dev Blogs":
        return "bg-purple-500/10 text-purple-400/70";
      case "Future Updates":
        return "bg-warning/10 text-warning/70";
      case "Events":
        return "bg-pink-500/10 text-pink-400/70";
      default:
        return "bg-bg-tertiary text-text-secondary";
    }
  };

  const postRow = (post: NewsPost, i: number) => (
    <button
      key={i}
      onClick={() => handlePostClick(post)}
      className={`block w-full text-left rounded-lg px-4 py-3 transition-colors ${
        selectedPost?.url === post.url
          ? "bg-accent/10 border border-accent/30"
          : "bg-bg-tertiary hover:bg-bg-secondary"
      }`}
    >
      <div className="text-sm font-medium">{post.title}</div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-text-secondary">{post.date}</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${categoryColor(post.category)}`}
        >
          {post.category}
        </span>
        {statusBadge(post.status)}
      </div>
    </button>
  );

  const filterButtons = (
    <div className="grid grid-cols-2 gap-1.5 mb-4">
      {(["all", "shipped", "proposed", "upcoming"] as const).map((f) => {
        const active = filter === f;
        const label =
          f === "all" ? "All"
            : f === "shipped" ? "Shipped"
              : f === "proposed" ? "Proposed"
                : "Upcoming";
        return (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={active}
            className={`relative px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              active
                ? "border-accent/40 text-accent bg-accent/5"
                : "border-border/60 text-text-secondary hover:border-border hover:text-text-primary"
            }`}
          >
            {label}
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-0.5 rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );

  if (!selectedPost) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-semibold tracking-tight">OSRS News</h2>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh news"
          >
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-text-secondary/30 border-t-accent rounded-full animate-spin" />
                Loading
              </span>
            ) : "Refresh"}
          </button>
          {!loading && posts.length > 0 && (
            <span className="text-xs text-text-secondary/40">
              {posts.length} articles
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Latest updates, dev blogs, and community posts from the Old School team.
        </p>
        {filterButtons}

        {loading && <TableSkeleton rows={6} cols={2} />}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={NAV_ICONS.news}
            title={posts.length === 0 ? "Could not load news" : "No posts match this filter"}
            description={posts.length === 0 ? "Try again later." : "Try a different filter."}
          />
        )}

        {filtered.length > 0 && (
          <div className="rounded-xl border border-border/60 p-2 space-y-1.5">
            {filtered.map((post, i) => postRow(post, i))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-5">
      <aside className="min-w-0">
        <div className="mb-3 px-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary/45">
          Articles
        </div>
        {filterButtons}
        <div
          className="space-y-1.5 overflow-y-auto scroll-fade sidebar-scroll"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          {filtered.map((post, i) => postRow(post, i))}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            ← Back to list
          </button>
          <a
            href={selectedPost.url.startsWith("http") ? selectedPost.url : `https://secure.runescape.com${selectedPost.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Open on RuneScape.com ↗
          </a>
        </div>

        <h3 className="text-lg font-semibold mb-2">{selectedPost.title}</h3>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-secondary">
            {selectedPost.date}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${categoryColor(selectedPost.category)}`}
          >
            {selectedPost.category}
          </span>
          {statusBadge(selectedPost.status)}
        </div>

        {articleLoading && <CardSkeleton />}

        {!articleLoading && articleHtml && (
          <div className="rounded-xl border border-border/40 bg-bg-primary/25 p-5">
            <div
              className="article-content text-sm text-text-secondary leading-relaxed space-y-3"
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
