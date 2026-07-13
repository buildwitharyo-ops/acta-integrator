"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CornerTicks } from "./CornerTicks";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type SignalStage = {
  label: string;
  sublabel?: string;
  annotation?: string;
};

function Connector({ index, reduce }: { index: number; reduce: boolean | null }) {
  const transition = { duration: 0.6, delay: 0.09 * index + 0.1, ease: EASE };
  return (
    <div className="flex items-center justify-center py-1 md:w-10 md:py-0" aria-hidden>
      <div className="relative h-6 w-px bg-border md:hidden">
        <motion.span
          className="absolute inset-x-0 top-0 block h-full w-px origin-top bg-primary"
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={transition}
        />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-primary" />
      </div>
      <div className="relative hidden h-px w-full bg-border md:block">
        <motion.span
          className="absolute inset-y-0 left-0 block h-px w-full origin-left bg-primary"
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={transition}
        />
        <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rotate-45 border-r border-t border-primary" />
      </div>
    </div>
  );
}

export function SignalChainDiagram({
  stages,
  className,
}: {
  stages: SignalStage[];
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("flex flex-col md:flex-row md:items-stretch", className)}>
      {stages.map((stage, i) => (
        <Fragment key={`${stage.label}-${i}`}>
          <div className="relative flex-1 rounded-sm bg-card p-5 ring-1 ring-border">
            <CornerTicks />
            <span className="mono-spec text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="heading-md mt-2">{stage.label}</p>
            {stage.sublabel ? (
              <p className="body-sm mt-1 text-muted-foreground">{stage.sublabel}</p>
            ) : null}
            {stage.annotation ? (
              <p className="mono-spec mt-4 text-accent-text">{stage.annotation}</p>
            ) : null}
          </div>
          {i < stages.length - 1 ? <Connector index={i} reduce={reduce} /> : null}
        </Fragment>
      ))}
    </div>
  );
}
