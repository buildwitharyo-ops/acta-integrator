"use client";

import { useState } from "react";
import type { MarqueeLogo } from "./MarqueeStrip";
import styles from "./HomeTechnologyStrip.module.css";
import { HOMEPAGE_BRAND_GROUPS } from "@/lib/homepage-brand-partners";


type HomeTechnologyStripProps = {
  logos: MarqueeLogo[];
  heading: string;
  className?: string;
};

function Brand({ logo }: { logo: MarqueeLogo }) {
  return (
    <span
      role="img"
      aria-label={logo.name}
      title={logo.name}
      className={styles.logo}
      style={{
        maskImage: `url(${logo.src})`,
        WebkitMaskImage: `url(${logo.src})`,
      }}
    />
  );
}

export function HomeTechnologyStrip({ logos, heading, className }: HomeTechnologyStripProps) {
  const [paused, setPaused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const available = new Set(logos.map((logo) => logo.src));
  const groups = HOMEPAGE_BRAND_GROUPS.map((group) => ({
    ...group,
    logos: group.logos.filter((logo) => available.has(logo.src)),
  })).filter((group) => group.logos.length > 0);

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
          #home-technology .${styles.track} { display: none; }
          #home-technology .${styles.groups} { display: grid; }
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
        <div className={styles.groups}>
          {groups.map((group) => (
            <div
              key={group.id}
              role="group"
              aria-labelledby={`home-partners-${group.id}`}
              className={styles.partnerGroup}
            >
              <h3 id={`home-partners-${group.id}`}>{group.label}</h3>
              <ul className={styles.groupLogos}>
                {group.logos.map((logo) => (
                  <li key={logo.name}><Brand logo={logo} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
