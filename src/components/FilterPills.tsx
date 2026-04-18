interface FilterPillsProps<T extends string> {
  options: readonly T[];
  selected: T;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
  activeColor?: string;
}

export default function FilterPills<T extends string>({
  options,
  selected,
  onChange,
  labels,
  activeColor = "bg-accent text-white",
}: FilterPillsProps<T>) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            selected === option
              ? activeColor
              : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
          }`}
        >
          {labels?.[option] ?? option}
        </button>
      ))}
    </div>
  );
}
