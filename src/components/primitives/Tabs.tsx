import { useCallback, useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem<Id extends string = string> {
  id: Id;
  label: string;
  icon?: ReactNode | string;
  count?: number | string;
  description?: string;
}

interface TabsProps<Id extends string> {
  items: readonly TabItem<Id>[];
  activeId: Id;
  onChange: (id: Id) => void;
  className?: string;
  /**
   * Variant controls visual density:
   * - "default": card-like with description line (Market-style)
   * - "compact": single-line underline pill (Profile-style) — use inside nested contexts
   */
  variant?: "default" | "compact";
  ariaLabel?: string;
}

export default function Tabs<Id extends string>({
  items,
  activeId,
  onChange,
  className = "",
  variant = "compact",
  ariaLabel,
}: TabsProps<Id>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const count = items.length;
      if (count === 0) return;
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = (index + 1) % count;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = (index - 1 + count) % count;
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = count - 1;
      } else {
        return;
      }
      event.preventDefault();
      const nextItem = items[next];
      onChange(nextItem.id);
      refs.current[nextItem.id]?.focus();
    },
    [items, onChange]
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {items.map((item, i) => {
        const active = item.id === activeId;
        if (variant === "default") {
          return (
            <button
              key={item.id}
              ref={(el) => { refs.current[item.id] = el; }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              title={item.description ?? item.label}
              className={`tab-pill ${active ? "tab-pill--active" : "tab-pill--inactive"}`}
            >
              {active && (
                <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
              )}
              <div className="flex items-center gap-1.5">
                {typeof item.icon === "string" ? (
                  <img
                    src={item.icon}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : item.icon}
                <span className={`text-xs font-semibold ${active ? "text-accent" : ""}`}>
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-medium ${
                      active ? "text-accent/70" : "text-text-secondary/60"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </div>
              {item.description && (
                <div
                  className={`hidden sm:block text-[11px] ${
                    active ? "text-accent/60" : "text-text-secondary/60"
                  }`}
                >
                  {item.description}
                </div>
              )}
            </button>
          );
        }

        // compact underline variant
        return (
          <button
            key={item.id}
            ref={(el) => { refs.current[item.id] = el; }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            title={item.label}
            className={`home-tile relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border ${
              active
                ? "text-accent bg-accent/10 border-accent/40"
                : "text-text-secondary border-transparent"
            }`}
          >
            {active && (
              <div className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-accent" />
            )}
            {typeof item.icon === "string" ? (
              <img
                src={item.icon}
                alt=""
                className="w-4 h-4"
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
