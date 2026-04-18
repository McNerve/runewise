import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { isTauri } from "../lib/env";
import { openExternal } from "../lib/openExternal";
import { onOpenUpdate, getUpdateMode, emitUpdateAvailable } from "../lib/updateBus";
import UpdateStageHero from "./UpdateStageHero";
import { VersionChevron, ChangelogView, CheckCircle } from "./UpdateDialogHelpers";

declare const __APP_VERSION__: string;

type UpdateStage = "hidden" | "available" | "downloading" | "ready" | "error";

const SNOOZE_KEY = "runewise_update_snoozed";
const REMIND_KEY = "runewise_update_remind_after";

interface UpdateInfo {
  version: string | null;
  body: string | null;
}

interface SpeedSample {
  ts: number;
  bytes: number;
}

export default function UpdateDialog() {
  const [stage, setStage] = useState<UpdateStage>("hidden");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ version: null, body: null });
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [speedBps, setSpeedBps] = useState(0);
  const [etaSec, setEtaSec] = useState<number | null>(null);
  // mode is read once on mount — changing it mid-session doesn't retroactively move the dialog
  const [mode] = useState<"modal" | "pill">(() => getUpdateMode());

  const updateRef = useRef<unknown>(null);
  const speedBuffer = useRef<SpeedSample[]>([]);

  // Auto-check on mount
  useEffect(() => {
    if (!isTauri) return;
    const timer = setTimeout(async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (!update) return;

        const snoozed = localStorage.getItem(SNOOZE_KEY);
        if (snoozed === update.version) return;

        const remindAfter = localStorage.getItem(REMIND_KEY);
        if (remindAfter && Date.now() < Number(remindAfter)) return;

        updateRef.current = update;
        setUpdateInfo({ version: update.version ?? null, body: update.body ?? null });

        if (mode === "modal") {
          setStage("available");
        } else {
          // Notify sidebar pill
          if (update.version) emitUpdateAvailable({ version: update.version });
        }
      } catch {
        // silent
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [mode]);

  // Listen for pill -> open events
  useEffect(() => {
    return onOpenUpdate(() => {
      if (updateRef.current) setStage("available");
    });
  }, []);

  const updateProgressStats = useCallback((current: number, total: number) => {
    const now = Date.now();
    speedBuffer.current.push({ ts: now, bytes: current });
    // Keep last 3 seconds of samples
    speedBuffer.current = speedBuffer.current.filter((s) => now - s.ts < 3000);
    if (speedBuffer.current.length >= 2) {
      const oldest = speedBuffer.current[0];
      const newest = speedBuffer.current[speedBuffer.current.length - 1];
      const elapsed = (newest.ts - oldest.ts) / 1000;
      const speed = elapsed > 0 ? (newest.bytes - oldest.bytes) / elapsed : 0;
      setSpeedBps(speed);
      if (speed > 0 && total > current) {
        setEtaSec(Math.ceil((total - current) / speed));
      }
    }
  }, []);

  const startDownload = useCallback(async () => {
    setStage("downloading");
    speedBuffer.current = [];
    setSpeedBps(0);
    setEtaSec(null);
    try {
      const update = updateRef.current as {
        downloadAndInstall: (
          cb: (event: { event: string; data: { contentLength?: number; chunkLength: number } }) => void
        ) => Promise<void>;
      } | null;
      if (!update) { setStage("error"); return; }

      let total = 0;
      let current = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          total = event.data.contentLength;
          setDownloadProgress({ current: 0, total });
        } else if (event.event === "Progress") {
          current += event.data.chunkLength;
          setDownloadProgress({ current, total });
          updateProgressStats(current, total);
        } else if (event.event === "Finished") {
          setStage("ready");
        }
      });
      setStage("ready");
    } catch {
      setStage("error");
    }
  }, [updateProgressStats]);

  const retryDownload = useCallback(async () => {
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateInfo({ version: update.version ?? null, body: update.body ?? null });
      }
    } catch {
      // use existing updateRef
    }
    startDownload();
  }, [startDownload]);

  const remindLater = useCallback(() => {
    localStorage.setItem(REMIND_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setStage("hidden");
  }, []);

  const skipVersion = useCallback(() => {
    if (updateInfo.version) {
      localStorage.setItem(SNOOZE_KEY, updateInfo.version);
    }
    setStage("hidden");
  }, [updateInfo.version]);

  const installAndRelaunch = useCallback(async () => {
    try {
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      setStage("error");
    }
  }, []);

  if (!isTauri) return null;
  if (stage === "hidden") return null;

  const progressPct =
    downloadProgress.total > 0
      ? (downloadProgress.current / downloadProgress.total) * 100
      : 0;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const formatSpeed = (bps: number) => {
    if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} MB/s`;
    if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} KB/s`;
    return `${bps} B/s`;
  };

  const formatEta = (sec: number) => {
    if (sec >= 120) return `~${Math.ceil(sec / 60)} min`;
    return `~${sec}s`;
  };

  const newVersion = updateInfo.version ?? "";
  const releaseNotesUrl = `https://github.com/McNerve/runewise/releases/tag/v${newVersion}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key="dialog"
          className="bg-bg-primary border border-border rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden"
          initial={{ opacity: 0, scale: 0.93, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait">
            {stage === "available" && (
              <motion.div
                key="available"
                className="p-8"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center mb-5">
                  <UpdateStageHero stage="available" />
                  <h2 className="text-lg font-bold text-text-primary mt-3">
                    New Version Available
                  </h2>
                  {newVersion && (
                    <VersionChevron from={__APP_VERSION__} to={newVersion} />
                  )}
                </div>

                {updateInfo.body && (
                  <div className="mb-5 max-h-44 overflow-y-auto">
                    <ChangelogView body={updateInfo.body} />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={startDownload}
                    className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={remindLater}
                    className="w-full py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors"
                  >
                    Remind me later
                  </button>
                  <button
                    onClick={skipVersion}
                    className="w-full py-1 text-xs text-text-secondary/50 hover:text-text-secondary transition-colors"
                  >
                    Skip v{newVersion}
                  </button>
                </div>
              </motion.div>
            )}

            {stage === "downloading" && (
              <motion.div
                key="downloading"
                className="p-8 flex flex-col items-center"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <UpdateStageHero stage="downloading" progressPct={progressPct} />

                <p className="text-sm text-text-primary font-medium mt-5 mb-1">
                  Downloading update...
                </p>
                <p className="text-xs text-text-secondary mb-1 tabular-nums">
                  {formatBytes(downloadProgress.current)} of {formatBytes(downloadProgress.total)}
                </p>
                {speedBps > 0 && (
                  <p className="text-xs text-text-secondary/60 tabular-nums mb-3">
                    {formatSpeed(speedBps)}
                    {etaSec !== null && <> · {formatEta(etaSec)}</>}
                  </p>
                )}

                {/* Progress bar with shimmer */}
                <div className="relative w-full h-2 bg-bg-tertiary rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                  <motion.div
                    className="absolute inset-y-0 w-16 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
                      opacity: 0.5,
                    }}
                    animate={{ x: ["-64px", "480px"] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <p className="text-[10px] text-text-secondary/40">
                  Download continues in the background if dismissed
                </p>
              </motion.div>
            )}

            {stage === "ready" && (
              <motion.div
                key="ready"
                className="p-8 flex flex-col items-center"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <UpdateStageHero stage="ready" />
                <div className="mt-5 mb-1 flex flex-col items-center">
                  <CheckCircle />
                </div>
                <p className="text-base font-semibold text-text-primary mt-3 mb-1">
                  Ready to Install
                </p>
                {newVersion && (
                  <VersionChevron from={__APP_VERSION__} to={newVersion} />
                )}
                <p className="text-xs text-text-secondary mt-1 mb-5">
                  Downloaded successfully.
                </p>

                <button
                  onClick={installAndRelaunch}
                  className="px-8 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors"
                >
                  Install and Relaunch
                </button>
                <button
                  onClick={() => openExternal(releaseNotesUrl)}
                  className="mt-2 text-xs text-text-secondary/50 hover:text-accent transition-colors"
                >
                  View full release notes
                </button>
              </motion.div>
            )}

            {stage === "error" && (
              <motion.div
                key="error"
                className="p-8 flex flex-col items-center"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <UpdateStageHero stage="error" />

                <p className="text-base font-semibold text-danger mt-5 mb-1">
                  Update Failed
                </p>
                <p className="text-sm text-text-secondary mb-5">
                  Download the latest version manually from GitHub.
                </p>

                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={retryDownload}
                    className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-on-accent text-sm font-medium transition-colors"
                  >
                    Try again
                  </button>
                  <div className="flex gap-2">
                    <a
                      href="https://github.com/McNerve/runewise/releases/latest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary text-sm transition-colors"
                    >
                      Download from GitHub
                    </a>
                    <button
                      onClick={() => setStage("hidden")}
                      className="flex-1 py-2 rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary text-sm transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
