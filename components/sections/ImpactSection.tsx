"use client";

import { useEffect, useState } from "react";
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

// Actual selected works from the owner-supplied ACTA Company Profile 2027.
// Exact PDF pages, extracted photo objects and documented scope are recorded in
// public/images/home-results/sources.json. No performance outcome is inferred.
const CARDS = [
  {
    label: "Meeting rooms",
    title: "PT Triputra Agro Persada",
    description:
      "A divisible meeting-room system with three rooms and six AV presets, including audio zoning and camera selection.",
    image: "triputra-agro-persada",
    scope: "Divisible meeting room",
    width: 1040,
    height: 626,
    alt: "Completed divisible meeting room at PT Triputra Agro Persada, with display, ceiling projector, and installed loudspeaker",
  },
  {
    label: "Zoned audio",
    title: "PT Airin Graha Solusindo",
    description:
      "Speaker coverage and audio control organised by floor and zone for an entertainment audio system.",
    image: "airin-graha-solusindo",
    scope: "Entertainment audio system",
    width: 1040,
    height: 780,
    alt: "Installed wall loudspeakers and audio equipment in a PT Airin Graha Solusindo entertainment space",
  },
  {
    label: "Broadcast",
    title: "St. John Bosco Church",
    description:
      "Camera placement and live production control for worship services, with equipment and operators in the worship space.",
    image: "john-bosco-church",
    scope: "Worship broadcast system",
    width: 1040,
    height: 602,
    alt: "ACTA team and camera production equipment inside St. John Bosco Church",
  },
  {
    label: "Studio",
    title: "Ronald Capital",
    description:
      "Video, audio, and operator controls arranged for broadcast and podcast studio production.",
    image: "ronald-capital",
    scope: "Broadcast & podcast studio",
    width: 1040,
    height: 626,
    alt: "Ronald Capital studio with production screens, microphone, and camera equipment arranged around the table",
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
            <h2 id="impact-title">Results That Speak for Themselves</h2>
          </div>
          <p>
            Selected ACTA projects, from divisible meeting rooms and zoned audio
            to live broadcast and studio production.
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
          aria-label="Selected ACTA project results"
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
                <div className={`${styles.impactImage} ${card.image === "ronald-capital" ? styles.studioFrame : ""}`}>
                  {/* Responsive derivatives extracted from the supplied profile. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/home-results/${card.image}-800.webp`}
                    srcSet={[480, 800, 1040]
                      .map(
                        (width) =>
                          `/images/home-results/${card.image}-${width}.webp ${width}w`,
                      )
                      .join(", ")}
                    sizes="(min-width:768px) 45vw, calc(100vw - 80px)"
                    width={card.width}
                    height={card.height}
                    alt={card.alt}
                    loading="lazy"
                    decoding="async"
                    className={`${styles.impactProduct} ${styles.projectPhoto}`}
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
                    <span>{card.scope}</span>
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
                        '[aria-label="Selected ACTA project results"]',
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
