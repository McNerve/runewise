/**
 * Soft prompt when tools that personalize from hiscores have no RSN loaded.
 * Keeps the player bar as the single entry point (no second RSN form).
 */
export default function AccountPrefillBanner({
  hasHiscores,
  context,
}: {
  hasHiscores: boolean;
  /** Short phrase: "combat levels", "kill counts", "skill XP", etc. */
  context: string;
}) {
  if (hasHiscores) return null;

  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/8 px-3 py-2.5 text-xs leading-relaxed text-text-secondary"
    >
      <span className="mt-0.5 shrink-0 font-semibold uppercase tracking-wider text-accent">
        Account
      </span>
      <span>
        Set your RSN in the bar above to auto-fill {context}. Everything still
        works with manual values if you prefer.
      </span>
    </div>
  );
}
