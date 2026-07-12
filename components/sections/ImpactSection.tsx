"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { SparklesCore } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";

type ImpactCard = {
  metric: string;
  title: string;
  description: string;
  image: string;
  bg: string;
  text: string;
  feature?: boolean;
};

// AV-integration outcomes (honest engineering/service commitments, not fabricated
// business stats). Card styles are tuned for the dark "Control Room" band.
const CARDS: ImpactCard[] = [
  {
    metric: "1-Touch",
    title: "Meetings start on time",
    description:
      "Ruang yang sudah dikonfigurasi dan join satu sentuhan — sesi dimulai begitu orang duduk, tanpa kabel, tanpa troubleshooting.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    bg: "bg-primary",
    text: "text-primary-foreground",
    feature: true,
  },
  {
    metric: "0.6s",
    title: "Engineered acoustics",
    description:
      "Ruang di-tuning ke target RT60 terukur, sehingga setiap kursi mendengar jelas — dari baris depan sampai belakang.",
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80",
    bg: "bg-foreground/[0.04] ring-1 ring-inset ring-foreground/10",
    text: "text-foreground",
  },
  {
    metric: "24/7",
    title: "Support beyond handover",
    description:
      "Monitoring jarak jauh dan dukungan on-site yang responsif menjaga sistem tetap berjalan jauh setelah instalasi selesai.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    bg: "bg-foreground/[0.07] ring-1 ring-inset ring-foreground/15",
    text: "text-foreground",
    feature: true,
  },
  {
    metric: "100%",
    title: "Documented & trained",
    description:
      "Setiap project diserahterimakan dengan dokumentasi as-built dan pelatihan operator — tim Anda benar-benar menguasai ruangnya.",
    image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80",
    bg: "bg-primary/[0.14] ring-1 ring-inset ring-primary/30",
    text: "text-foreground",
  },
];

const CLOSED_HEIGHTS = [260, 300, 350, 390];

export function ImpactSection() {
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const sparkColor = resolvedTheme === "dark" ? "#FFFFFF" : "#475569";
  const [open, setOpen] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 220, damping: 28 };
  const heightSpring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 30 };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-background py-section text-foreground">
      <div className="container relative z-20">
        <div className="relative flex flex-col items-center text-center">
          <p className="mono-label text-accent-text">WHAT WE DELIVER</p>
          <h2 className="display-lg mt-3 max-w-[22ch]">Results that speak for themselves</h2>

          <div className="relative mt-4 h-36 w-full max-w-[44rem]">
            <div className="absolute inset-x-[22%] top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent blur-sm" />
            <div className="absolute inset-x-[22%] top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="absolute inset-x-[35%] top-0 h-[3px] bg-gradient-to-r from-transparent via-accent-hover to-transparent blur-sm" />
            <div className="absolute inset-x-[35%] top-0 h-px bg-gradient-to-r from-transparent via-accent-hover to-transparent" />
            {!reduce ? (
              <SparklesCore
                key={resolvedTheme}
                id="impact-sparkles"
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={800}
                speed={0.8}
                particleColor={sparkColor}
                className="absolute inset-0 h-full w-full"
              />
            ) : null}
            <div className="absolute inset-0 bg-background [mask-image:radial-gradient(360px_150px_at_top,transparent_16%,black_68%)]" />
          </div>

          <p className="body-lg -mt-8 max-w-[560px] text-muted-foreground">
            Dari akustik ruang sampai dukungan pasca-instalasi — dampak yang bisa diukur di setiap
            sistem yang kami serahkan.
          </p>
        </div>

        {!isDesktop ? (
          <div className="mt-8 flex flex-col gap-3">
            {CARDS.map((card, idx) => (
              <MobileCard key={idx} card={card} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-row items-end gap-2">
            {CARDS.map((card, idx) => {
              const isOpen = open === idx;
              return (
                <motion.div
                  key={idx}
                  animate={{ flex: isOpen ? 4.8 : 1.5 }}
                  transition={spring}
                  className={cn("relative h-auto overflow-hidden rounded-lg", card.bg, card.text)}
                >
                  <motion.div
                    animate={{ height: isOpen ? 430 : CLOSED_HEIGHTS[idx] }}
                    transition={heightSpring}
                    className="h-full"
                  >
                    {isOpen ? (
                      <div className="flex h-full flex-col p-6 md:p-7">
                        <p className="text-[10px] font-semibold uppercase tracking-[1.3px] opacity-80">
                          Standard
                        </p>
                        <h3 className="heading-lg mt-2 max-w-[16ch]">{card.title}</h3>
                        <p className="body-sm mt-3 max-w-[42ch] opacity-90">{card.description}</p>
                        <div className="mt-6 grid flex-1 grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr]">
                          <p className="font-display text-[clamp(2.5rem,4.6vw,3.9rem)] font-semibold leading-none">
                            {card.metric}
                          </p>
                          <div
                            className={cn(
                              "relative w-full overflow-hidden rounded-md border border-foreground/10",
                              card.feature ? "h-[170px] md:h-[190px]" : "h-[150px] md:h-[165px]",
                            )}
                          >
                            <Image src={card.image} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col justify-end p-5 md:p-6">
                        <p className="font-display text-[clamp(1.75rem,2.4vw,2.1rem)] font-semibold leading-none">
                          {card.metric}
                        </p>
                        <h3 className="mono-spec mt-2 max-w-[14ch] uppercase opacity-80">{card.title}</h3>
                        <p className="sr-only">{card.description}</p>
                      </div>
                    )}
                  </motion.div>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={`${card.metric} — ${card.title}`}
                    onMouseEnter={() => setOpen(idx)}
                    onFocus={() => setOpen(idx)}
                    onClick={() => setOpen(idx)}
                    className="absolute inset-0 z-10 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        <Link
          href="/contact"
          className="mt-6 flex items-center justify-center gap-2 rounded-pill bg-foreground px-6 py-4 text-center text-background transition-opacity hover:opacity-90"
        >
          <span className="body-sm font-medium">
            Punya ruang yang ingin diintegrasikan? Konsultasikan dengan tim ACTA.
          </span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} className="shrink-0" />
        </Link>
      </div>
    </section>
  );
}

// On mobile the horizontal bar chart collapses to full, natural-height cards.
function MobileCard({ card }: { card: ImpactCard }) {
  return (
    <div className={cn("overflow-hidden rounded-lg p-6", card.bg, card.text)}>
      <p className="text-[10px] font-semibold uppercase tracking-[1.3px] opacity-80">Standard</p>
      <h3 className="heading-lg mt-2">{card.title}</h3>
      <p className="body-sm mt-3 opacity-90">{card.description}</p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="font-display text-[clamp(2.5rem,13vw,3.5rem)] font-semibold leading-none">
          {card.metric}
        </p>
        <div className="relative h-[112px] w-2/5 shrink-0 overflow-hidden rounded-md border border-foreground/10">
          <Image src={card.image} alt="" fill sizes="40vw" className="object-cover" />
        </div>
      </div>
    </div>
  );
}
