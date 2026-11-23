"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { usePreviewPlayback } from "@/components/sections/usePreviewPlayback";
import { useHomeReducedMotion } from "@/components/sections/useHomeReducedMotion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { CornerTicks } from "@/components/shared/CornerTicks";
import styles from "./feature-carousel.module.css";
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
  ctaLabel = "View details",
  interval = 4500,
  className,
}: {
  items: FeatureItem[];
  ctaLabel?: string;
  interval?: number;
  className?: string;
}) {
  const reduce = useHomeReducedMotion();
  const previewId = useId();
  const carousel = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { paused, suspended, controlProps, regionProps } = usePreviewPlayback();

  useEffect(() => {
    if (reduce || suspended || items.length <= 1) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % items.length), interval);
    return () => window.clearTimeout(timer);
  }, [reduce, suspended, items.length, interval, active]);

  const current = items[active] ?? items[0];
  if (!current) return null;

  return (
    <div
      ref={carousel}
      role="group"
      aria-roledescription="carousel"
      aria-label="Equipment categories"
      {...regionProps}
      className={cn("grid min-w-0 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-stretch md:gap-8 lg:gap-12", className)}
    >
      <div className="flex min-w-0 flex-col">
        <div className="divide-y divide-border border-y border-border">
          {items.map((item, index) => {
            const selected = current.key === item.key;
            return (
              <div
                key={item.key}
                onFocusCapture={() => setActive(index)}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse" && !carousel.current?.contains(document.activeElement)) {
                    setActive(index);
                  }
                }}
                onPointerMove={(event) => {
                  // Focus can scroll a different row under a stationary pointer.
                  if (event.pointerType === "mouse" && (event.movementX || event.movementY)) {
                    setActive(index);
                  }
                }}
                className={cn("relative flex items-stretch", selected && "bg-accent/65")}
              >
                <button
                  type="button"
                  aria-label={`Preview ${item.title}`}
                  aria-controls={previewId}
                  aria-current={selected || undefined}
                  onClick={() => setActive(index)}
                  className="group flex min-h-14 min-w-0 flex-1 items-center gap-2.5 px-2 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-3 sm:px-3"
                >
                  <HugeiconsIcon aria-hidden="true" icon={item.icon} size={19} strokeWidth={1.5} className={cn("shrink-0", selected ? "text-accent-text" : "text-muted-foreground")} />
                  <span className={cn("font-display text-base leading-snug", selected ? "font-semibold" : "font-medium")}>{item.title}</span>
                  {item.meta && <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">{item.meta}</span>}
                </button>
                <Link
                  href={item.href}
                  aria-label={`Browse ${item.title} products`}
                  className="inline-flex min-h-11 w-11 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <HugeiconsIcon aria-hidden="true" icon={ArrowUpRight01Icon} size={17} />
                </Link>
                {selected && (
                  !reduce && !suspended ? (
                    <motion.span
                      key={`${item.key}-progress`}
                      aria-hidden="true"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: interval / 1000, ease: "linear" }}
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
                    />
                  ) : <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                )}
              </div>
            );
          })}
        </div>
        {!reduce && items.length > 1 && (
          <button
            type="button"
            aria-label={paused ? "Play catalog preview" : "Pause catalog preview"}
            {...controlProps}
            className="mt-1 inline-flex min-h-11 w-fit items-center gap-2 px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-ring"
          >
            <HugeiconsIcon aria-hidden="true" icon={paused ? PlayIcon : PauseIcon} size={14} />
            {paused ? "Play preview" : "Pause preview"}
          </button>
        )}
      </div>

      <div id={previewId} className={styles.preview}>
        <div className={styles.stage} data-catalog-stage>
          <motion.div
            key={current.key}
            initial={reduce ? false : { opacity: 0.15 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            {current.image ? (
              <Image
                src={current.image}
                alt={current.imageAlt}
                fill
                sizes="(min-width: 1280px) 740px, (min-width: 768px) 60vw, 100vw"
                className={styles.equipment}
              />
            ) : (
              <HugeiconsIcon aria-hidden="true" icon={current.icon} size={64} strokeWidth={1} />
            )}
          </motion.div>
          <CornerTicks className="inset-3" />
        </div>
        <div className="grid gap-3 border-t border-border px-1 pt-5 sm:grid-cols-[1fr_auto] sm:items-start md:pt-6">
          <div className="min-w-0">
            <h3 className="heading-lg">{current.title}</h3>
            {current.description && <p className="body-sm mt-1 max-w-[48ch] text-muted-foreground">{current.description}</p>}
          </div>
          <Link href={current.href} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-foreground underline decoration-primary underline-offset-4 focus-visible:outline-ring">
            {ctaLabel}<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
