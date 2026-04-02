import { useState, useEffect, useCallback } from "react";
import { isTauri } from "../lib/env";
import AppIcon from "./AppIcon";

type UpdateStage = "hidden" | "available" | "downloading" | "ready" | "error";

interface UpdateInfo {
  version: string | null;
  body: string | null;
}

export default function UpdateDialog() {
  const [stage, setStage] = useState<UpdateStage>("hidden");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ version: null, body: null });
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  // Auto-check on mount (5 second delay to not block startup)
  useEffect(() => {
    if (!isTauri) return;
    const timer = setTimeout(async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update) {
          setUpdateInfo({
            version: update.version ?? null,
            body: update.body ?? null,
          });
          setStage("available");
        }
      } catch {
        // Silent fail on auto-check
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const startDownload = useCallback(async () => {
    setStage("downloading");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setStage("error");
        return;
      }

      let total = 0;
      let current = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          total = event.data.contentLength;
          setDownloadProgress({ current: 0, total });
        } else if (event.event === "Progress") {
          current += event.data.chunkLength;
          setDownloadProgress({ current, total });
        } else if (event.event === "Finished") {
          setStage("ready");
        }
      });

      setStage("ready");
    } catch {
      setStage("error");
    }
  }, []);

  const installAndRelaunch = useCallback(async () => {
    try {
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      setStage("error");
    }
  }, []);

  if (stage === "hidden") return null;

  const progressPct = downloadProgress.total > 0
    ? (downloadProgress.current / downloadProgress.total) * 100
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const parseChangelog = (body: string | null): string[] => {
    if (!body) return [];
    return body
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter((line) => line.length > 5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-primary border border-border rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden">

        {/* Available stage — announcement with changelog */}
        {stage === "available" && (
          <div className="p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 mb-4">
                <AppIcon view="home" className="w-16 h-16" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">
                New Version Available
              </h2>
              {updateInfo.version && (
                <p className="text-sm text-text-secondary mt-1">
                  Version {updateInfo.version}
                </p>
              )}
            </div>

            {updateInfo.body && (
              <div className="mb-6 max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {parseChangelog(updateInfo.body).slice(0, 8).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-accent shrink-0 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={startDownload}
                className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-colors"
              >
                Download
              </button>
              <button
                onClick={() => setStage("hidden")}
                className="w-full py-2 rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors"
              >
                Remind me Later
              </button>
            </div>
          </div>
        )}

        {/* Downloading stage — progress bar */}
        {stage === "downloading" && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-14 h-14 mb-6">
              <AppIcon view="home" className="w-14 h-14" />
            </div>

            <p className="text-sm text-text-primary font-medium mb-4 tabular-nums">
              {formatBytes(downloadProgress.current)} of {formatBytes(downloadProgress.total)}
            </p>

            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <button
              onClick={() => setStage("hidden")}
              className="px-6 py-2 rounded-lg bg-bg-secondary border border-border text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Ready stage — install button */}
        {stage === "ready" && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-14 h-14 mb-6">
              <AppIcon view="home" className="w-14 h-14" />
            </div>

            <p className="text-base font-semibold text-text-primary mb-4">
              Ready to Install
            </p>

            <div className="w-full h-2 bg-accent rounded-full mb-6" />

            <button
              onClick={installAndRelaunch}
              className="px-8 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-colors"
            >
              Install and Relaunch
            </button>
          </div>
        )}

        {/* Error stage */}
        {stage === "error" && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-14 h-14 mb-6">
              <AppIcon view="home" className="w-14 h-14" />
            </div>

            <p className="text-base font-semibold text-danger mb-2">
              Update Failed
            </p>
            <p className="text-sm text-text-secondary mb-6">
              Please try again later or download manually from GitHub.
            </p>

            <button
              onClick={() => setStage("hidden")}
              className="px-6 py-2 rounded-lg bg-bg-secondary border border-border text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
