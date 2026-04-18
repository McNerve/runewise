import { describe, it, expect } from "vitest";

// Re-implement the parser inline so we don't need to mount React
// (same logic as RequirementsSection.tsx — kept in sync)
import { QUESTS } from "../../../lib/data/quests";

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

const QUEST_NAMES = QUESTS.map((q) => q.name);
const QUEST_NAMES_NORMALISED = QUEST_NAMES.map(normalise);

function detectQuestInText(text: string): string | undefined {
  const norm = normalise(text);
  const exact = QUEST_NAMES_NORMALISED.findIndex((q) => norm === q);
  if (exact !== -1) return QUEST_NAMES[exact];
  const sub = QUEST_NAMES_NORMALISED.findIndex((q) => q.length > 4 && norm.includes(q));
  if (sub !== -1) return QUEST_NAMES[sub];
  return undefined;
}

function parseRequirements(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const items: Array<{ text: string; questName?: string }> = [];
  const seen = new Set<string>();

  function addItem(text: string) {
    const t = text.replace(/\s+/g, " ").replace(/^[•◦▪▸►●○◆◇\-–—]\s*/, "").trim();
    if (!t || t.length < 2 || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    items.push({ text: t, questName: detectQuestInText(t) });
  }

  const lis = doc.querySelectorAll("li");
  if (lis.length > 0) {
    lis.forEach((li) => addItem(li.textContent ?? ""));
    return items;
  }
  const ps = doc.querySelectorAll("p");
  ps.forEach((p) => {
    const text = (p.textContent ?? "").trim();
    if (text.length > 0 && text.length < 300) addItem(text);
  });
  return items;
}

describe("requirements parser", () => {
  it("extracts plain list items", () => {
    const html = `<ul><li>70 Ranged</li><li>85 Magic</li></ul>`;
    const result = parseRequirements(html);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("70 Ranged");
    expect(result[1].text).toBe("85 Magic");
  });

  it("strips bullet characters from text", () => {
    const html = `<ul><li>• 70 Ranged</li><li>▸ 85 Magic</li></ul>`;
    const result = parseRequirements(html);
    expect(result[0].text).toBe("70 Ranged");
    expect(result[1].text).toBe("85 Magic");
  });

  it("detects quest name exact match", () => {
    // Use a real quest from QUESTS data
    const questName = QUESTS[0].name;
    const html = `<ul><li>${questName}</li></ul>`;
    const result = parseRequirements(html);
    expect(result[0].questName).toBe(questName);
  });

  it("detects quest name embedded in prose", () => {
    const questName = QUESTS[0].name;
    const html = `<ul><li>Completion of ${questName} for access to the area</li></ul>`;
    const result = parseRequirements(html);
    expect(result[0].questName).toBe(questName);
  });

  it("returns undefined questName for non-quest text", () => {
    const html = `<ul><li>70 Prayer</li></ul>`;
    const result = parseRequirements(html);
    expect(result[0].questName).toBeUndefined();
  });

  it("deduplicates identical requirements", () => {
    const html = `<ul><li>70 Ranged</li><li>70 Ranged</li></ul>`;
    const result = parseRequirements(html);
    expect(result).toHaveLength(1);
  });

  it("falls back to paragraphs when no list items present", () => {
    const html = `<p>70 Ranged to equip the bow.</p><p>85 Magic for best spells.</p>`;
    const result = parseRequirements(html);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
