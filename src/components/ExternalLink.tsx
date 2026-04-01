import { openExternal } from "../lib/openExternal";

interface ExternalLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function ExternalLink({ href, className, children }: ExternalLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openExternal(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      role="link"
    >
      {children}
    </a>
  );
}
