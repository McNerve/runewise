import type { ReactNode } from "react";

interface StatGridProps {
  columns?: 2 | 3 | 4 | 5;
  children: ReactNode;
  className?: string;
}

const COLS: Record<NonNullable<StatGridProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-5",
};

export default function StatGrid({ columns = 4, children, className = "" }: StatGridProps) {
  return <div className={`grid ${COLS[columns]} gap-3 ${className}`}>{children}</div>;
}
