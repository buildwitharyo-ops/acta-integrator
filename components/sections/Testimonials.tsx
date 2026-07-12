"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type Testimonial = { quote: string; name: string; role: string };

// Placeholder social proof (English voice, Indonesian names) tuned to ACTA's real
// value props — integration, consultative sizing, acoustics, reliability, install
// quality, after-sales, training, transparent RAB, commercial PA. Owner replaces
// with real quotes once a testimonials CMS table exists.
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We used to juggle three different vendors for audio, display, and control. ACTA delivered all of it as one system that simply works — our meeting rooms finally feel effortless.",
    name: "Budi Santoso",
    role: "Operations Manager",
  },
  {
    quote:
      "They started with how our teams actually work, not with a product catalog. The system was sized exactly right — nothing wasted, nothing missing.",
    name: "Siti Rahmawati",
    role: "IT Director",
  },
  {
    quote:
      "Every seat in our auditorium hears clearly now, from the front row to the very back. You can tell the acoustics were engineered, not guessed.",
    name: "Ahmad Fauzi",
    role: "Facility Manager",
  },
  {
    quote:
      "One button and the room is ready. Our staff stopped calling IT before every client call — the AV just works.",
    name: "Dewi Lestari",
    role: "Office Manager",
  },
  {
    quote:
      "Clean cabling, on-time handover, and documentation for everything. It's the most professional installation this building has had.",
    name: "Rizky Pratama",
    role: "General Manager",
  },
  {
    quote:
      "When we needed help they responded fast, often fixing things remotely. The support didn't stop at handover.",
    name: "Putri Anggraini",
    role: "Building Manager",
  },
  {
    quote:
      "They trained our team until everyone was confident running the system alone. We're no longer dependent on a vendor to operate our own rooms.",
    name: "Hendra Gunawan",
    role: "Head of Operations",
  },
  {
    quote:
      "The proposal was transparent down to each line item. We knew exactly what we were paying for and why — no surprises mid-project.",
    name: "Maya Sari",
    role: "Procurement Lead",
  },
  {
    quote:
      "Our paging and background music now cover the entire building evenly, and announcements are actually intelligible. Exactly what we specified.",
    name: "Fajar Ramadhan",
    role: "Property Manager",
  },
];

const COLUMNS = [
  { items: TESTIMONIALS.slice(0, 3), duration: 34, direction: "up" as const, className: "" },
  { items: TESTIMONIALS.slice(3, 6), duration: 46, direction: "down" as const, className: "hidden md:flex" },
  { items: TESTIMONIALS.slice(6, 9), duration: 40, direction: "up" as const, className: "hidden lg:flex" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Card({ t, clone }: { t: Testimonial; clone?: boolean }) {
  return (
    <figure
      aria-hidden={clone || undefined}
      className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_hsl(220_6%_10%/0.04)]"
    >
      <blockquote className="body-md text-foreground/85">{t.quote}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
        >
          {initials(t.name)}
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-foreground">{t.name}</span>
          <span className="block text-xs text-muted-foreground">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function Column({
  items,
  duration,
  direction,
  reduce,
  paused,
  className,
}: {
  items: Testimonial[];
  duration: number;
  direction: "up" | "down";
  reduce: boolean | null;
  paused: boolean;
  className?: string;
}) {
  if (reduce) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        {items.map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-col will-change-transform animate-scroll-y [&>*]:mb-4",
        direction === "down" && "[animation-direction:reverse]",
        className,
      )}
      style={{ animationDuration: `${duration}s`, animationPlayState: paused ? "paused" : "running" }}
    >
      {items.map((t, i) => (
        <Card key={i} t={t} />
      ))}
      {items.map((t, i) => (
        <Card key={`clone-${i}`} t={t} clone />
      ))}
    </div>
  );
}

export function Testimonials() {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const frozen = paused || hovering;

  return (
    <section className="relative overflow-hidden py-section">
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_58%_60%_at_center,black,transparent)]" />
      <div className="container relative">
        <div className="mx-auto max-w-[640px] text-center">
          <span className="mono-label inline-block rounded-pill border border-border px-4 py-1.5 text-muted-foreground">
            Testimonials
          </span>
          <h2 className="display-lg mt-5">What our users say</h2>
          <p className="body-lg mt-4 text-muted-foreground">
            Umpan balik nyata dari tim yang menjalankan ruang mereka dengan sistem buatan ACTA.
          </p>
        </div>

        {!reduce ? (
          <div className="mt-7 flex justify-center">
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
              className="mono-label inline-flex items-center gap-2 rounded-pill border border-border px-4 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={13} strokeWidth={2} />
              {paused ? "Play" : "Pause"}
            </button>
          </div>
        ) : null}

        <div
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocusCapture={() => setHovering(true)}
          onBlurCapture={() => setHovering(false)}
          className={cn(
            "mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
            !reduce &&
              "h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]",
          )}
        >
          {COLUMNS.map((col, i) => (
            <Column
              key={i}
              items={col.items}
              duration={col.duration}
              direction={col.direction}
              reduce={reduce}
              paused={frozen}
              className={col.className}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
