import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api/fetch";

interface NewsPost {
  title: string;
  url: string;
  date: string;
  category: string;
  status: "shipped" | "proposed" | "upcoming" | "unknown";
}

const isTauri = "__TAURI__" in window;

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

async function fetchBlogPosts(): Promise<NewsPost[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

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

  useEffect(() => {
    let cancelled = false;
    fetchBlogPosts().then((p) => {
      if (!cancelled) {
        setPosts(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">OSRS News</h2>

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
        {filtered.map((post, i) => (
          <a
            key={i}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-bg-secondary rounded-lg px-4 py-3 hover:bg-bg-tertiary transition-colors"
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
          </a>
        ))}
      </div>
    </div>
  );
}
