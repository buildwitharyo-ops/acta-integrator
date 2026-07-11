"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SignalMeterVariant = "divider" | "footer";

const VARIANTS: Record<
  SignalMeterVariant,
  { track: string; segments: { w: number; live?: boolean }[] }
> = {
  divider: {
    track: "h-0.5",
    segments: [{ w: 18 }, { w: 9 }, { w: 24 }, { w: 6 }, { w: 12 }],
  },
  footer: {
    track: "h-[3px]",
    segments: [
      { w: 16 },
      { w: 7 },
      { w: 21 },
      { w: 6 },
      { w: 13 },
      { w: 5, live: true },
      { w: 9 },
    ],
  },
};

export function SignalMeter({
  variant = "divider",
  className,
}: {
  variant?: SignalMeterVariant;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { track, segments } = VARIANTS[variant];

  return (
    <div className={cn("relative w-full bg-border", track, className)} aria-hidden>
      <div className="absolute inset-0 flex items-stretch gap-[3px]">
        {segments.map((seg, i) => (
          <motion.span
            key={i}
            data-reveal
            className={cn(
              "block h-full origin-left",
              seg.live ? "bg-status" : "bg-primary",
            )}
            style={{ width: `${seg.w}%` }}
            initial={reduced ? false : { scaleX: 0 }}
            whileInView={reduced ? undefined : { scaleX: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.08 }}
          />
        ))}
      </div>
    </div>
  );
}
