"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useHomeReducedMotion } from "./useHomeReducedMotion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { homepageEquipmentCopy } from "./homepage-equipment-copy";

type Solution = {
  slug: string | null;
  name: string | null;
  tier: string | null;
  value_prop: string | null;
  hero_image_path: string | null;
  hero_image_url_ext: string | null;
  hero_image_alt: string | null;
};

const CORE_ANNOTATIONS: Record<string, string> = {
  "smart-meeting-room": "One-touch join",
  "auditorium-performance-hall": "Room acoustics",
  "divisible-room-multipurpose-hall": "Zone routing",
  "pa-commercial-sound-system": "Distributed audio",
  "smart-classroom-training-room": "Interactive display",
};

export function SolutionsBento({
  content,
  solutions,
}: {
  content: { headline?: string; subheadline?: string };
  solutions: Solution[];
}) {
  const reduce = useHomeReducedMotion();
  const core = solutions.filter((s) => s.slug && s.tier === "core");
  const supporting = solutions.filter((s) => s.slug && s.tier === "supporting");

  return (
    <section lang="en" aria-labelledby="home-solutions-title" className="container py-section">
      <header className="mb-6 grid gap-4 border-t border-border pt-5 md:mb-8 md:grid-cols-2 md:items-end md:gap-8">
        <h2 id="home-solutions-title" className="display-lg text-balance">
          {homepageEquipmentCopy(content.headline, "AV Systems by Space")}
        </h2>
        <p className="body-md max-w-[52ch] text-muted-foreground md:justify-self-end">
          {homepageEquipmentCopy(content.subheadline, "Explore audio, video and control systems for the way each room is used.")}
        </p>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
        {core.map((solution, index) => (
          <SolutionCard key={solution.slug} solution={solution} index={index} featured={index === 0 && core.length > 2} reduce={reduce} />
        ))}
      </div>

      {supporting.length > 0 && (
        <div className="mt-2.5 grid gap-2.5 md:grid-cols-3">
          {supporting.map((solution, index) => (
            <SolutionCard key={solution.slug} solution={solution} index={index} compact reduce={reduce} />
          ))}
        </div>
      )}
    </section>
  );
}

function SolutionCard({
  solution, index, featured, compact, reduce,
}: {
  solution: Solution;
  index: number;
  featured?: boolean;
  compact?: boolean;
  reduce: boolean | null;
}) {
  const image = mediaUrl({ storage_path: solution.hero_image_path, external_url: solution.hero_image_url_ext });
  const annotation = CORE_ANNOTATIONS[solution.slug ?? ""];
  const description = homepageEquipmentCopy(solution.value_prop);
  const name = solution.name ?? "AV solution";

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0.8, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -2, scale: 0.995, rotate: 0.08 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.035, ease: "easeOut" }}
      className={cn(
        "group relative isolate flex min-w-0 overflow-hidden rounded-lg bg-[#23272b] text-white",
        compact ? "min-h-[7.5rem] md:min-h-[9rem]" : "min-h-[13rem] md:min-h-[14.5rem]",
        featured && "min-h-[17.5rem] sm:col-span-2 lg:col-span-1 lg:row-span-2",
      )}
    >
      {image && (
        <div className={cn("absolute inset-0", featured && "lg:bottom-auto lg:h-[64%]")}>
          <Image
            src={image}
            alt={homepageEquipmentCopy(solution.hero_image_alt, name)}
            fill
            sizes={featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.025] motion-safe:group-focus-within:scale-[1.025]"
          />
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[112%] bg-gradient-to-t from-black/95 via-black/65 to-transparent motion-safe:transition-[height] motion-safe:duration-300 group-hover:h-full group-focus-within:h-full" />
      <Link
        href={`/solutions/${solution.slug}`}
        aria-label={name}
        className={cn(
          "relative flex w-full scroll-mt-24 flex-col justify-end rounded-[inherit] p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:p-5",
          featured && "md:p-7",
        )}
      >
        {!compact && annotation && (
          <span className="mono-label mb-2.5 w-fit rounded-sm bg-black/80 px-1.5 py-1 leading-normal tracking-[0.1em] text-amber-100">{annotation}</span>
        )}
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn("text-balance font-display font-semibold leading-[1.15] tracking-[-0.025em]",
            featured ? "text-[clamp(1.65rem,2.5vw,2.5rem)]" : "text-[1.18rem] xl:text-[1.35rem]")}>{name}</h3>
          <HugeiconsIcon aria-hidden="true" icon={ArrowUpRight01Icon} size={18} strokeWidth={1.8} className="mt-1 shrink-0 motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
        </div>
        {!compact && description && <p className="mt-2 max-w-[43ch] text-sm leading-relaxed text-white/90">{description}</p>}
      </Link>
    </motion.article>
  );
}
