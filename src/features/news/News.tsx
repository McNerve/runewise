import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api/fetch";
import { isTauri } from "../../lib/env";

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
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const articles = doc.querySelectorAll("article");

    return Array.from(articles).map((article) => {
      const title =
        article.querySelector("h4 a")?.textContent?.trim() ?? "Untitled";
      const category =
        article.querySelector("h5")?.textContent?.trim() ?? "News";
      return {
        title,
        url:
          article.querySelector("h4 a")?.getAttribute("href") ?? "#",
        date:
          article
            .querySelector("time")
            ?.textContent?.trim()
            ?.replace(/^\| /, "") ?? "",
        category,
        status: classifyPost(category, title),
      };
    });
  } catch {
    return [];
  }
}

async function fetchBlogPosts(): Promise<NewsPost[]> {
  const now = new Date();
  const months: { year: number; month: number }[] = [];

  // Fetch current month and previous 2 months for full coverage
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const results = await Promise.all(
    months.map((m) => fetchMonth(m.year, m.month))
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const all: NewsPost[] = [];
  for (const post of results.flat()) {
    if (!seen.has(post.url)) {
      seen.add(post.url);
      all.push(post);
    }
  }
  return all;
}

function resolveArticleUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (isTauri) return `https://secure.runescape.com${url}`;
  return `/api/news${url.replace(/^\/m=news/, "")}`;
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

  // Strip links but keep text
  content.querySelectorAll("a").forEach((a) => {
    const text = document.createTextNode(a.textContent ?? "");
    a.replaceWith(text);
  });

  return content.innerHTML;
}

async function fetchArticleContent(url: string): Promise<string> {
  const fetchUrl = resolveArticleUrl(url);
  const res = await apiFetch(fetchUrl);
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
    setSelectedPost(post);
    setArticleHtml(null);
    setArticleLoading(true);
    fetchArticleContent(post.url)
      .then((html) => setArticleHtml(html))
      .catch(() => setArticleHtml("<p>Failed to load article.</p>"))
      .finally(() => setArticleLoading(false));
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
          : "bg-bg-secondary hover:bg-bg-tertiary"
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
    <div className="flex gap-1.5 mb-4">
      {(["all", "shipped", "proposed", "upcoming"] as const).map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            filter === f
              ? f === "all"
                ? "bg-accent text-white"
                : f === "shipped"
                  ? "bg-success/20 text-success"
                  : f === "proposed"
                    ? "bg-warning/20 text-warning"
                    : "bg-purple-500/20 text-purple-400"
              : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
          }`}
        >
          {f === "all"
            ? "All"
            : f === "shipped"
              ? "Shipped"
              : f === "proposed"
                ? "Proposed / Poll"
                : "Upcoming"}
        </button>
      ))}
    </div>
  );

  if (!selectedPost) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold">OSRS News</h2>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh news"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          {!loading && posts.length > 0 && (
            <span className="text-xs text-text-secondary/40">
              {posts.length} articles
            </span>
          )}
        </div>
        {filterButtons}

        {loading && (
          <p className="text-sm text-text-secondary">Loading news...</p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-text-secondary">
            {posts.length === 0
              ? "Could not load news. Try again later."
              : "No posts match this filter."}
          </p>
        )}

        <div className="space-y-1.5">
          {filtered.map((post, i) => postRow(post, i))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4" style={{ maxWidth: "900px" }}>
      <div className="shrink-0" style={{ width: "250px" }}>
        <h2 className="text-xl font-semibold mb-4">OSRS News</h2>
        {filterButtons}
        <div
          className="space-y-1.5 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 180px)" }}
        >
          {filtered.map((post, i) => postRow(post, i))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <button
          onClick={handleBack}
          className="text-sm text-accent hover:text-accent-hover mb-4 transition-colors"
        >
          ← Back to list
        </button>

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

        {articleLoading && (
          <p className="text-sm text-text-secondary">Loading article...</p>
        )}

        {!articleLoading && articleHtml && (
          <div
            className="article-content text-sm text-text-secondary leading-relaxed space-y-3"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />
        )}
      </div>
    </div>
  );
}
