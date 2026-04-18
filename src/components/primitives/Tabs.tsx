export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number | null;
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export default function Tabs<T extends string = string>({
  tabs,
  active,
  onChange,
  className = "",
}: TabsProps<T>) {
  return (
    <div className={`flex gap-1.5 ${className}`.trim()}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            className={`relative rounded-xl border px-3.5 py-2 text-left transition ${
              isActive
                ? "border-accent/50 bg-accent/10"
                : "border-border bg-bg-primary/50 text-text-secondary hover:bg-bg-primary/70"
            }`}
          >
            {isActive && (
              <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
            )}
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold capitalize ${isActive ? "text-accent" : ""}`}>
                {tab.label}
              </span>
              {tab.count != null && tab.count > 0 && (
                <span
                  className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-accent/20 text-accent"
                      : "bg-bg-tertiary text-text-secondary"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
