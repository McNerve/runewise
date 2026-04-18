// Inline SVG illustrations for onboarding steps.
// All use var(--color-accent) for the primary gold highlight.

export function RuneWiseLogo({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      {/* Outer rune border */}
      <polygon
        points="40,4 72,22 72,58 40,76 8,58 8,22"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        opacity="0.4"
      />
      <polygon
        points="40,12 64,26 64,54 40,68 16,54 16,26"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        opacity="0.25"
      />
      {/* Castle silhouette (reused from home icon) */}
      <g transform="translate(18, 18) scale(1.85)" fill="var(--color-accent)">
        <path d="M3 11v9h18v-9l-3-2V6h-2v1.7L12 5 8 7.7V6H6v3z" />
        <path d="M10.5 14.5h3v5.5h-3z" fill="var(--color-bg-primary, #0b0f17)" opacity="0.35" />
      </g>
      {/* Sparkle accents */}
      <circle cx="66" cy="16" r="1.5" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="14" cy="64" r="1.2" fill="var(--color-accent)" opacity="0.4" />
      <circle cx="70" cy="55" r="1" fill="var(--color-accent)" opacity="0.5" />
    </svg>
  );
}

export function WomIllustration({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
    >
      {/* Clock face */}
      <circle cx="36" cy="36" r="28" stroke="var(--color-accent)" strokeWidth="2" opacity="0.35" />
      <circle cx="36" cy="36" r="22" fill="var(--color-bg-tertiary, #181b25)" stroke="var(--color-accent)" strokeWidth="1.5" />
      {/* Hour/minute markers */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 36 + 17 * Math.sin(rad);
        const y1 = 36 - 17 * Math.cos(rad);
        const x2 = 36 + 20 * Math.sin(rad);
        const y2 = 36 - 20 * Math.cos(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            opacity="0.5"
          />
        );
      })}
      {/* Hour hand */}
      <line x1="36" y1="36" x2="36" y2="22" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1="36" y1="36" x2="46" y2="30" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      {/* Center dot */}
      <circle cx="36" cy="36" r="3" fill="var(--color-accent)" />
      {/* Progress arc */}
      <circle
        cx="36"
        cy="36"
        r="28"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeDasharray="105 70"
        strokeDashoffset="44"
        strokeLinecap="round"
        opacity="0.7"
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}

export function TempleIllustration({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
    >
      {/* Scroll body */}
      <rect x="14" y="20" width="44" height="36" rx="2" fill="var(--color-bg-tertiary, #181b25)" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.9" />
      {/* Scroll rollers */}
      <rect x="10" y="18" width="8" height="40" rx="4" fill="var(--color-bg-secondary, #242836)" stroke="var(--color-accent)" strokeWidth="1.5" />
      <rect x="54" y="18" width="8" height="40" rx="4" fill="var(--color-bg-secondary, #242836)" stroke="var(--color-accent)" strokeWidth="1.5" />
      {/* Log lines */}
      <line x1="20" y1="30" x2="52" y2="30" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="37" x2="52" y2="37" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="20" y1="44" x2="44" y2="44" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Checkmarks */}
      <path d="M20 30 L22 32 L26 27" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M20 37 L22 39 L26 34" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      {/* Gold seal */}
      <circle cx="50" cy="46" r="7" fill="var(--color-accent)" opacity="0.9" />
      <path d="M50 40 L51.5 44 L55.5 44 L52.3 46.5 L53.5 50.5 L50 48 L46.5 50.5 L47.7 46.5 L44.5 44 L48.5 44 Z" fill="var(--color-bg-primary, #0f1117)" opacity="0.6" />
    </svg>
  );
}

export function NotificationIllustration({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
    >
      {/* Bell body */}
      <path
        d="M36 10 C26 10 20 18 20 28 L20 44 L14 50 L58 50 L52 44 L52 28 C52 18 46 10 36 10Z"
        fill="var(--color-bg-tertiary, #181b25)"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      {/* Bell clapper */}
      <path d="M31 50 C31 53.3 33.2 56 36 56 C38.8 56 41 53.3 41 50" fill="var(--color-accent)" opacity="0.8" />
      {/* Notification dots */}
      <circle cx="54" cy="18" r="8" fill="var(--color-accent)" />
      <text x="54" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-bg-primary, #0f1117)">3</text>
      {/* Ripple */}
      <circle cx="36" cy="36" r="30" stroke="var(--color-accent)" strokeWidth="1" opacity="0.12" />
      <circle cx="36" cy="36" r="24" stroke="var(--color-accent)" strokeWidth="1" opacity="0.08" />
    </svg>
  );
}
