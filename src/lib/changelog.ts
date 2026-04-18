export interface ChangelogSections {
  New: string[];
  Fixed: string[];
  Improved: string[];
  Other: string[];
}

export function categorizeChangelog(body: string | null): ChangelogSections | null {
  if (!body) return null;
  const lines = body
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter((l) => l.length > 3);

  const sections: ChangelogSections = { New: [], Fixed: [], Improved: [], Other: [] };
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^feat[:(]/.test(lower)) {
      sections.New.push(line.replace(/^feat[^:]*:\s*/i, ""));
    } else if (/^fix[:(]/.test(lower)) {
      sections.Fixed.push(line.replace(/^fix[^:]*:\s*/i, ""));
    } else if (/^(refactor|perf|chore)[:(]/.test(lower)) {
      sections.Improved.push(line.replace(/^(refactor|perf|chore)[^:]*:\s*/i, ""));
    } else {
      sections.Other.push(line);
    }
  }
  const hasCategorised =
    sections.New.length + sections.Fixed.length + sections.Improved.length > 0;
  return hasCategorised ? sections : null;
}

export function parseChangelogFallback(body: string | null): string[] {
  if (!body) return [];
  return body
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, 8);
}
