import { accuracyTone } from "../dpsVerdict";

interface AccuracyMeterProps {
  accuracy: number;
}

export function AccuracyMeter({ accuracy }: AccuracyMeterProps) {
  const { text, bar, label } = accuracyTone(accuracy);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="section-kicker">{label}</span>
        <span className={`num text-sm font-semibold ${text}`}>
          {(accuracy * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${bar}`}
          style={{ width: `${Math.min(accuracy * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
