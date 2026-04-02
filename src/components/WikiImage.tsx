import { useState } from "react";

interface WikiImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallback?: string;
}

export default function WikiImage({ src, alt = "", className = "w-4 h-4", fallback }: WikiImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  if (failed) {
    return fallback ? (
      <span className={`${className} rounded bg-bg-tertiary text-[9px] font-bold flex items-center justify-center text-text-secondary`}>
        {fallback}
      </span>
    ) : null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
