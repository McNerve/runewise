/**
 * Requirements section — compact 1-column checklist.
 *
 * Detects quest names from prose and renders them as clickable chips.
 * Falls back to plain text for non-quest requirements.
 */
import { useCallback } from "react";
import { QUESTS } from "../../../lib/data/quests";

interface Requirement {
  text: string;
  questName?: string;
}

interface Props {
  html: string;
  onQuestClick?: (questName: string) => void;
}

// Normalise for fuzzy matching
function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

const QUEST_NAMES = QUESTS.map((q) => q.name);
const QUEST_NAMES_NORMALISED = QUEST_NAMES.map(normalise);

function detectQuestInText(text: string): string | undefined {
  const norm = normalise(text);
  // Direct match
  const exact = QUEST_NAMES_NORMALISED.findIndex((q) => norm === q);
  if (exact !== -1) return QUEST_NAMES[exact];

  // Substring: the quest name appears inside the requirement text
  const sub = QUEST_NAMES_NORMALISED.findIndex((q) => q.length > 4 && norm.includes(q));
  if (sub !== -1) return QUEST_NAMES[sub];

  return undefined;
}

function parseRequirements(html: string): Requirement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const items: Requirement[] = [];
  const seen = new Set<string>();

  function addItem(text: string) {
    const t = text.replace(/\s+/g, " ").replace(/^[•◦▪▸►●○◆◇\-–—]\s*/, "").trim();
    if (!t || t.length < 2 || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    items.push({ text: t, questName: detectQuestInText(t) });
  }

  // Try list items first
  const lis = doc.querySelectorAll("li");
  if (lis.length > 0) {
    lis.forEach((li) => addItem(li.textContent ?? ""));
    return items;
  }

  // Fall back to paragraphs
  const ps = doc.querySelectorAll("p");
  ps.forEach((p) => {
    const text = (p.textContent ?? "").trim();
    if (text.length > 0 && text.length < 300) addItem(text);
  });

  return items;
}

export default function RequirementsSection({ html, onQuestClick }: Props) {
  const requirements = parseRequirements(html);

  const handleQuestClick = useCallback(
    (questName: string) => {
      onQuestClick?.(questName);
    },
    [onQuestClick]
  );

  if (requirements.length === 0) {
    return (
      <div
        className="article-content text-sm leading-7 text-text-secondary"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <ul className="space-y-1.5" role="list">
      {requirements.map((req, idx) => (
        <li
          key={`${req.text ?? idx}-${idx}`}
          className="flex items-start gap-3 rounded-lg border border-border/40 bg-bg-primary/30 px-3 py-2.5"
        >
          {/* Bullet icon */}
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-border/60 bg-bg-secondary/50 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary/40" />
          </span>

          <span className="min-w-0 flex-1 text-sm leading-6 text-text-primary">
            {req.questName ? (
              <>
                {/* Show full text; embed quest chip inline */}
                {req.text}
                <button
                  type="button"
                  onClick={() => handleQuestClick(req.questName!)}
                  className="ml-2 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-accent hover:border-accent/50 hover:text-accent-hover transition-colors"
                >
                  Quest
                </button>
              </>
            ) : (
              req.text
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
