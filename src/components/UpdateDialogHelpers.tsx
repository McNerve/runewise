import { motion } from "motion/react";
import { type ChangelogSections, categorizeChangelog, parseChangelogFallback } from "../lib/changelog";

// ── UI helpers ────────────────────────────────────────────────────────────────

export function VersionChevron({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-1.5 mb-0.5">
      <span className="text-xs text-text-secondary/60 tabular-nums">v{from}</span>
      <svg viewBox="0 0 16 10" className="w-4 h-3" fill="none">
        <path d="M1 5h12M9 1l4 4-4 4" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-bold text-accent tabular-nums">v{to}</span>
    </div>
  );
}

const SECTION_ICONS: Record<keyof ChangelogSections, string> = {
  New: "✨", Fixed: "🔧", Improved: "⚡", Other: "•",
};

export function ChangelogView({ body }: { body: string | null }) {
  const sections = categorizeChangelog(body);
  if (!sections) {
    const items = parseChangelogFallback(body);
    if (!items.length) return null;
    return (
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-text-secondary">
            <span className="text-accent shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-3">
      {(Object.entries(sections) as [keyof ChangelogSections, string[]][])
        .filter(([, items]) => items.length > 0)
        .map(([section, items]) => (
          <div key={section}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary/50 mb-1">
              {SECTION_ICONS[section]} {section}
            </p>
            <ul className="space-y-1">
              {items.slice(0, 6).map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-secondary">
                  <span className="shrink-0 mt-0.5 text-text-secondary/40">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

export function CheckCircle() {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      fill="none"
      className="w-12 h-12"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.circle
        cx="24" cy="24" r="20"
        stroke="var(--color-accent)" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />
      <motion.path
        d="M14 24 L20 30 L34 18"
        stroke="var(--color-accent)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      />
    </motion.svg>
  );
}
