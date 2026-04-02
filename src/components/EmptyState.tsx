interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <img
          src={icon}
          alt=""
          className="w-12 h-12 mb-4 opacity-30"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      <h3 className="text-base font-medium text-text-secondary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-secondary/60 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-1.5 rounded text-sm bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
