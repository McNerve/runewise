import { useState, useRef } from "react";
import { BOSSES, BOSS_CATEGORIES, type BossInfo } from "../../lib/data/bosses";
import { apiFetch } from "../../lib/api/fetch";
import { getCached, setCache } from "../../lib/api/cache";
import { bossIcon } from "../../lib/sprites";
import { isTauri } from "../../lib/env";
import type { HiscoreData } from "../../lib/api/hiscores";

const WIKI_API = isTauri
  ? "https://oldschool.runescape.wiki/api.php"
  : "/api/wiki-content";

interface GuideSection {
  title: string;
  content: string;
}

async function fetchBossGuide(
  wikiPage: string
): Promise<GuideSection[]> {
  const cacheKey = `boss-guide:${wikiPage}`;
  const cached = getCached<GuideSection[]>(cacheKey, 60 * 60 * 1000);
  if (cached) return cached;

  try {
    const sectionsUrl = `${WIKI_API}?action=parse&page=${wikiPage}&prop=sections&format=json`;
    const sectionsRes = await apiFetch(sectionsUrl);
    const sectionsData = await sectionsRes.json();

    if (!sectionsData.parse) return [];

    const sections = sectionsData.parse.sections as {
      number: string;
      line: string;
      level: string;
    }[];

    const targetSections = sections.filter((s) => {
      const line = s.line.toLowerCase();
      return [
        "requirements", "suggested skills", "recommended skills",
        "equipment", "inventory", "inventory setups", "gear",
        "recommended equipment", "suggested equipment",
        "getting there", "location",
        "fight overview", "strategy", "the fight", "mechanics",
        "special attacks", "phases", "attacks",
        "drops",
      ].some((t) => line.includes(t));
    });

    const guide: GuideSection[] = (await Promise.all(
      targetSections.map(async (section) => {
        const textUrl = `${WIKI_API}?action=parse&page=${wikiPage}&prop=text&section=${section.number}&format=json`;
        const textRes = await apiFetch(textUrl);
        const textData = await textRes.json();
        const rawHtml = textData.parse?.text?.["*"] ?? "";

        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, "text/html");

        // Strip unwanted elements
        const content = doc.querySelector(".mw-parser-output") || doc.body;
        content.querySelectorAll("script, style, sup.reference, .mw-editsection, .navbox, .catlinks, .printfooter, .noprint, iframe, object, embed, form, .toc, #toc, [role='navigation'], .mw-headline-anchor").forEach(el => el.remove());
        // Remove TOC, infoboxes, tile markers, and other wiki cruft
        content.querySelectorAll("div, table").forEach(el => {
          const text = el.textContent?.trim() ?? "";
          const cls = el.className ?? "";
          if (
            cls.includes("toc") ||
            cls.includes("infobox") ||
            cls.includes("rsw-infobox") ||
            (text.startsWith("Contents") && el.querySelectorAll("li").length > 0 && text.length < 500) ||
            (text.includes("Tile markers") && text.length < 200) ||
            (text.includes("guide") && text.includes("Data") && text.length < 100)
          ) {
            el.remove();
          }
        });

        // Remove duplicate section headings (wiki often repeats the section name)
        const headings = content.querySelectorAll("h2, h3");
        const seenHeadings = new Set<string>();
        headings.forEach(h => {
          const text = h.textContent?.trim().toLowerCase() ?? "";
          if (seenHeadings.has(text)) {
            h.remove();
          } else {
            seenHeadings.add(text);
          }
        });

        // Strip event handler attributes
        content.querySelectorAll("*").forEach((el) => {
          for (const attr of [...el.attributes]) {
            if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
          }
        });

        // Rewrite image URLs to absolute and handle lazy-loaded images
        content.querySelectorAll("img").forEach(img => {
          // Handle data-src (lazy-loaded images)
          const dataSrc = img.getAttribute("data-src");
          if (dataSrc) {
            img.setAttribute("src", dataSrc);
            img.removeAttribute("data-src");
          }

          const src = img.getAttribute("src") || "";

          // Handle protocol-relative URLs (//oldschool.runescape.wiki/...)
          if (src.startsWith("//")) {
            img.setAttribute("src", `https:${src}`);
          }
          // Handle relative URLs (/images/...)
          else if (src.startsWith("/")) {
            img.setAttribute("src", `https://oldschool.runescape.wiki${src}`);
          }

          // Remove srcset to avoid loading wrong sizes
          img.removeAttribute("srcset");
          img.removeAttribute("data-file-width");
          img.removeAttribute("data-file-height");

          // Constrain image sizes to prevent layout shift
          if (!img.style.maxWidth) {
            img.style.maxWidth = "100%";
          }
          // Add error fallback class
          img.setAttribute("loading", "lazy");
        });

        // Strip links but keep their children (text + images)
        content.querySelectorAll("a").forEach(a => {
          const frag = document.createDocumentFragment();
          while (a.firstChild) frag.appendChild(a.firstChild);
          a.replaceWith(frag);
        });

        const html = content.innerHTML.trim();

        return html.length > 20 ? { title: section.line, content: html } : null;
      })
    )).filter((s): s is GuideSection => s !== null);

    setCache(cacheKey, guide);
    return guide;
  } catch {
    return [];
  }
}

interface Props {
  hiscores?: HiscoreData | null;
}

export default function BossGuide({ hiscores }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBoss, setSelectedBoss] = useState<BossInfo | null>(null);
  const [guide, setGuide] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef(0);

  const filteredBosses =
    selectedCategory === "All"
      ? BOSSES
      : BOSSES.filter((b) => b.category === selectedCategory);

  const getBossKc = (bossName: string): number | null => {
    if (!hiscores?.activities) return null;
    const activity = hiscores.activities.find((a) =>
      a.name.toLowerCase() === bossName.toLowerCase() ||
      bossName.toLowerCase().includes(a.name.toLowerCase()) ||
      a.name.toLowerCase().includes(bossName.toLowerCase())
    );
    return activity && activity.score > 0 ? activity.score : null;
  };

  const selectBoss = async (boss: BossInfo) => {
    setSelectedBoss(boss);
    setLoading(true);
    const requestId = ++activeRequest.current;
    const data = await fetchBossGuide(boss.wikiPage);
    if (requestId === activeRequest.current) {
      setGuide(data);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Boss Guides</h2>

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Boss list */}
        <div>
          <div className="flex flex-wrap gap-1 mb-3">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-2 py-0.5 rounded text-xs ${
                selectedCategory === "All"
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary"
              }`}
            >
              All
            </button>
            {BOSS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-xs ${
                  selectedCategory === cat
                    ? "bg-accent text-white"
                    : "bg-bg-secondary text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-0.5 max-h-[600px] overflow-y-auto">
            {filteredBosses.map((boss) => (
              <button
                key={boss.name}
                onClick={() => selectBoss(boss)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                  selectedBoss?.name === boss.name
                    ? "bg-accent/15 text-accent"
                    : "bg-bg-secondary hover:bg-bg-tertiary text-text-secondary"
                }`}
              >
                <img
                  src={bossIcon(boss.name)}
                  alt=""
                  className="w-6 h-6 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="font-medium text-text-primary text-xs">
                  {boss.name}
                </div>
                {boss.combatLevel && (
                  <div className="text-[10px] text-text-secondary">
                    Lvl {boss.combatLevel}
                    {boss.hitpoints ? ` · ${boss.hitpoints} HP` : ""}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Guide content */}
        <div>
          {!selectedBoss && (
            <p className="text-sm text-text-secondary">
              Select a boss to view its guide.
            </p>
          )}

          {loading && selectedBoss && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={bossIcon(selectedBoss.name)} alt="" className="w-10 h-10 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <h3 className="text-lg font-semibold">{selectedBoss.name}</h3>
                {selectedBoss.combatLevel && (
                  <span className="text-xs bg-bg-secondary px-2 py-1 rounded text-text-secondary">
                    Combat {selectedBoss.combatLevel}
                  </span>
                )}
                {selectedBoss.hitpoints && (
                  <span className="text-xs bg-danger/20 px-2 py-1 rounded text-danger">
                    {selectedBoss.hitpoints} HP
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary animate-pulse">Loading guide...</p>
            </div>
          )}

          {selectedBoss && !loading && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={bossIcon(selectedBoss.name)} alt="" className="w-10 h-10 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <h3 className="text-lg font-semibold">{selectedBoss.name}</h3>
                {selectedBoss.combatLevel && (
                  <span className="text-xs bg-bg-secondary px-2 py-1 rounded text-text-secondary">
                    Combat {selectedBoss.combatLevel}
                  </span>
                )}
                {selectedBoss.hitpoints && (
                  <span className="text-xs bg-danger/20 px-2 py-1 rounded text-danger">
                    {selectedBoss.hitpoints} HP
                  </span>
                )}
                {(() => {
                  const kc = getBossKc(selectedBoss.name);
                  return kc != null ? (
                    <span className="text-xs bg-success/15 text-success px-2 py-1 rounded">
                      Your KC: {kc.toLocaleString()}
                    </span>
                  ) : null;
                })()}
                <a
                  href={`https://oldschool.runescape.wiki/w/${selectedBoss.wikiPage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:text-accent-hover transition-colors ml-auto"
                >
                  Open Wiki →
                </a>
              </div>

              {guide.length === 0 && (
                <p className="text-sm text-text-secondary">
                  No guide data found. Check the{" "}
                  <a
                    href={`https://oldschool.runescape.wiki/w/${selectedBoss.wikiPage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Wiki page
                  </a>{" "}
                  directly.
                </p>
              )}

              <div className="space-y-4">
                {guide.map((section, i) => (
                  <div key={i} className="bg-bg-secondary rounded-lg p-4">
                    <h4 className="text-sm font-medium text-accent mb-2">
                      {section.title}
                    </h4>
                    <div
                      className="article-content text-sm text-text-secondary leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
