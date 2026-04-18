interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ label, value, color = "text-success" }: StatCardProps) {
  return (
    <div className="bg-bg-tertiary rounded-lg p-4 text-center">
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
