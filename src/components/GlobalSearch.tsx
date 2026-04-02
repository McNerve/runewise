import { Suspense, lazy, useEffect, useState } from "react";

const SearchDialog = lazy(() => import("./SearchDialog"));
const OPEN_SEARCH_EVENT = "runewise:open-search";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    const openHandler = () => setOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener(OPEN_SEARCH_EVENT, openHandler);
    };
  }, []);

  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <SearchDialog onClose={() => setOpen(false)} />
    </Suspense>
  );
}
