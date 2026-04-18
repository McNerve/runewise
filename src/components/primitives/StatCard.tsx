import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  accent?: boolean;
  tone?: "default" | "success" | "danger" | "warning";
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-text-primary",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
};

export default function StatCard({ label, value, accent = false, tone = "default" }: StatCardProps) {
  const valueColor = accent ? "text-accent" : TONE_CLASSES[tone];
  return (
    <div className="rounded-xl border border-border/60 bg-bg-primary/45 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-text-secondary/45">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${valueColor}`}>{value}</div>
    </div>
  );
}
