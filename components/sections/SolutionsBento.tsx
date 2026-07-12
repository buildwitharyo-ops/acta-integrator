"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Solution = {
  slug: string | null;
  name: string | null;
  tier: string | null;
  value_prop: string | null;
  hero_image_path: string | null;
  hero_image_url_ext: string | null;
  hero_image_alt: string | null;
};

const CORE_SPANS = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-8",
  "lg:col-span-4",
  "lg:col-span-12",
];
const CORE_SIZES = [
  "(min-width: 1024px) 58vw, 100vw",
  "(min-width: 1024px) 42vw, 100vw",
  "(min-width: 1024px) 67vw, 100vw",
  "(min-width: 1024px) 33vw, 100vw",
  "100vw",
];
const CORE_ANNOTATIONS: Record<string, string> = {
  "smart-meeting-room": "ONE-TOUCH JOIN",
  "auditorium-performance-hall": "RT60 0.6s",
  "divisible-room-multipurpose-hall": "ZONE A/B/C",
  "pa-commercial-sound-system": "100V LINE",
  "smart-classroom-training-room": "4K TOUCH",
};

export function SolutionsBento({
  content,
  solutions,
}: {
  content: { headline?: string; subheadline?: string };
  solutions: Solution[];
}) {
  const reduce = useReducedMotion();
  const core = solutions.filter((s) => s.tier === "core").slice(0, 5);
  const supporting = solutions.filter((s) => s.tier === "supporting").slice(0, 3);

  return (
    <section className="container py-section">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono-label text-accent-text">SOLUTIONS</p>
          <h2 className="display-lg mt-3 max-w-[16ch]">
            {content.headline ?? "A Solution for Every Space."}
          </h2>
        </div>
        <p className="body-lg max-w-[38ch] text-muted-foreground">
          {content.subheadline ??
            "Sistem terintegrasi yang dirancang sesuai karakter ruang dan cara organisasi Anda bekerja."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {core.map((s, i) => (
          <SolutionCard
            key={s.slug}
            solution={s}
            className={CORE_SPANS[i]}
            sizes={CORE_SIZES[i]}
            index={i}
            reduce={reduce}
          />
        ))}
      </div>

      {supporting.length > 0 ? (
        <div className="mt-4">
          <p className="mono-label mb-3 text-muted-foreground">Supporting</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {supporting.map((s, i) => (
              <SolutionCard key={s.slug} solution={s} index={i} compact reduce={reduce} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SolutionCard({
  solution,
  className,
  sizes,
  index,
  compact,
  reduce,
}: {
  solution: Solution;
  className?: string;
  sizes?: string;
  index: number;
  compact?: boolean;
  reduce: boolean | null;
}) {
  const img = mediaUrl({
    storage_path: solution.hero_image_path,
    external_url: solution.hero_image_url_ext,
  });
  const annotation = solution.slug ? CORE_ANNOTATIONS[solution.slug] : undefined;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { scale: 0.985, rotate: 0.3 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: "easeOut" }}
      className={cn(
        "dark group relative flex flex-col justify-end overflow-hidden rounded-[22px] bg-muted p-5 text-foreground",
        compact ? "min-h-[150px]" : "min-h-[240px]",
        className,
      )}
    >
      {img ? (
        <Image
          src={img}
          alt={solution.hero_image_alt ?? solution.name ?? "Solusi ACTA"}
          fill
          sizes={compact ? "(min-width: 640px) 33vw, 100vw" : (sizes ?? "(min-width: 1024px) 60vw, 100vw")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-[135%] bg-gradient-to-t from-background via-background/45 to-transparent transition-[height] duration-500 group-hover:h-full" />

      <div className="relative z-0 flex items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className={compact ? "heading-md" : "heading-lg"}>{solution.name}</p>
          {!compact && annotation ? (
            <span className="mono-spec w-fit rounded-md bg-foreground/15 px-2 py-0.5 text-foreground/90 backdrop-blur-md">
              {annotation}
            </span>
          ) : null}
          {!compact ? (
            <p className="body-sm line-clamp-1 text-foreground/70">{solution.value_prop}</p>
          ) : null}
        </div>
        <CardArrow />
      </div>

      <Link
        href={`/solutions/${solution.slug}`}
        aria-label={solution.name ?? "Solusi"}
        className="absolute inset-0 z-20 rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
    </motion.div>
  );
}

function CardArrow() {
  return (
    <HugeiconsIcon
      icon={ArrowRight01Icon}
      size={30}
      strokeWidth={1.5}
      className="shrink-0 text-foreground transition-transform duration-300 group-hover:translate-x-1.5"
    />
  );
}
