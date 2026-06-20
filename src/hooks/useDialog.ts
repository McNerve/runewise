import { useEffect, useRef } from "react";

/**
 * Keyboard + focus behaviour every modal needs: Escape closes it, and focus is
 * restored to whatever opened it when it unmounts. Pair with
 * `role="dialog" aria-modal="true"` and an `aria-label` on the dialog panel.
 */
export function useDialog(onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);
}
