"use client";

import { useState } from "react";
import type { MarqueeLogo } from "./MarqueeStrip";
import styles from "./HomeTechnologyStrip.module.css";
import maskSources from "@/lib/homepage-brand-masks.json";

const homepageMasks = new Map(Object.entries(maskSources));

type HomeTechnologyStripProps = {
  logos: MarqueeLogo[];
  heading: string;
  className?: string;
};

function Brand({ logo }: { logo: MarqueeLogo }) {
  // Only generated, known sources are replaced; other caller-supplied logos retain their source.
  const source = homepageMasks.get(logo.src) ?? logo.src;
  return (
    <span
      role="img"
      aria-label={logo.name}
      title={logo.name}
      className={styles.logo}
      style={{
        maskImage: `url(${source})`,
        WebkitMaskImage: `url(${source})`,
      }}
    />
  );
}

export function HomeTechnologyStrip({ logos, heading, className }: HomeTechnologyStripProps) {
  const [paused, setPaused] = useState(false);
  const [showAll, setShowAll] = useState(false);

  return (
    <section
      lang="en"
      id="home-technology"
      aria-label={heading}
      className={`${styles.section} ${className ?? ""}`}
    >
      <noscript>
        <style>{`
          #home-technology .${styles.controls} { display: none; }
          #home-technology .${styles.viewport} {
            overflow: visible;
            mask-image: none;
            max-width: 1400px;
            margin-inline: auto;
            padding-inline: 24px;
          }
          #home-technology .${styles.track} { animation: none; width: 100%; }
          #home-technology .${styles.row} {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
            gap: 28px 24px;
            width: 100%;
            padding: 0;
          }
          #home-technology .${styles.row} li { display: flex; justify-content: center; }
          #home-technology .${styles.clone} { display: none; }
        `}</style>
      </noscript>
      <div className={`container ${styles.heading}`}>
        <h2 className={styles.label}>{heading}</h2>
        <div className={styles.controls}>
          {!showAll ? (
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? "Play" : "Pause"}
              <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
            </button>
          ) : null}
          <button
            type="button"
            aria-expanded={showAll}
            aria-controls="home-technology-brands"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? "Show moving brands" : "View all brands"}
            <span aria-hidden="true">{showAll ? "−" : "+"}</span>
          </button>
        </div>
      </div>
      <div
        id="home-technology-brands"
        className={`${styles.viewport} ${showAll ? styles.expanded : ""}`}
      >
        <div
          className={`${styles.track} animate-marquee`}
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          <ul className={styles.row}>
            {logos.map((logo) => (
              <li key={logo.name}><Brand logo={logo} /></li>
            ))}
          </ul>
          <ul className={`${styles.row} ${styles.clone}`} aria-hidden="true">
            {logos.map((logo) => (
              <li key={logo.name}><Brand logo={logo} /></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
