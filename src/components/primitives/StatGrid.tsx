import type { ReactNode } from "react";

interface StatGridProps {
  columns?: 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
}

const COL_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-5",
  6: "grid-cols-3 sm:grid-cols-6",
};

export default function StatGrid({ columns = 4, children, className = "" }: StatGridProps) {
  return (
    <div className={`grid ${COL_CLASS[columns]} gap-3 ${className}`.trim()}>
      {children}
    </div>
  );
}
