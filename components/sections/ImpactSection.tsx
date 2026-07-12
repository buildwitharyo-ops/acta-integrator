"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
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
// business stats) — replaces the demo's SaaS conversion/churn metrics.
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
    bg: "bg-card ring-1 ring-inset ring-border",
    text: "text-foreground",
  },
  {
    metric: "24/7",
    title: "Support beyond handover",
    description:
      "Monitoring jarak jauh dan dukungan on-site yang responsif menjaga sistem tetap berjalan jauh setelah instalasi selesai.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    bg: "dark bg-card",
    text: "text-foreground",
    feature: true,
  },
  {
    metric: "100%",
    title: "Documented & trained",
    description:
      "Setiap project diserahterimakan dengan dokumentasi as-built dan pelatihan operator — tim Anda benar-benar menguasai ruangnya.",
    image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80",
    bg: "bg-primary/[0.12] ring-1 ring-inset ring-primary/25",
    text: "text-foreground",
  },
];

const CLOSED_HEIGHTS = [300, 340, 400, 440];

export function ImpactSection() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 220, damping: 28 };
  const heightSpring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 30 };

  const move = (delta: number) => setOpen((o) => (o + delta + CARDS.length) % CARDS.length);

  return (
    <section className="w-full py-section">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div className="max-w-[620px]">
            <p className="mono-label text-accent-text">05 / WHAT WE DELIVER</p>
            <h2 className="display-lg mt-3">Results that speak for themselves</h2>
            <p className="body-lg mt-4 max-w-[560px] text-muted-foreground">
              Dari akustik ruang sampai dukungan pasca-instalasi — dampak yang bisa diukur di setiap
              sistem yang kami serahkan.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Sorotan sebelumnya"
              className="flex h-10 w-10 items-center justify-center rounded-pill text-foreground/70 ring-1 ring-border transition-colors hover:bg-card hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Sorotan berikutnya"
              className="flex h-10 w-10 items-center justify-center rounded-pill text-foreground/70 ring-1 ring-border transition-colors hover:bg-card hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-2">
          {CARDS.map((card, idx) => {
            const isOpen = open === idx;
            return (
              <motion.div
                key={idx}
                animate={{ flex: isOpen ? 4.8 : 1.5 }}
                transition={spring}
                className={cn(
                  "relative h-[320px] overflow-hidden rounded-lg md:h-auto",
                  card.bg,
                  card.text,
                )}
              >
                <motion.div
                  animate={{ height: isOpen ? 470 : CLOSED_HEIGHTS[idx] }}
                  transition={heightSpring}
                  className="h-full"
                >
                  {isOpen ? (
                    <div className="flex h-full flex-col p-6 md:p-8">
                      <p className="text-[10px] font-semibold uppercase tracking-[1.3px] opacity-80">
                        Standard
                      </p>
                      <h3 className="heading-lg mt-2 max-w-[16ch]">{card.title}</h3>
                      <p className="body-sm mt-3 max-w-[42ch] opacity-90">{card.description}</p>
                      <div className="mt-6 grid flex-1 grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr]">
                        <p className="font-display text-[clamp(2.75rem,5vw,4.25rem)] font-semibold leading-none">
                          {card.metric}
                        </p>
                        <div
                          className={cn(
                            "relative w-full overflow-hidden rounded-md border border-black/10",
                            card.feature ? "h-[190px] md:h-[210px]" : "h-[160px] md:h-[180px]",
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
                      <p className="mono-spec mt-2 max-w-[14ch] uppercase opacity-80">{card.title}</p>
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
