import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigation } from "../../lib/NavigationContext";
import { sendNotification } from "../../lib/notify";
import { openExternal } from "../../lib/openExternal";
import { useSettings } from "../../hooks/useSettings";
import {
  RuneWiseLogo,
  WomIllustration,
  TempleIllustration,
  NotificationIllustration,
} from "./illustrations";
import { ONBOARDING_KEY, RSN_KEY } from "./constants";

export { ONBOARDING_KEY, RSN_KEY };

const TOTAL_STEPS = 6;

// Step dot indicator
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "w-5 h-2 bg-accent"
              : i < current
              ? "w-2 h-2 bg-accent/40"
              : "w-2 h-2 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

// ── Step 1: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex items-center justify-center w-28 h-28 rounded-2xl bg-accent/10 border border-accent/20">
        <RuneWiseLogo size={80} />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          Welcome to RuneWise
        </h1>
        <p className="text-base text-text-secondary max-w-sm mx-auto leading-relaxed">
          Your all-in-one OSRS companion. Let&apos;s get you set up in under a minute.
        </p>
      </div>
      <button
        onClick={onNext}
        className="mt-2 px-8 py-3 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded-xl transition-colors text-base"
      >
        Get started →
      </button>
    </div>
  );
}

// ── Step 2: RSN ──────────────────────────────────────────────────────────────
type RsnStatus = "idle" | "checking" | "valid" | "invalid";

function StepRsn({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState(() => localStorage.getItem(RSN_KEY) ?? "");
  const [status, setStatus] = useState<RsnStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (rsn: string) => {
    const trimmed = rsn.trim();
    if (!trimmed) {
      setStatus("idle");
      setError(null);
      return;
    }
    if (trimmed.length < 1 || trimmed.length > 12) {
      setStatus("invalid");
      setError("RSN must be 1–12 characters.");
      return;
    }
    setStatus("checking");
    setError(null);
    try {
      const url = `/api/hiscores/index_lite.json?player=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      if (res.ok) {
        setStatus("valid");
      } else {
        setStatus("invalid");
        setError("Player not found on Hiscores.");
      }
    } catch {
      // Network failure — accept optimistically so flow isn't blocked
      setStatus("valid");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setStatus("idle");
    setError(null);
  };

  const handleBlur = () => {
    if (value.trim()) validate(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) validate(value);
  };

  const isChecking = status === "checking";
  const canContinue = status === "valid" || (status === "idle" && value.trim().length > 0);

  const handleContinue = () => {
    if (!canContinue || isChecking) return;
    const trimmed = value.trim();
    localStorage.setItem(RSN_KEY, trimmed);
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          What&apos;s your RuneScape name?
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          RuneWise pulls your stats, boss KCs, and XP progress from public OSRS APIs. Nothing is stored server-side — just locally on this device.
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. Zezima"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={12}
            autoFocus
            className={`w-full px-4 py-3 pr-10 bg-bg-tertiary border rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-colors text-base ${
              status === "valid"
                ? "border-success focus:ring-success/30"
                : status === "invalid"
                ? "border-danger focus:ring-danger/30"
                : "border-border focus:ring-accent/30"
            }`}
          />
          {/* Status icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {status === "checking" && (
              <svg className="w-5 h-5 text-text-secondary animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            )}
            {status === "valid" && (
              <svg className="w-5 h-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {status === "invalid" && (
              <svg className="w-5 h-5 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleContinue}
          disabled={!canContinue || isChecking}
          className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded-xl transition-colors disabled:opacity-40"
        >
          Continue
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Wise Old Man ────────────────────────────────────────────────────
function StepWom({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <div className="shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20">
          <WomIllustration size={56} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Sync your progress via Wise Old Man
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            WOM tracks your XP gains, achievements, and personal records over time. It&apos;s free and independent — RuneWise reads your public data.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {[
          "XP gains per skill, per day/week/month/year",
          "Achievement milestones (first 99, first 200M, max total)",
          "Competitions and personal records",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <p className="text-xs text-text-secondary/60 border-t border-border/40 pt-3">
        RuneWise uses WOM&apos;s public API — no login required.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded-xl transition-colors"
        >
          I&apos;m already tracked
        </button>
        <button
          onClick={() => {
            openExternal("https://wiseoldman.net");
            onSkip();
          }}
          className="flex-1 py-2.5 border border-border hover:border-accent/40 text-text-primary rounded-xl transition-colors text-sm font-medium"
        >
          Open wiseoldman.net ↗
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Temple OSRS ─────────────────────────────────────────────────────
function StepTemple({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <div className="shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20">
          <TempleIllustration size={56} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Collection Log sync via Temple
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Temple tracks your collection log unlocks across bosses, raids, and clues. Sync lets RuneWise show your progress inline.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {[
          "1,699 collection log slots tracked",
          "Live sync from your Temple profile",
          "No login — Temple reads public RuneLite plugin data",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <p className="text-xs text-text-secondary/60 border-t border-border/40 pt-3">
        Requires the Temple OSRS RuneLite plugin. Install it from the RuneLite plugin hub.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => openExternal("https://templeosrs.com")}
          className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded-xl transition-colors"
        >
          Open templeosrs.com ↗
        </button>
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 border border-border hover:border-accent/40 text-text-primary rounded-xl transition-colors text-sm font-medium"
        >
          I&apos;ll set this up later
        </button>
      </div>
      <button
        onClick={onNext}
        className="text-xs text-text-secondary/60 hover:text-text-secondary transition-colors text-center"
      >
        Continue →
      </button>
    </div>
  );
}

// ── Step 5: Notifications ───────────────────────────────────────────────────
interface NotifToggles {
  priceAlerts: boolean;
  farming: boolean;
  stars: boolean;
  milestones: boolean;
}

function StepNotifications({
  onNext,
  onSkip,
}: {
  onNext: (toggles: NotifToggles) => void;
  onSkip: () => void;
}) {
  const [toggles, setToggles] = useState<NotifToggles>({
    priceAlerts: true,
    farming: true,
    stars: false,
    milestones: true,
  });
  const [permWarning, setPermWarning] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const toggle = (key: keyof NotifToggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleTest = async () => {
    try {
      await sendNotification("RuneWise", "Notifications are working!");
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch {
      setPermWarning(true);
    }
    if ("Notification" in window && Notification.permission === "denied") {
      setPermWarning(true);
    }
  };

  const rows: { key: keyof NotifToggles; label: string; desc: string }[] = [
    { key: "priceAlerts", label: "Watchlist price alerts", desc: "Notify when items hit your target prices" },
    { key: "farming", label: "Farming timer ready", desc: "Alert when your patches are ready to harvest" },
    { key: "stars", label: "Shooting star spawns", desc: "Frequent — off by default" },
    { key: "milestones", label: "XP milestone achievements", desc: "First 99s, 200M skills, and more" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <div className="shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20">
          <NotificationIllustration size={56} />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Stay in the loop
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            RuneWise can send you native desktop alerts when things happen.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-2.5 px-3 bg-bg-tertiary rounded-xl">
            <div>
              <div className="text-sm font-medium text-text-primary">{label}</div>
              <div className="text-xs text-text-secondary/70">{desc}</div>
            </div>
            <button
              role="switch"
              aria-checked={toggles[key]}
              aria-label={label}
              onClick={() => toggle(key)}
              className={`relative h-5 w-10 rounded-full transition-colors shrink-0 ${
                toggles[key] ? "bg-accent" : "bg-bg-secondary"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  toggles[key] ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {permWarning && (
        <p className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg border border-warning/20">
          Notification permission was denied. Enable it in System Settings to receive alerts.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleTest}
          className="px-4 py-2 text-sm border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
        >
          {testSent ? "Sent ✓" : "Test notification"}
        </button>
        <div className="flex-1 flex gap-3">
          <button
            onClick={() => onNext(toggles)}
            className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded-xl transition-colors"
          >
            Continue
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 6: Finish ───────────────────────────────────────────────────────────
function StepFinish({ onDone }: { onDone: () => void }) {
  const { navigate } = useNavigation();

  const tiles = [
    {
      icon: "💡",
      title: "Press Cmd+K to jump anywhere",
      desc: "Global search opens any tool instantly.",
      action: null as null | (() => void),
    },
    {
      icon: "🎯",
      title: "Check boss strategies",
      desc: "Open Boss Guides to find your next target.",
      action: () => { onDone(); navigate("bosses"); },
    },
    {
      icon: "⚔️",
      title: "Run the DPS Calculator",
      desc: "See which gear gives the best max hit.",
      action: () => { onDone(); navigate("dps-calc"); },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          You&apos;re all set
        </h2>
        <p className="text-sm text-text-secondary">
          Here are three things to try first.
        </p>
      </div>

      <div className="space-y-2">
        {tiles.map((tile) => (
          <div
            key={tile.title}
            onClick={tile.action ?? undefined}
            role={tile.action ? "button" : undefined}
            tabIndex={tile.action ? 0 : undefined}
            onKeyDown={tile.action ? (e) => { if (e.key === "Enter" || e.key === " ") tile.action?.(); } : undefined}
            className={`flex items-center gap-4 px-4 py-3 bg-bg-tertiary rounded-xl border border-border/50 ${
              tile.action
                ? "cursor-pointer hover:border-accent/40 hover:bg-bg-secondary transition-colors"
                : ""
            }`}
          >
            <span className="text-2xl">{tile.icon}</span>
            <div>
              <div className="text-sm font-semibold text-text-primary">{tile.title}</div>
              <div className="text-xs text-text-secondary">{tile.desc}</div>
            </div>
            {tile.action && (
              <span className="ml-auto text-accent text-sm">→</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onDone}
        className="py-3 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded-xl transition-colors text-base"
      >
        Enter RuneWise →
      </button>
    </div>
  );
}

// ── Main Welcome component ───────────────────────────────────────────────────
interface WelcomeProps {
  onDismiss: () => void;
}

export default function Welcome({ onDismiss }: WelcomeProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const { update: updateSettings } = useSettings();

  const markDone = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onDismiss();
  }, [onDismiss]);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleRsnNext = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleNotifNext = useCallback((toggles: NotifToggles) => {
    updateSettings({
      notifications: {
        priceAlerts: toggles.priceAlerts,
        farming: toggles.farming,
        stars: toggles.stars,
        milestones: toggles.milestones,
      },
    });
    goNext();
  }, [goNext, updateSettings]);

  const variants = {
    enter: (d: number) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -40, opacity: 0 }),
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to RuneWise"
    >
      <div className="relative w-full max-w-2xl bg-bg-primary rounded-2xl border border-border shadow-2xl p-8">
        {/* Skip link */}
        <button
          onClick={markDone}
          className="absolute top-4 right-4 text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
        >
          Skip setup
        </button>

        {/* Step dots */}
        <div className="flex items-center justify-between mb-6">
          <StepDots current={step} total={TOTAL_STEPS} />
          {step > 0 && (
            <button
              onClick={goBack}
              className="text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Step content with slide-fade transition */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {step === 0 && <StepWelcome onNext={goNext} />}
              {step === 1 && <StepRsn onNext={handleRsnNext} onSkip={goNext} />}
              {step === 2 && <StepWom onNext={goNext} onSkip={goNext} />}
              {step === 3 && <StepTemple onNext={goNext} onSkip={goNext} />}
              {step === 4 && <StepNotifications onNext={handleNotifNext} onSkip={goNext} />}
              {step === 5 && <StepFinish onDone={markDone} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
