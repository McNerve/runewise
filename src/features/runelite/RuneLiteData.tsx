import { useState, useEffect } from "react";
import { isTauri } from "../../lib/env";
import { checkRuneLiteExists } from "../../lib/runelite/reader";

type Status = "checking" | "not-desktop" | "not-found" | "found";

export default function RuneLiteData() {
  const [status, setStatus] = useState<Status>(() => isTauri ? "checking" : "not-desktop");

  useEffect(() => {
    if (!isTauri) return;
    checkRuneLiteExists().then((exists) => {
      setStatus(exists ? "found" : "not-found");
    });
  }, []);

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">RuneLite Integration</h2>

      {status === "checking" && (
        <div className="bg-bg-secondary rounded-lg p-6 text-center">
          <p className="text-sm text-text-secondary animate-pulse">Checking for RuneLite...</p>
        </div>
      )}

      {status === "not-desktop" && (
        <div className="bg-bg-secondary rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-2">Desktop Only</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            RuneLite integration reads local files from your computer.
            Download RuneWise for macOS or Windows to use this feature.
          </p>
        </div>
      )}

      {status === "not-found" && (
        <div className="bg-bg-secondary rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-2">RuneLite Not Found</p>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Could not find the RuneLite data directory at <code className="text-accent">~/.runelite/</code>.
          </p>
          <p className="text-xs text-text-secondary">
            Make sure RuneLite is installed and has been launched at least once.
          </p>
        </div>
      )}

      {status === "found" && (
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <p className="text-sm text-success font-medium">RuneLite detected</p>
            <p className="text-xs text-text-secondary mt-1">
              Found RuneLite data directory. Integration features are coming soon.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-secondary rounded-lg p-4 text-center opacity-50">
              <p className="text-sm font-medium mb-1">Bank Value</p>
              <p className="text-xs text-text-secondary">Coming soon</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4 text-center opacity-50">
              <p className="text-sm font-medium mb-1">Boss Loot</p>
              <p className="text-xs text-text-secondary">Coming soon</p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4 text-center opacity-50">
              <p className="text-sm font-medium mb-1">Supplies Used</p>
              <p className="text-xs text-text-secondary">Coming soon</p>
            </div>
          </div>

          <p className="text-xs text-text-secondary">
            Future updates will read your bank tags, boss loot history, and supply usage
            directly from RuneLite's local data files.
          </p>
        </div>
      )}
    </div>
  );
}
