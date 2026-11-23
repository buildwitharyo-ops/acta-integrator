"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { usePreviewPlayback } from "./usePreviewPlayback";
import { useHomeReducedMotion } from "./useHomeReducedMotion";
import styles from "./engineering.module.css";

type Step = { no?: string; title?: string; description?: string };
// ACTA company profile, p. 9 ("How we deliver"). Page 8 describes service offerings.
const DELIVERY_STAGES = [
  {
    title: "Understand",
    description:
      "We review how people use the room, identify technical constraints and agree on the project scope.",
    output: "Room requirements",
    legacyTitle: "Consultation & System Design",
    legacyDescriptions: [
      "Kami mulai dari kebutuhan, bukan katalog. Site survey, analisis ruang & akustik, lalu desain sistem dan RAB transparan.",
      "Kami mulai dari kebutuhan dan ruang Anda, bukan dari katalog. Analisis fungsi, akustik, dan anggaran menghasilkan desain sistem yang tepat ukuran — tidak kurang, tidak berlebihan.",
    ],
  },
  {
    title: "Design",
    description:
      "We map the signal flow, specify the equipment and define the controls people need to operate the room.",
    output: "System design",
    legacyTitle: "Installation & Integration",
    legacyDescriptions: [
      "Pemasangan rapi, terdokumentasi. Audio, visual, dan kontrol bekerja sebagai satu sistem yang mulus.",
      "Pemasangan rapi dengan standar engineering: audio, visual, dan kontrol bekerja sebagai satu sistem, bukan kumpulan perangkat terpisah.",
    ],
  },
  {
    title: "Integrate",
    description:
      "We install and connect the equipment, then configure audio, video and control to work together.",
    output: "Configured system",
    legacyTitle: "Equipment Supply",
    legacyDescriptions: [
      "Perangkat kelas profesional dari brand terpercaya, dipilih tepat ukuran untuk project Anda dan didukung after-sales.",
      "Perangkat kelas profesional dari brand yang kami kenal sampai ke level konfigurasi — dipilih sesuai desain sistem, bukan sekadar yang tersedia.",
    ],
  },
  {
    title: "Commission & hand over",
    description:
      "We test the system and train your operators. Your team uses ACTA Care to find operating guides, handover documents and system records, check warranties and request support.",
    output: "Operator training & client portal",
    legacyTitle: "Training & Maintenance",
    legacyDescriptions: [
      "Kami latih tim Anda mengoperasikan sistem, lalu mendampingi dengan dukungan teknis berkelanjutan.",
      "Sistem terbaik pun butuh operator yang percaya diri. Kami melatih tim Anda dan mendampingi dengan dukungan teknis jangka panjang.",
    ],
  },
];

function resolveStep(step: Step) {
  // Only migrate an exact legacy entry. A custom title or description keeps its original context.
  const stage = DELIVERY_STAGES.find((candidate) =>
    candidate.legacyTitle === step.title &&
    candidate.legacyDescriptions.includes(step.description ?? ""),
  );
  if (stage) {
    return { ...step, title: stage.title, description: stage.description, output: stage.output };
  }
  const profileStage = DELIVERY_STAGES.find((candidate) => candidate.title === step.title);
  return { ...step, output: profileStage?.output };
}

const VISUALS = [
  {
    image: "/images/home-delivery/acta-site-survey.webp",
    name: "On site with the ACTA team",
    alt: "An ACTA team member follows a colleague’s pointing hand as they review the space on site.",
    detail: "Site survey",
  },
  {
    image: "/images/home-delivery/av-drawing-set-preview.webp",
    name: "Rack elevations and single-line diagrams",
    alt: "Four ACTA engineering sheets in a two-by-two overview. The top pair shows a rack elevation and signal paths. The lower pair combines each rack with its connection diagram.",
    detail: "ACTA drawing set",
    fullSize: { href: "/images/home-delivery/av-drawing-set.webp", label: "Open all four sheets" },
  },
  {
    image: "/images/home-delivery/installation-rack.webp",
    name: "Rack wiring and system controls",
    alt: "Short patch leads connect rack-mounted equipment above a touchscreen audio mixer.",
    detail: "System connections",
  },
  {
    image: "/images/home-delivery/acta-care-overview.webp",
    name: "Your handover in ACTA Care",
    alt: "ACTA Care portal overview with operating guides and SOPs, handover documents, installation photos, equipment and diagrams, service tickets and warranty coverage.",
    detail: "Client portal",
    fullSize: { href: "/images/home-delivery/acta-care-overview.webp", label: "View portal overview" },
  },
];
const INTERVAL = 6500;

export function HowWeWork({
  content,
}: {
  content: { headline?: string; steps?: Step[] };
}) {
  const steps: (Step & { output?: string })[] = content.steps?.length
    ? content.steps.map(resolveStep)
    : DELIVERY_STAGES;
  const headline =
    !content.headline || content.headline === "From Consultation to Handover."
      ? "How We Deliver"
      : content.headline;
  const reduce = useHomeReducedMotion();
  const [active, setActive] = useState(0);
  const { paused, suspended, controlProps, regionProps } = usePreviewPlayback();
  const total = steps.length;
  const frozen = suspended || reduce;
  const current = steps[active] ?? steps[0];
  const profileIndex = DELIVERY_STAGES.findIndex((stage) => stage.title === current?.title);
  const visualIndex = profileIndex < 0 ? active % VISUALS.length : profileIndex;
  const visual = VISUALS[visualIndex]!;
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
            <p className={styles.eyebrow}>Project delivery</p>
            <h2 id="work-title">{headline}</h2>
          </div>
          <p>
            From room requirements to a system ready for daily use.
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
                    opacity: index === visualIndex ? 1 : 0,
                    scale:
                      index === visualIndex ? 1 : reduce ? 1 : 0.98,
                  }}
                  transition={{ duration: reduce ? 0 : 0.45 }}
                  className={styles.productLayer}
                  aria-hidden={index !== visualIndex}
                >
                  <Image
                    src={item.image}
                    alt={item.alt}
                    unoptimized
                    fill
                    sizes="(min-width:1024px) 50vw, 100vw"
                    className={item.fullSize ? styles.workProduct : "rounded-sm object-cover"}
                  />
                </motion.div>
              ))}
            </div>
            <div className={styles.visualBottom}>
              <div>
                <strong>{visual.name}</strong>
                {visual.fullSize && (
                  <span>
                    <a
                      href={visual.fullSize.href}
                      target="_blank"
                      rel="noopener"
                      aria-label={`${visual.fullSize.label} in a new tab`}
                      className={styles.previewLink}
                    >
                      {visual.fullSize.label} <span aria-hidden="true">↗</span>
                    </a>
                  </span>
                )}
              </div>
              {!visual.fullSize && <span className={styles.crosshair} aria-hidden="true">+</span>}
            </div>
            {current.output && <div className={styles.workOutput}>Stage output · {current.output}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
