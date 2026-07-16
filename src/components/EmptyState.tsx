import { Button } from "./primitives";

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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-subtle bg-bg-tertiary">
          <img
            src={icon}
            alt=""
            className="h-9 w-9 opacity-55"
            style={{ imageRendering: "pixelated" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      <h3 className="display-face text-base font-semibold text-text-primary mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}
