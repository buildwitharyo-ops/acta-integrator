"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

type PainPoint = { title?: string; body?: string };

export function PainPoints({
  eyebrow,
  heading,
  items,
}: {
  eyebrow: string;
  heading: string;
  items: PainPoint[];
}) {
  const reduce = useReducedMotion();
  const points = items.filter((p) => p.title);

  return (
    <section className="container py-section">
      <p className="mono-label text-accent-text">{eyebrow}</p>
      <h2 className="display-lg mt-3 max-w-[24ch]">{heading}</h2>

      <ol className="mt-10 max-w-4xl">
        {points.map((p, i) => (
          <li key={i} className="grid gap-4 border-t border-border py-7 first:border-t-0 first:pt-0 md:grid-cols-[6rem_1fr] md:gap-10">
            <div className="flex items-start gap-3 md:flex-col md:gap-3">
              <span className="font-mono text-3xl tabular-nums text-foreground/25 md:text-4xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <motion.span
                aria-hidden
                className="mt-3 block h-0.5 w-10 origin-left bg-primary md:mt-0"
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
              />
            </div>
            <div>
              <h3 className="heading-lg">{p.title}</h3>
              {p.body ? (
                <p className="body-md mt-2 max-w-[62ch] text-muted-foreground">{p.body}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
