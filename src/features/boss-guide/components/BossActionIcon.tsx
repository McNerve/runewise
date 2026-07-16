import * as Tooltip from "@radix-ui/react-tooltip";

export default function BossActionIcon({
  label,
  icon,
  onClick,
  href,
}: {
  label: string;
  icon: string;
  onClick?: () => void;
  href?: string;
}) {
  const className = "boss-action-icon";
  const trigger = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {icon}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {icon}
    </button>
  );
  return (
    <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger asChild>{trigger}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip-content" side="bottom" sideOffset={6}>
          {label}
          <Tooltip.Arrow className="fill-bg-tertiary" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
