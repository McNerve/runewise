import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
  title?: string;
}

export default function StatCard({ label, value, icon, color, onClick, title }: StatCardProps) {
  const body = (
    <>
      {icon && <div className="flex items-center justify-center h-5 mb-1">{icon}</div>}
      <div className={`text-2xl font-bold tabular-nums ${color ?? ""}`.trim()}>{value}</div>
      <div className="text-xs text-text-secondary mt-0.5">{label}</div>
    </>
  );

  const base = "flex flex-col items-center text-center py-3 px-2 rounded-lg";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        title={title}
        className={`${base} transition-colors hover:bg-bg-secondary/50 cursor-pointer`}
      >
        {body}
      </button>
    );
  }

  return (
    <div title={title} className={base}>
      {body}
    </div>
  );
}
