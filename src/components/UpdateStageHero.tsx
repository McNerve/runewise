import { motion } from "motion/react";

type UpdateStage = "available" | "downloading" | "ready" | "error";

interface UpdateStageHeroProps {
  stage: UpdateStage;
  progressPct?: number;
}

function ScrollHero() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-16 h-16"
      initial={{ scaleY: 0.2, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Scroll body */}
      <motion.rect
        x="12" y="14" width="40" height="36" rx="2"
        fill="var(--color-accent)"
        fillOpacity="0.15"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ transformOrigin: "32px 32px" }}
      />
      {/* Top rolled end */}
      <ellipse cx="32" cy="14" rx="20" ry="4" fill="var(--color-accent)" fillOpacity="0.25" stroke="var(--color-accent)" strokeWidth="1.5" />
      {/* Bottom rolled end */}
      <ellipse cx="32" cy="50" rx="20" ry="4" fill="var(--color-accent)" fillOpacity="0.25" stroke="var(--color-accent)" strokeWidth="1.5" />
      {/* Wax seal */}
      <motion.circle
        cx="32" cy="32" r="7"
        fill="var(--color-accent)"
        fillOpacity="0.9"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.35, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      />
      {/* Seal cross glyph */}
      <motion.path
        d="M32 27v10M27 32h10"
        stroke="var(--color-bg-primary, #1a1a1a)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.55, duration: 0.3 }}
      />
      {/* Rune glyphs */}
      {[22, 22, 38].map((x, i) => (
        <motion.line
          key={i}
          x1={x} y1={20 + i * 5} x2={x + 12} y2={20 + i * 5}
          stroke="var(--color-accent)"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeLinecap="round"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2 + i * 0.05 }}
          style={{ transformOrigin: `${x}px ${20 + i * 5}px` }}
        />
      ))}
    </motion.svg>
  );
}

function DownloadHero({ progressPct = 0 }: { progressPct?: number }) {
  const particles = [8, 18, 28, 38, 48, 58];
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-16 h-16"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Tablet body */}
      <rect x="14" y="8" width="36" height="48" rx="4"
        fill="var(--color-accent)" fillOpacity="0.12"
        stroke="var(--color-accent)" strokeWidth="1.5" />
      {/* Progress fill inside tablet */}
      <clipPath id="tablet-clip">
        <rect x="14" y="8" width="36" height="48" rx="4" />
      </clipPath>
      <rect
        x="14" y={8 + 48 * (1 - progressPct / 100)}
        width="36" height={48 * (progressPct / 100)}
        fill="var(--color-accent)" fillOpacity="0.2"
        clipPath="url(#tablet-clip)"
        style={{ transition: "y 0.3s, height 0.3s" }}
      />
      {/* Rune lines on tablet */}
      {[18, 26, 34, 42].map((y) => (
        <line key={y} x1="20" y1={y} x2="44" y2={y}
          stroke="var(--color-accent)" strokeOpacity="0.3"
          strokeWidth="1" strokeLinecap="round" />
      ))}
      {/* Animated chevrons flowing downward */}
      {particles.map((offset, i) => (
        <motion.path
          key={i}
          d="M26 0 L32 5 L38 0"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{
            y: [-8, 72],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: 1.4,
            delay: (offset / 60) * 1.4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </motion.svg>
  );
}

function ReadyHero() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-16 h-16"
    >
      {/* Bloom glow rings */}
      {[28, 22, 16].map((r, i) => (
        <motion.circle
          key={i}
          cx="32" cy="32" r={r}
          fill="var(--color-accent)"
          fillOpacity={0.06 - i * 0.015}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
        />
      ))}
      {/* Tablet */}
      <motion.rect
        x="16" y="10" width="32" height="44" rx="4"
        fill="var(--color-accent)" fillOpacity="0.18"
        stroke="var(--color-accent)" strokeWidth="1.5"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: "32px 32px" }}
      />
      {/* Checkmark */}
      <motion.path
        d="M22 32 L28 38 L42 24"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
      />
      {/* Cape swoosh */}
      <motion.path
        d="M12 52 Q20 42 32 48 Q44 54 52 44"
        stroke="var(--color-accent)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />
    </motion.svg>
  );
}

function ErrorHero() {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-16 h-16"
      animate={{ x: [0, -4, 4, -4, 4, -2, 2, 0] }}
      transition={{ duration: 0.55, delay: 0.15 }}
    >
      {/* Broken sigil circle */}
      <motion.circle
        cx="32" cy="32" r="18"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeDasharray="8 4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{ transformOrigin: "32px 32px" }}
      />
      {/* Left scimitar (rotated -30°) */}
      <motion.g
        style={{ transformOrigin: "32px 32px" }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: -30, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <path d="M26 18 Q20 26 22 34 Q24 40 30 42 L32 44"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Guard */}
        <path d="M26 34 Q28 32 30 34" stroke="var(--color-accent)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </motion.g>
      {/* Right scimitar (rotated +30°) */}
      <motion.g
        style={{ transformOrigin: "32px 32px" }}
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 30, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <path d="M38 18 Q44 26 42 34 Q40 40 34 42 L32 44"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Guard */}
        <path d="M38 34 Q36 32 34 34" stroke="var(--color-accent)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </motion.g>
      {/* Red tint crack */}
      <motion.path
        d="M32 14 L30 28 L34 32 L28 48"
        stroke="var(--color-danger, #ef4444)"
        strokeOpacity="0.5"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      />
    </motion.svg>
  );
}

export default function UpdateStageHero({ stage, progressPct = 0 }: UpdateStageHeroProps) {
  return (
    <div className="flex items-center justify-center w-16 h-16">
      {stage === "available" && <ScrollHero />}
      {stage === "downloading" && <DownloadHero progressPct={progressPct} />}
      {stage === "ready" && <ReadyHero />}
      {stage === "error" && <ErrorHero />}
    </div>
  );
}
