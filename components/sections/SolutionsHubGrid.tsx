"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { mediaUrl } from "@/lib/media";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type HubSolution = {
  slug: string | null;
  name: string | null;
  tier: string | null;
  value_prop: string | null;
  hero_image_path: string | null;
  hero_image_url_ext: string | null;
  hero_image_alt: string | null;
  hero_annotations: unknown;
};

function firstAnnotation(raw: unknown): string | undefined {
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === "object" && "label" in raw[0]) {
    const label = (raw[0] as { label?: unknown }).label;
    return typeof label === "string" ? label : undefined;
  }
  return undefined;
}

export function SolutionsHubGrid({ solutions }: { solutions: HubSolution[] }) {
  const reduce = useReducedMotion();
  const core = solutions.filter((s) => s.tier === "core");
  const supporting = solutions.filter((s) => s.tier === "supporting");

  return (
    <div className="mt-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {core.map((s, i) => (
          <SolutionCard
            key={s.slug}
            solution={s}
            index={i}
            reduce={reduce}
            className={i < 2 ? "lg:col-span-3" : "lg:col-span-2"}
            sizes={i < 2 ? "(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            annotation={firstAnnotation(s.hero_annotations)}
          />
        ))}
      </div>

      {supporting.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {supporting.map((s, i) => (
            <SolutionCard
              key={s.slug}
              solution={s}
              index={i}
              reduce={reduce}
              compact
              className="lg:col-span-2"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SolutionCard({
  solution,
  className,
  sizes,
  index,
  compact,
  annotation,
  reduce,
}: {
  solution: HubSolution;
  className?: string;
  sizes: string;
  index: number;
  compact?: boolean;
  annotation?: string;
  reduce: boolean | null;
}) {
  const img = mediaUrl({
    storage_path: solution.hero_image_path,
    external_url: solution.hero_image_url_ext,
  });

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.075, ease: EASE }}
      className={cn(
        "dark group relative flex flex-col justify-end overflow-hidden rounded-[22px] bg-muted p-5 text-foreground",
        compact ? "min-h-[168px]" : "min-h-[264px]",
        className,
      )}
    >
      {img ? (
        <Image
          src={img}
          alt={solution.hero_image_alt ?? solution.name ?? "Solusi ACTA"}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[130%] bg-gradient-to-t from-background via-background/45 to-transparent transition-[height] duration-500 group-hover:h-full" />

      {!compact && annotation ? (
        <span className="mono-spec absolute right-4 top-4 rounded-md bg-foreground/15 px-2 py-0.5 text-foreground/90 backdrop-blur-md">
          {annotation}
        </span>
      ) : null}

      <div className="relative flex items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className={compact ? "heading-md" : "heading-lg"}>{solution.name}</p>
          {!compact ? (
            <p className="body-sm line-clamp-1 text-foreground/70">{solution.value_prop}</p>
          ) : null}
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={compact ? 24 : 30}
          strokeWidth={1.5}
          className="shrink-0 text-foreground transition-transform duration-300 group-hover:translate-x-1"
        />
      </div>

      <Link
        href={`/solutions/${solution.slug}`}
        aria-label={solution.name ?? "Solusi"}
        className="absolute inset-0 z-10 rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
    </motion.div>
  );
}
