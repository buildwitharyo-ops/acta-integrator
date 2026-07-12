import Image from "next/image";
import Link from "next/link";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { Button } from "@/components/ui/button";

export type HeroContent = {
  eyebrow?: string;
  headline_1?: string;
  headline_2?: string;
  subheadline?: string;
  cta_primary?: { label?: string; href?: string };
  cta_secondary?: { label?: string; href?: string };
  annotations?: { label?: string }[];
};

const FALLBACK =
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=2400&q=80&auto=format&fit=crop";

export function Hero({ content, image }: { content: HeroContent; image?: string | null }) {
  return (
    <section className="dark relative flex min-h-[92svh] items-end overflow-hidden text-foreground">
      <Image
        src={image ?? FALLBACK}
        alt="Ruang komersial dengan sistem audio visual terinstal"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/65 to-transparent" />
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-30" />

      <div className="container relative z-10 pb-16 md:pb-24">
        <p className="mono-label text-accent-text">
          {content.eyebrow ?? "01 / COMMERCIAL AV — TANGERANG, ID"}
        </p>

        <h1 className="display-xl mt-4 max-w-[16ch]">
          {content.headline_1 ?? "AV Systems, Engineered."}
          <br />
          {content.headline_2 ?? "Not Just Installed."}
        </h1>

        <p className="body-lg mt-6 max-w-[52ch] text-foreground/80">
          {content.subheadline ??
            "ACTA merancang, memasang, dan mendukung sistem audio visual terintegrasi untuk meeting room, auditorium, ballroom, hingga gedung komersial — end-to-end, satu partner."}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <WhatsAppCTA
            context="general"
            label={content.cta_primary?.label ?? "Konsultasi Gratis"}
            size="lg"
            emphasis="orbit"
          />
          <Button asChild variant="glass" size="lg">
            <Link href={content.cta_secondary?.href ?? "/solutions"}>
              {(content.cta_secondary?.label ?? "Lihat Solutions").replace(/\s*→\s*$/, "")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
