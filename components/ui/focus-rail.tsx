"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type FocusRailItem = {
  id: string | number;
  title: string;
  description?: string;
  imageSrc: string;
  href?: string;
  meta?: string;
};

interface FocusRailProps {
  items: FocusRailItem[];
  initialIndex?: number;
  loop?: boolean;
  autoPlay?: boolean;
  interval?: number;
  ariaLabel?: string;
  className?: string;
}

// Neutral gradient shown when an image is missing OR fails to load (rotted/blocked external URL),
// so a broken hotlink never paints a broken-image glyph on this centerpiece section.
const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='300'%20height='400'%3E%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%23222528'/%3E%3Cstop%20offset='1'%20stop-color='%230b0c0e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width='300'%20height='400'%20fill='url(%23g)'/%3E%3C/svg%3E";

function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const t = e.currentTarget;
  if (t.dataset.fb) return; // already swapped — avoid an onError loop
  t.dataset.fb = "1";
  t.src = FALLBACK_IMG;
}

/** Wrap indices (e.g. -1 becomes length-1). */
function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

// Base spring for spatial movement (x/z); bouncier spring for the center card's "tap" scale feedback.
const BASE_SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 1 } as const;
const TAP_SPRING = { type: "spring", stiffness: 450, damping: 18, mass: 1 } as const;

export function FocusRail({
  items,
  initialIndex = 0,
  loop = true,
  autoPlay = false,
  interval = 4000,
  ariaLabel = "Carousel",
  className,
}: FocusRailProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(initialIndex);
  const [isHovering, setIsHovering] = React.useState(false);
  const lastWheelTime = React.useRef<number>(0);

  const count = items.length;
  const activeIndex = wrap(0, count, active);
  const activeItem = items[activeIndex];

  const handlePrev = React.useCallback(() => {
    if (!loop && active === 0) return;
    setActive((p) => p - 1);
  }, [loop, active]);

  const handleNext = React.useCallback(() => {
    if (!loop && active === count - 1) return;
    setActive((p) => p + 1);
  }, [loop, active, count]);

  // Trackpad / wheel: HORIZONTAL intent only. Vertical wheel is left alone so the page keeps
  // scrolling past this section (never trap the reader in a full-height embedded rail).
  const onWheel = React.useCallback(
    (e: React.WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      const now = Date.now();
      if (now - lastWheelTime.current < 400) return; // debounce inertia
      if (Math.abs(e.deltaX) > 20) {
        if (e.deltaX > 0) handleNext();
        else handlePrev();
        lastWheelTime.current = now;
      }
    },
    [handleNext, handlePrev],
  );

  React.useEffect(() => {
    if (!autoPlay || isHovering || count <= 1 || reduce) return;
    const timer = setInterval(() => handleNext(), interval);
    return () => clearInterval(timer);
  }, [autoPlay, isHovering, handleNext, interval, count, reduce]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  // Swipe / drag.
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
  const onDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold) handleNext();
    else if (swipe > swipeConfidenceThreshold) handlePrev();
  };

  // Show far neighbours only when there are enough distinct items — otherwise -2/+2 wrap to the
  // same card on both sides and read as a duplicate.
  const visibleIndices = count >= 5 ? [-2, -1, 0, 1, 2] : count >= 3 ? [-1, 0, 1] : [0];

  if (!activeItem) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={cn(
        "group relative flex h-[600px] w-full select-none flex-col overflow-hidden overflow-x-hidden bg-neutral-950 text-white",
        "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E4A548]",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
    >
      {/* Background ambience — blurred, saturated crop of the active image. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`bg-${activeItem.id}`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeItem.imageSrc} onError={onImgError} alt="" className="h-full w-full object-cover blur-3xl saturate-200" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main stage. */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-4 md:px-8">
        <motion.div
          className="relative mx-auto flex h-[360px] w-full max-w-6xl cursor-grab items-center justify-center [perspective:1200px] active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
        >
          {visibleIndices.map((offset) => {
            const absIndex = active + offset;
            const index = wrap(0, count, absIndex);
            const item = items[index];
            if (!item) return null;
            if (!loop && (absIndex < 0 || absIndex >= count)) return null;

            const isCenter = offset === 0;
            const dist = Math.abs(offset);

            const xOffset = offset * 320;
            const zOffset = -dist * 180;
            const scale = isCenter ? 1 : 0.85;
            const rotateY = offset * -20;
            const opacity = isCenter ? 1 : Math.max(0.1, 1 - dist * 0.5);
            const blur = isCenter ? 0 : dist * 6;
            const brightness = isCenter ? 1 : 0.5;

            return (
              <motion.div
                key={absIndex}
                className={cn(
                  "absolute aspect-[3/4] w-[240px] rounded-2xl border-t border-white/20 bg-neutral-900 shadow-2xl transition-shadow duration-300 md:w-[300px]",
                  isCenter ? "z-20 shadow-white/10" : "z-10",
                )}
                initial={false}
                animate={{
                  x: xOffset,
                  z: zOffset,
                  scale,
                  rotateY,
                  opacity,
                  filter: `blur(${blur}px) brightness(${brightness})`,
                }}
                transition={reduce ? { duration: 0 } : { default: BASE_SPRING, scale: TAP_SPRING }}
                style={{ transformStyle: "preserve-3d" }}
                onClick={() => {
                  if (offset !== 0) setActive((p) => p + offset);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageSrc}
                  onError={onImgError}
                  alt={item.title}
                  className="pointer-events-none h-full w-full rounded-2xl object-cover"
                />
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/10 mix-blend-multiply" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Info + controls. */}
        <div className="pointer-events-auto mx-auto mt-10 flex w-full max-w-4xl flex-col items-center justify-between gap-6 md:mt-12 md:flex-row">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="flex h-32 flex-1 flex-col items-center justify-center text-center md:items-start md:text-left"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={reduce ? { duration: 0 } : { duration: 0.3 }}
                className="space-y-2"
              >
                {activeItem.meta && (
                  <span className="text-xs font-medium uppercase tracking-wider text-[#E4A548]">{activeItem.meta}</span>
                )}
                <h3 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{activeItem.title}</h3>
                {activeItem.description && <p className="max-w-md text-neutral-400">{activeItem.description}</p>}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-full bg-neutral-900/80 p-1 ring-1 ring-white/10 backdrop-blur-md">
              <button
                onClick={handlePrev}
                className="rounded-full p-3 text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-[40px] text-center font-mono text-xs text-neutral-500">
                {activeIndex + 1} / {count}
              </span>
              <button
                onClick={handleNext}
                className="rounded-full p-3 text-neutral-400 transition hover:bg-white/10 hover:text-white active:scale-95"
                aria-label="Berikutnya"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {activeItem.href && (
              <Link
                href={activeItem.href}
                className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
              >
                Explore
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
