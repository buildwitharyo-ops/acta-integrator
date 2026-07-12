import Link from "next/link";
import { ParticleNetwork } from "@/components/ui/particle-network";
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

export function Hero({
  content,
}: {
  content: HeroContent;
  image?: string | null;
}) {
  return (
    <section className="relative flex min-h-[92svh] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <ParticleNetwork />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,hsl(var(--background)/0.75))]" />

      <div className="container relative z-10 flex flex-col items-center py-24 text-center">
        <p className="mono-label text-accent-text">
          {content.eyebrow ?? "COMMERCIAL AV / MULTIMEDIA SYSTEMS INTEGRATOR"}
        </p>

        <h1 className="display-xl mt-5 max-w-[18ch]">
          {content.headline_1 ?? "Technology,"}
          <br />
          {content.headline_2 ?? "Without Friction."}
        </h1>

        <p className="body-lg mt-6 max-w-[54ch] text-foreground/80">
          {content.subheadline ??
            "We design, integrate, and support AV environments that feel effortless to use, reliable to operate, and built for the way people work."}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <WhatsAppCTA
            context="general"
            label={content.cta_primary?.label ?? "Konsultasi Gratis"}
            size="lg"
            emphasis="orbit"
          />
          <Button asChild variant="glass" size="lg">
            <Link href={content.cta_secondary?.href ?? "/solutions"}>
              {(content.cta_secondary?.label ?? "Lihat Solutions").replace(
                /\s*→\s*$/,
                "",
              )}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
