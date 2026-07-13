"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { buttonVariants } from "@/components/ui/button";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Annotation = { label: string };

const ANCHORS = [
  { pos: "left-[6%] top-[14%]", reverse: false },
  { pos: "right-[6%] top-[20%]", reverse: true },
  { pos: "left-[8%] bottom-[18%]", reverse: false },
  { pos: "right-[8%] bottom-[13%]", reverse: true },
];

export function SolutionHero({
  name,
  headline,
  subcopy,
  waMessage,
  image,
  annotations,
  hasProducts = true,
}: {
  name: string;
  headline: string;
  subcopy?: string | null;
  waMessage?: string | null;
  image: { url: string | null; alt: string | null };
  annotations: Annotation[];
  hasProducts?: boolean;
}) {
  const reduce = useReducedMotion();
  const callouts = annotations.filter((a) => a.label).slice(0, 4);

  return (
    <section className="container pb-compact pt-6">
      <p className="mono-label text-accent-text">SOLUTION — {name.toUpperCase()}</p>
      <h1 className="display-xl mt-4 max-w-[22ch] text-balance">{headline}</h1>
      {subcopy ? (
        <p className="body-lg mt-5 max-w-[58ch] text-muted-foreground">{subcopy}</p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <WhatsAppCTA
          context="solution"
          name={name}
          message={waMessage ?? undefined}
          label="Minta Penawaran"
          emphasis="orbit"
          size="lg"
        />
        {hasProducts ? (
          <a href="#produk-terkait" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
            Lihat Produk Terkait
          </a>
        ) : null}
      </div>

      {image.url ? (
        <figure className="relative mt-10 aspect-[16/11] overflow-hidden rounded-[26px] bg-muted md:aspect-[2/1]">
          <Image
            src={image.url}
            alt={image.alt ?? `Instalasi sistem ${name}`}
            fill
            priority
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {callouts.map((a, i) => {
              const anchor = ANCHORS[i]!;
              return (
                <motion.div
                  key={a.label}
                  className={cn("absolute flex items-center gap-2", anchor.pos, anchor.reverse && "flex-row-reverse")}
                  initial={reduce ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.18, ease: EASE }}
                >
                  <span className="mono-spec rounded-md bg-background/80 px-2 py-1 text-foreground ring-1 ring-border backdrop-blur-md">
                    {a.label}
                  </span>
                  <motion.span
                    className={cn("relative block h-px w-11 bg-primary", anchor.reverse ? "origin-right" : "origin-left")}
                    initial={reduce ? false : { scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.45 + i * 0.18, ease: EASE }}
                  >
                    <span
                      className={cn(
                        "absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary",
                        anchor.reverse ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
                      )}
                    />
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        </figure>
      ) : null}
    </section>
  );
}
