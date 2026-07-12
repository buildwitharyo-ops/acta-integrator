"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { cn } from "@/lib/utils";

export type FeatureItem = {
  key: string;
  icon: IconSvgElement;
  title: string;
  meta?: string;
  description: string;
  href: string;
  image: string | null;
  imageAlt: string;
};

export function FeatureCarousel({
  items,
  ctaLabel = "Lihat detail",
  interval = 4500,
  className,
}: {
  items: FeatureItem[];
  ctaLabel?: string;
  interval?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused || items.length <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % items.length), interval);
    return () => clearInterval(t);
  }, [reduce, paused, items.length, interval, active]);

  const current = items[active];
  if (!current) return null;

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Kategori perangkat"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
      className={cn("grid gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6", className)}
    >
      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => {
          const on = i === active;
          return (
            <button
              key={item.key}
              aria-current={on ? "true" : undefined}
              type="button"
              onClick={() => setActive(i)}
              onFocus={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "group relative flex items-center overflow-hidden rounded-[14px] border px-4 py-3.5 text-left transition-colors lg:flex-1",
                on ? "border-primary/45 bg-card" : "border-border hover:border-border hover:bg-card/60",
              )}
            >
              <span className="flex w-full items-center gap-3">
                <HugeiconsIcon
                  icon={item.icon}
                  size={22}
                  strokeWidth={1.5}
                  className={cn(
                    "shrink-0 transition-colors",
                    on ? "text-accent-text" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span
                  className={cn(
                    "heading-md flex-1 transition-colors",
                    on ? "text-accent-text" : "text-foreground/85 group-hover:text-foreground",
                  )}
                >
                  {item.title}
                </span>
                {item.meta ? <span className="mono-spec text-muted-foreground">{item.meta}</span> : null}
              </span>
              {on && !reduce && !paused ? (
                <motion.span
                  key={`${active}-progress`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: interval / 1000, ease: "linear" }}
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
                />
              ) : on ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/50" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[20px] bg-card ring-1 ring-border">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.key}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="relative aspect-[16/10]">
              {current.image ? (
                <Image src={current.image} alt={current.imageAlt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              ) : (
                <div className="texture-grid absolute inset-0 opacity-40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
              <CornerTicks />
            </div>
            <div className="p-6">
              {current.meta ? <p className="mono-spec text-muted-foreground">{current.meta}</p> : null}
              <p className="heading-lg mt-1">{current.title}</p>
              <p className="body-md mt-2 max-w-[52ch] text-muted-foreground">{current.description}</p>
              <Link
                href={current.href}
                className="mono-label mt-3 inline-flex min-h-[44px] items-center text-accent-text underline-offset-4 hover:underline"
              >
                {ctaLabel}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
