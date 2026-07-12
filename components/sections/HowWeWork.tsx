"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Step = { no?: string; title?: string; description?: string };

const DEFAULT_STEPS: Step[] = [
  {
    no: "01",
    title: "Consultation & System Design",
    description:
      "Kami mulai dari kebutuhan, bukan katalog. Site survey, analisis ruang & akustik, lalu desain sistem dan RAB transparan.",
  },
  {
    no: "02",
    title: "Installation & Integration",
    description:
      "Pemasangan rapi, terdokumentasi. Audio, visual, dan kontrol bekerja sebagai satu sistem yang mulus.",
  },
  {
    no: "03",
    title: "Equipment Supply",
    description:
      "Perangkat kelas profesional dari brand terpercaya, dipilih tepat ukuran untuk project Anda dan didukung after-sales.",
  },
  {
    no: "04",
    title: "Training & Maintenance",
    description:
      "Kami latih tim Anda mengoperasikan sistem, lalu mendampingi dengan dukungan teknis berkelanjutan.",
  },
];

// One relevant photo per step (design desk → integration/racks → pro AV gear → training).
const STEP_BG = [
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&q=80&auto=format&fit=crop",
];

export function HowWeWork({
  content,
}: {
  content: { headline?: string; steps?: Step[] };
}) {
  const steps = content.steps && content.steps.length > 0 ? content.steps : DEFAULT_STEPS;
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = steps.length;
  const no = (s: Step, i: number) => s.no ?? String(i + 1).padStart(2, "0");
  const tabId = (i: number) => `hww-tab-${i}`;
  const PANEL_ID = "hww-panel";

  useEffect(() => {
    if (reduce || paused || total <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % total), 1500);
    return () => clearInterval(t);
  }, [reduce, paused, total, active]);

  const current = steps[active] ?? steps[0];
  if (!current) return null;

  const onTabKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = active;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (active + 1) % total;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (active - 1 + total) % total;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = total - 1;
    else return;
    e.preventDefault();
    setActive(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <section className="dark relative isolate overflow-hidden bg-card text-foreground">
      <div className="absolute inset-0 -z-10">
        {STEP_BG.map((src, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === active % STEP_BG.length ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.6, ease: "easeInOut" }}
          >
            <Image src={src} alt="" fill sizes="100vw" className="object-cover" />
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/35" />
        <div className="texture-grid absolute inset-0 opacity-[0.05]" />
      </div>

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="container relative py-section"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono-label text-accent-text">HOW WE WORK</p>
            <h2 className="display-lg mt-3 max-w-[20ch]">
              {content.headline ?? "From Consultation to Handover."}
            </h2>
          </div>
          <p className="mono-spec text-muted-foreground">
            {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Tahapan kerja"
          aria-orientation="horizontal"
          onKeyDown={onTabKey}
          className="mt-8 flex flex-wrap gap-2.5"
        >
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={i}
                id={tabId(i)}
                role="tab"
                aria-selected={on}
                aria-controls={PANEL_ID}
                tabIndex={on ? 0 : -1}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium ring-1 ring-inset backdrop-blur-md transition-colors",
                  on
                    ? "bg-foreground/[0.16] text-foreground ring-foreground/45 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.28)]"
                    : "bg-foreground/[0.05] text-foreground/75 ring-foreground/15 hover:bg-foreground/[0.11] hover:text-foreground hover:ring-foreground/25",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    on ? "text-accent-text" : "text-accent-text/75",
                  )}
                >
                  {no(s, i)}
                </span>
                {s.title}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/15">
              <motion.div
                className="h-full origin-left bg-primary"
                initial={false}
                animate={{ scaleX: i <= active ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>

        <div className="mt-10 grid items-start gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
          <span className="font-mono text-[clamp(3.5rem,9vw,6rem)] font-medium leading-none tabular-nums text-primary/25">
            {no(current, active)}
          </span>
          <div
            role="tabpanel"
            id={PANEL_ID}
            aria-labelledby={tabId(active)}
            tabIndex={0}
            className="min-h-[7rem]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <p className="heading-lg">{current.title}</p>
                <p className="body-lg mt-3 max-w-[58ch] text-foreground/75">{current.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
