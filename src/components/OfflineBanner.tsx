import { useEffect, useState } from "react";

/**
 * Desktop-aware offline indicator. Cached GE/hiscores still work; live tools
 * (stars, wiki fetches, price refresh) will fail until connectivity returns.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine === false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="shrink-0 border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-warning"
    >
      You&apos;re offline. Cached prices and hiscores still work; live tools will
      update when the connection returns.
    </div>
  );
}
