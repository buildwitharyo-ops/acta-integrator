"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import styles from "./Testimonials.module.css";

// The former names and quotes were explicitly fabricated placeholders in this file.
// No verified customer endorsements exist in the repository. Retain the animated
// section as clearly identified operating scenarios, without attributed quotes.
const SCENARIOS = [
  {
    title: "One integrated system",
    role: "Operations",
    description: "Audio, display, and control need to work together, with a clear point of contact for the complete system."
  },
  {
    title: "A specification that fits",
    role: "IT planning",
    description: "Room size, user activity, and existing equipment inform the specification before devices are selected."
  },
  {
    title: "Speech across the room",
    role: "Facilities",
    description: "Auditorium design needs to consider room acoustics and listening positions alongside loudspeaker selection."
  },
  {
    title: "A familiar start to meetings",
    role: "Daily use",
    description: "A clear room interface helps staff select a source, start a call, and adjust the audio."
  },
  {
    title: "Installation with a record",
    role: "Project delivery",
    description: "Cable identification, connection drawings, and equipment records give the operating team a reference after handover."
  },
  {
    title: "Support after installation",
    role: "Maintenance",
    description: "Support scope, escalation contacts, and access requirements should be agreed as part of the project."
  },
  {
    title: "Operators who know the room",
    role: "Training",
    description: "Training should follow the activities operators perform, from everyday use to preparing an event."
  },
  {
    title: "A clear project scope",
    role: "Procurement",
    description: "Equipment, installation, configuration, and exclusions need to be clear before a proposal is approved."
  },
  {
    title: "Audio for each building zone",
    role: "Property management",
    description: "Background music and paging need routing and zone controls that follow how a building operates."
  },
];
type Scenario = (typeof SCENARIOS)[number];

type TrackProps = {
  items: Scenario[];
  reverse?: boolean;
  duration?: number;
  paused: boolean;
};

function Card({ item, clone = false }: { item: Scenario; clone?: boolean }) {
  return (
    <article className={styles.card} aria-hidden={clone || undefined}>
      <p className={styles.role}>{item.role}</p>
      <h3>{item.title}</h3>
      <p className={styles.body}>{item.description}</p>
    </article>
  );
}

function Track({ items, reverse = false, duration = 40, paused }: TrackProps) {
  return (
    <div
      className={`${styles.track} animate-scroll-y`}
      style={{
        animationDuration: `${duration}s`,
        animationDirection: reverse ? "reverse" : "normal",
        animationPlayState: paused ? "paused" : "running",
      }}
    >
      {items.map((item) => <Card key={item.title} item={item} />)}
      {items.map((item) => <Card key={`clone-${item.title}`} item={item} clone />)}
    </div>
  );
}

export function Testimonials() {
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const frozen = paused || hovering;

  return (
    <section
      lang="en"
      id="home-testimonials"
      aria-labelledby="home-testimonials-title"
      className={styles.section}
    >
      <noscript>
        <style>{`
          #home-testimonials .${styles.controls},
          #home-testimonials .${styles.desktopTracks},
          #home-testimonials .${styles.mobileTrack} { display: none; }
          #home-testimonials .${styles.viewport} {
            height: auto;
            overflow: visible;
            mask-image: none;
          }
          #home-testimonials .${styles.staticGrid} {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
            gap: 20px;
          }
        `}</style>
      </noscript>
      <div className="container">
        <header className={styles.header}>
          <div>
            <h2 id="home-testimonials-title">Room Operating Scenarios</h2>
            <p className={styles.intro}>
              Planning examples for operations, IT, facilities, and procurement teams.
              Use them to define how a room should work.
            </p>
          </div>
          <div className={styles.controls}>
            {!showAll ? (
              <button
                type="button"
                aria-pressed={paused}
                onClick={() => setPaused((value) => !value)}
              >
                <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={14} strokeWidth={2} />
                {paused ? "Play" : "Pause"}
              </button>
            ) : null}
            <button
              type="button"
              aria-expanded={showAll}
              aria-controls="home-operating-scenarios"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show moving cards" : "Read all scenarios"}
              <span aria-hidden="true">{showAll ? "−" : "+"}</span>
            </button>
          </div>
        </header>
        <div
          id="home-operating-scenarios"
          className={`${styles.viewport} ${showAll ? styles.showAll : ""}`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocusCapture={() => setHovering(true)}
          onBlurCapture={() => setHovering(false)}
        >
          <div className={styles.desktopTracks}>
            <Track items={SCENARIOS.slice(0, 3)} duration={34} paused={frozen} />
            <Track items={SCENARIOS.slice(3, 6)} duration={46} reverse paused={frozen} />
            <Track items={SCENARIOS.slice(6, 9)} duration={40} paused={frozen} />
          </div>
          <div className={styles.mobileTrack}>
            <Track items={SCENARIOS} duration={100} paused={frozen} />
          </div>
          <div className={styles.staticGrid}>
            {SCENARIOS.map((item) => <Card key={item.title} item={item} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
