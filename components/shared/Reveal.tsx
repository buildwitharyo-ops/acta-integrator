"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { reveal, staggerParent, viewportOnce } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  subtle?: boolean;
};

const subtleReveal = { ...reveal, hidden: { opacity: 0.92, y: 12 } };

export function Reveal({ children, className, stagger = false, subtle = false }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      data-reveal
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={subtle ? { once: true, amount: "some" } : viewportOnce}
      variants={stagger ? staggerParent : subtle ? subtleReveal : reveal}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div data-reveal className={className} variants={reveal}>
      {children}
    </motion.div>
  );
}
