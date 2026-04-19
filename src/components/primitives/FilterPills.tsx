import type { ReactNode } from "react";

export interface FilterPillItem<Id extends string = string> {
  id: Id;
  label: string;
  count?: number | string;
  icon?: ReactNode | string;
}

interface FilterPillsProps<Id extends string> {
  items: readonly FilterPillItem<Id>[];
  activeKey: Id;
  onChange: (id: Id) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Standard filter pills — borderless/outlined depending on active state.
 * Matches the Clue Helper tier-row look and OSRS convention.
 */
export default function FilterPills<Id extends string>({
  items,
  activeKey,
  onChange,
  className = "",
  ariaLabel,
}: FilterPillsProps<Id>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex flex-wrap gap-1.5 ${className}`}
    >
      {items.map((item) => {
        const active = item.id === activeKey;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            title={item.label}
            className={`home-tile inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
              active
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-bg-primary/50 text-text-secondary"
            }`}
          >
            {typeof item.icon === "string" ? (
              <img
                src={item.icon}
                alt=""
                className="w-3.5 h-3.5"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : item.icon}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-accent/70" : "text-text-secondary/50"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
