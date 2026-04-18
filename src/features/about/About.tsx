declare const __APP_VERSION__: string;

export default function About() {
  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold tracking-tight mb-4">About RuneWise</h2>

      <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
        <div className="text-2xl font-bold mb-1">RuneWise</div>
        <div className="text-sm text-text-secondary mb-3">
          v{__APP_VERSION__} — OSRS Desktop Companion
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          A lightweight companion app for Old School RuneScape. All the tools
          you need in one place — no browser tabs, no ads, no bloat.
        </p>
      </div>

      <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Data Sources
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <a href="https://oldschool.runescape.wiki/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
              OSRS Wiki
            </a>
            <span className="text-text-secondary">CC BY-NC-SA 3.0</span>
          </div>
          <div className="flex justify-between">
            <a href="https://wiseoldman.net/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
              Wise Old Man
            </a>
            <span className="text-text-secondary">MIT</span>
          </div>
          <div className="flex justify-between">
            <a href="https://secure.runescape.com/m=hiscore_oldschool/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
              OSRS Hiscores
            </a>
            <span className="text-text-secondary">Jagex</span>
          </div>
        </div>
      </div>

      <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Links
        </h3>
        <div className="space-y-2 text-sm">
          <a href="https://github.com/McNerve/runewise" target="_blank" rel="noopener noreferrer" className="block text-accent hover:text-accent-hover">
            GitHub Repository
          </a>
          <a href="https://github.com/McNerve/runewise/issues" target="_blank" rel="noopener noreferrer" className="block text-accent hover:text-accent-hover">
            Report a Bug
          </a>
          <a href="https://github.com/McNerve/runewise/releases" target="_blank" rel="noopener noreferrer" className="block text-accent hover:text-accent-hover">
            Release Notes
          </a>
        </div>
      </div>

      <p className="text-xs text-text-secondary/50 leading-relaxed">
        RuneWise is not affiliated with or endorsed by Jagex Ltd. Old School
        RuneScape is a trademark of Jagex Ltd. Licensed under MIT.
      </p>
    </div>
  );
}
