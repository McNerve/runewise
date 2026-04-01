import { useState } from "react";
import { BOSSES, BOSS_CATEGORIES, type BossInfo } from "../../lib/data/bosses";
import { apiFetch } from "../../lib/api/fetch";
import { getCached, setCache } from "../../lib/api/cache";
import ExternalLink from "../../components/ExternalLink";

const isTauri = "__TAURI_INTERNALS__" in window;
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

    // Fetch key sections (requirements, equipment, strategy)
    const targetSections = sections.filter((s) =>
      [
        "requirements",
        "suggested skills",
        "equipment",
        "inventory setups",
        "inventory",
        "fight overview",
        "strategy",
        "the fight",
        "mechanics",
      ].some((t) => s.line.toLowerCase().includes(t))
    );

    const guide: GuideSection[] = [];

    for (const section of targetSections.slice(0, 5)) {
      const textUrl = `${WIKI_API}?action=parse&page=${wikiPage}&prop=text&section=${section.number}&format=json`;
      const textRes = await apiFetch(textUrl);
      const textData = await textRes.json();
      const html = textData.parse?.text?.["*"] ?? "";

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Extract text content, strip excessive whitespace
      const text = (doc.body.textContent ?? "")
        .replace(/\[edit.*?\]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (text.length > 10) {
        guide.push({ title: section.line, content: text });
      }
    }

    setCache(cacheKey, guide);
    return guide;
  } catch {
    return [];
  }
}

export default function BossGuide() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBoss, setSelectedBoss] = useState<BossInfo | null>(null);
  const [guide, setGuide] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredBosses =
    selectedCategory === "All"
      ? BOSSES
      : BOSSES.filter((b) => b.category === selectedCategory);

  const selectBoss = async (boss: BossInfo) => {
    setSelectedBoss(boss);
    setLoading(true);
    const data = await fetchBossGuide(boss.wikiPage);
    setGuide(data);
    setLoading(false);
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
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedBoss?.name === boss.name
                    ? "bg-accent/15 text-accent"
                    : "bg-bg-secondary hover:bg-bg-tertiary text-text-secondary"
                }`}
              >
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

          {loading && (
            <p className="text-sm text-text-secondary">Loading guide...</p>
          )}

          {selectedBoss && !loading && (
            <div>
              <div className="flex items-center gap-3 mb-4">
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

              {guide.length === 0 && (
                <p className="text-sm text-text-secondary">
                  No guide data found. Check the{" "}
                  <ExternalLink
                    href={`https://oldschool.runescape.wiki/w/${selectedBoss.wikiPage}`}
                    className="text-accent hover:underline"
                  >
                    Wiki page
                  </ExternalLink>{" "}
                  directly.
                </p>
              )}

              <div className="space-y-4">
                {guide.map((section, i) => (
                  <div key={i} className="bg-bg-secondary rounded-lg p-4">
                    <h4 className="text-sm font-medium text-accent mb-2">
                      {section.title}
                    </h4>
                    <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                      {section.content.length > 1500
                        ? section.content.slice(0, 1500) + "..."
                        : section.content}
                    </p>
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
