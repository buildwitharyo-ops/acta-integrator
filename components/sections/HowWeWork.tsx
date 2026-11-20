"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { usePreviewPlayback } from "./usePreviewPlayback";
import { useHomeReducedMotion } from "./useHomeReducedMotion";
import styles from "./engineering.module.css";

type Step = { no?: string; title?: string; description?: string };
const DEFAULT_STEPS: Step[] = [
  {
    no: "01",
    title: "Consultation & System Design",
    description:
      "We assess the space, its users, and the way it needs to work. The design brings room layout, acoustics, connectivity, and budget into one system plan.",
  },
  {
    no: "02",
    title: "Installation & Integration",
    description:
      "We install and configure the equipment as a connected system. Audio, video, and control are tested together against the room’s intended use.",
  },
  {
    no: "03",
    title: "Equipment Supply",
    description:
      "Equipment is selected for its role in the design. We consider compatibility, installation requirements, and the existing devices you want to retain.",
  },
  {
    no: "04",
    title: "Training & Maintenance",
    description:
      "We walk operators through everyday use and provide system documentation. Maintenance and technical support follow the agreed project scope.",
  },
];
// Exact legacy/CMS wording is refreshed; unrelated editorial edits remain authoritative.
const LEGACY_DESCRIPTIONS = [
  [
    "Kami mulai dari kebutuhan, bukan katalog. Site survey, analisis ruang & akustik, lalu desain sistem dan RAB transparan.",
    "Kami mulai dari kebutuhan dan ruang Anda, bukan dari katalog. Analisis fungsi, akustik, dan anggaran menghasilkan desain sistem yang tepat ukuran — tidak kurang, tidak berlebihan.",
  ],
  [
    "Pemasangan rapi, terdokumentasi. Audio, visual, dan kontrol bekerja sebagai satu sistem yang mulus.",
    "Pemasangan rapi dengan standar engineering: audio, visual, dan kontrol bekerja sebagai satu sistem, bukan kumpulan perangkat terpisah.",
  ],
  [
    "Perangkat kelas profesional dari brand terpercaya, dipilih tepat ukuran untuk project Anda dan didukung after-sales.",
    "Perangkat kelas profesional dari brand yang kami kenal sampai ke level konfigurasi — dipilih sesuai desain sistem, bukan sekadar yang tersedia.",
  ],
  [
    "Kami latih tim Anda mengoperasikan sistem, lalu mendampingi dengan dukungan teknis berkelanjutan.",
    "Sistem terbaik pun butuh operator yang percaya diri. Kami melatih tim Anda dan mendampingi dengan dukungan teknis jangka panjang.",
  ],
];
const LEGACY_DESCRIPTION_MAP = new Map(
  LEGACY_DESCRIPTIONS.flatMap((sources, index) =>
    sources.map(
      (source) => [source, DEFAULT_STEPS[index]?.description] as const,
    ),
  ),
);
const VISUALS = [
  {
    image: "audac-luna-front",
    name: "AUDAC LUNA-F",
    type: "Audio matrix processor",
    detail: "System architecture",
    output: "Room requirements · System design · Scope planning",
  },
  {
    image: "audac-luna-rear",
    name: "AUDAC LUNA-F",
    type: "Connection detail",
    detail: "Integration & signal routing",
    output: "Installation · Configuration · Commissioning",
  },
  {
    image: "yamaha-dm3",
    name: "Yamaha DM3",
    type: "Digital mixing console",
    detail: "Equipment selection",
    output: "Compatibility · Function · Equipment supply",
  },
  {
    image: "yamaha-dm7",
    name: "Yamaha DM7",
    type: "Operator interface",
    detail: "Operation & handover",
    output: "Operator training · Documentation · Maintenance",
  },
];
const INTERVAL = 6500;

export function HowWeWork({
  content,
}: {
  content: { headline?: string; steps?: Step[] };
}) {
  const steps = content.steps?.length
    ? content.steps.map((step) => ({
        ...step,
        description:
          LEGACY_DESCRIPTION_MAP.get(step.description ?? "") ??
          step.description,
      }))
    : DEFAULT_STEPS;
  const headline =
    !content.headline || content.headline === "From Consultation to Handover."
      ? "From Design to Handover"
      : content.headline;
  const reduce = useHomeReducedMotion();
  const [active, setActive] = useState(0);
  const { paused, suspended, controlProps, regionProps } = usePreviewPlayback();
  const total = steps.length;
  const frozen = suspended || reduce;
  const current = steps[active] ?? steps[0];
  const visual = VISUALS[active % VISUALS.length] ?? VISUALS[0]!;
  const no = (step: Step, index: number) =>
    step.no ?? String(index + 1).padStart(2, "0");

  useEffect(() => {
    if (frozen || total < 2) return;
    const timer = setInterval(
      () => setActive((value) => (value + 1) % total),
      INTERVAL,
    );
    return () => clearInterval(timer);
  }, [frozen, total, active]);

  if (!current) return null;
  const onTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next = active;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (active + 1) % total;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (active - 1 + total) % total;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = total - 1;
    else return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`hww-tab-${next}`)?.focus();
  };

  return (
    <section
      id="how-we-work"
      lang="en"
      className={`dark ${styles.work}`}
      aria-labelledby="work-title"
    >
      <div className="container">
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>How we work</p>
            <h2 id="work-title">{headline}</h2>
          </div>
          <p>
            Follow a project from the site survey through equipment selection,
            commissioning and operator training.
          </p>
        </header>
        <div
          className={styles.workLayout}
          {...regionProps}
        >
          <div className={styles.workContent}>
            <div
              role="tablist"
              aria-label="Project stages"
              aria-orientation="vertical"
              onKeyDown={onTabKey}
              className={styles.tabList}
            >
              {steps.map((step, index) => (
                <button
                  key={index}
                  id={`hww-tab-${index}`}
                  role="tab"
                  aria-selected={index === active}
                  aria-controls="hww-panel"
                  tabIndex={index === active ? 0 : -1}
                  type="button"
                  onClick={() => setActive(index)}
                  className={styles.tab}
                >
                  <span className={styles.tabNumber}>{no(step, index)}</span>
                  <span>{step.title}</span>
                  <span className={styles.tabArrow} aria-hidden="true">
                    ↗
                  </span>
                  <span className={styles.tabTrack} aria-hidden="true">
                    {index === active ? (
                      <motion.span
                        key={`${active}-${frozen}`}
                        initial={{ scaleX: frozen ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: frozen ? 0 : INTERVAL / 1000,
                          ease: "linear",
                        }}
                      />
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="hww-panel"
              aria-labelledby={`hww-tab-${active}`}
              tabIndex={0}
              className={styles.panel}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: reduce ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.22 }}
                >
                  <h3>{current.title}</h3>
                  <p>{current.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className={styles.playback}>
              <span className={styles.eyebrow}>
                {no(current, active)} / {String(total).padStart(2, "0")}
              </span>
              {!reduce ? (
                <button
                  type="button"
                  {...controlProps}
                  className={styles.pause}
                >
                  <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
                  {paused ? "Play stages" : "Pause stages"}
                </button>
              ) : null}
            </div>
          </div>
          <div className={styles.workVisual}>
            <div className={styles.visualTop}>
              <span>{visual.detail}</span>
              <span aria-hidden="true">0{active + 1}</span>
            </div>
            <div className={styles.productStage}>
              {VISUALS.map((item, index) => (
                <motion.div
                  key={item.image}
                  initial={false}
                  animate={{
                    opacity: index === active % VISUALS.length ? 1 : 0,
                    scale:
                      index === active % VISUALS.length ? 1 : reduce ? 1 : 0.98,
                  }}
                  transition={{ duration: reduce ? 0 : 0.45 }}
                  className={styles.productLayer}
                  aria-hidden={index !== active % VISUALS.length}
                >
                  <Image
                    src={`/images/home-engineering/${item.image}.webp`}
                    alt={`${item.name} — ${item.type}; catalog product photograph`}
                    unoptimized
                    fill
                    sizes="(min-width:1024px) 50vw, 100vw"
                    className={styles.workProduct}
                  />
                </motion.div>
              ))}
            </div>
            <div className={styles.visualBottom}>
              <div>
                <strong>{visual.name}</strong>
                <span>{visual.type}</span>
              </div>
              <span className={styles.crosshair} aria-hidden="true">
                +
              </span>
            </div>
            <div className={styles.workOutput}>{visual.output}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
