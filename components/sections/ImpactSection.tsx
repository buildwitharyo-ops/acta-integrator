"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { TrackedLink } from "@/components/shared/TrackedLink";
import { motion } from "motion/react";
import { useHomeReducedMotion } from "./useHomeReducedMotion";
import { useTheme } from "next-themes";
import styles from "./engineering.module.css";

const SparklesCore = dynamic(
  () =>
    import("@/components/ui/sparkles").then((module) => module.SparklesCore),
  { ssr: false },
);

// Delivery priorities, not measured results or blanket service-level guarantees.
const CARDS = [
  {
    label: "Operation",
    title: "Straightforward room control",
    description:
      "Audio, video, and room controls are configured around the tasks people perform. A clear operating sequence makes the system easier to use.",
    image: "telycam-meetbar",
    product: "Telycam Meet Bar",
    alt: "Telycam Meet Bar with integrated camera and speakers; catalog product photograph",
  },
  {
    label: "Acoustics",
    title: "Sound designed for the space",
    description:
      "Room acoustics, loudspeaker placement, and signal processing are considered together. The design follows the listening task and the room’s physical conditions.",
    image: "martin-fp12",
    product: "Martin Audio FlexPoint FP12",
    alt: "Martin Audio FlexPoint FP12 loudspeaker; catalog product photograph",
  },
  {
    label: "Support",
    title: "Support beyond handover",
    description:
      "We support your team with maintenance and troubleshooting after installation. Remote or on-site assistance follows the service arrangements agreed for your project.",
    image: "audac-luna-front",
    product: "AUDAC LUNA-F",
    alt: "AUDAC LUNA-F audio matrix processor; catalog product photograph",
  },
  {
    label: "Handover",
    title: "Operators ready to take over",
    description:
      "Documentation and practical training give your team a reference for daily operation. Maintenance and support are defined within the project scope.",
    image: "yamaha-dm3",
    product: "Yamaha DM3",
    alt: "Yamaha DM3 digital mixing console and operator controls; catalog product photograph",
  },
];

export function ImpactSection() {
  const reduce = useHomeReducedMotion();
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [effectsPaused, setEffectsPaused] = useState(false);
  const transition = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 210, damping: 29 };
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const wideQuery = window.matchMedia("(min-width: 1280px)");
    const update = () => {
      setIsDesktop(query.matches);
      setIsWide(wideQuery.matches);
    };
    update();
    query.addEventListener("change", update);
    wideQuery.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      wideQuery.removeEventListener("change", update);
    };
  }, []);

  const selectByKey = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (index + 1) % CARDS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + CARDS.length) % CARDS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = CARDS.length - 1;
    else return;
    event.preventDefault();
    setOpen(next);
    document.getElementById(`impact-trigger-${next}`)?.focus();
  };

  return (
    <section
      id="what-we-deliver"
      lang="en"
      aria-labelledby="impact-title"
      className={styles.impact}
    >
      <div className="container">
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>What we deliver</p>
            <h2 id="impact-title">Built for Daily Operation</h2>
          </div>
          <p>
            System design, integration, and handover shaped around the way your
            team uses the room.
          </p>
        </header>
        <div className={styles.sparkBand}>
          <div className={styles.sparkLine} aria-hidden="true" />
          {!reduce && !effectsPaused ? (
            <div className={styles.sparkField} aria-hidden="true">
              <SparklesCore
                key={resolvedTheme}
                id="impact-sparkles"
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={180}
                speed={0.5}
                particleColor={resolvedTheme === "dark" ? "#e8d5b8" : "#9b6a20"}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : null}

          {!reduce ? (
            <button
              type="button"
              className={styles.effectToggle}
              aria-pressed={effectsPaused}
              onClick={() => setEffectsPaused((value) => !value)}
            >
              {effectsPaused ? "Play effects" : "Pause effects"}
            </button>
          ) : null}
        </div>
        <div
          className={styles.accordion}
          role="group"
          aria-label="System delivery priorities"
        >
          {CARDS.map((card, index) => {
            const expanded = isDesktop ? open === index : true;
            return (
              <motion.article
                key={card.label}
                animate={{
                  flex: isDesktop ? (expanded ? 4.1 : 1.25) : 1,
                  height: isDesktop
                    ? isWide
                      ? expanded
                        ? 520
                        : [350, 390, 430, 470][index]
                      : 490
                    : "auto",
                }}
                transition={transition}
                className={styles.impactCard}
                data-open={expanded}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardLabel}>
                    {expanded ? card.label : ""}
                  </span>
                  <span className={styles.cardPlus} aria-hidden="true">
                    {expanded ? "−" : "+"}
                  </span>
                </div>
                <div className={styles.impactImage}>
                  <Image
                    src={`/images/home-engineering/${card.image}.webp`}
                    alt={card.alt}
                    unoptimized
                    fill
                    sizes="(min-width:768px) 45vw, 100vw"
                    className={styles.impactProduct}
                  />
                </div>
                <div className={styles.cardCopy}>
                  <h3>{expanded ? card.title : card.label}</h3>
                  <motion.div
                    id={`impact-panel-${index}`}
                    initial={false}
                    animate={{
                      height: expanded ? "auto" : 0,
                      opacity: expanded ? 1 : 0,
                    }}
                    transition={{ duration: reduce ? 0 : 0.2 }}
                    className={styles.cardDetails}
                    aria-hidden={!expanded}
                  >
                    <p>{card.description}</p>
                    <span>{card.product}</span>
                  </motion.div>
                </div>
                {isDesktop ? (
                  <button
                    type="button"
                    id={`impact-trigger-${index}`}
                    aria-expanded={expanded}
                    aria-controls={`impact-panel-${index}`}
                    aria-label={`${card.label} — ${card.title}`}
                    onPointerEnter={(event) => {
                      const accordion = event.currentTarget.closest(
                        '[aria-label="System delivery priorities"]',
                      );
                      const keyboardControl = accordion?.querySelector(
                        "button:focus-visible",
                      );
                      // The first genuine hover may report no pointer movement.
                      // Do not let layout-generated entry steal keyboard focus.
                      if (event.pointerType === "mouse" && !keyboardControl) {
                        setOpen(index);
                      }
                    }}
                    onPointerMove={(event) => {
                      // Keyboard focus can expand a card beneath a stationary
                      // pointer. Only actual mouse movement should select it.
                      if (
                        event.pointerType === "mouse" &&
                        (event.movementX || event.movementY)
                      ) {
                        setOpen(index);
                      }
                    }}
                    onFocus={() => setOpen(index)}
                    onClick={() => setOpen(index)}
                    onKeyDown={(event) => selectByKey(event, index)}
                    className={styles.cardTrigger}
                  />
                ) : null}
              </motion.article>
            );
          })}
        </div>
        <div className={styles.impactFooter}>
          <p>Planning a new room or upgrading an existing system?</p>
          <TrackedLink
            href="/contact"
            ctaId="impact_contact"
            location="home_impact"
            className={styles.contactLink}
          >
            Discuss your project <span aria-hidden="true">↗</span>
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
