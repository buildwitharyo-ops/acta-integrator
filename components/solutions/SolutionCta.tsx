import Link from "next/link";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";

export function SolutionCta({
  heading,
  solutionName,
  solutionSlug,
  waMessage,
}: {
  heading: string;
  solutionName: string;
  solutionSlug: string;
  waMessage?: string | null;
}) {
  return (
    <section className="container pb-expansive pt-compact">
      <MeterDivider annotation="KONSULTASI" />

      <div className="mt-8 overflow-hidden rounded-[26px] bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[42ch]">
            <p className="mono-label text-background/60">SIAP MULAI?</p>
            <p className="display-md mt-3 text-background">{heading}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <WhatsAppCTA
              context="solution"
              name={solutionName}
              message={waMessage ?? undefined}
              label="Konsultasi via WhatsApp"
              emphasis="orbit"
              size="lg"
            />
            <Link
              href={`/contact?solution=${solutionSlug}`}
              className="inline-flex h-[52px] items-center justify-center rounded-pill px-8 text-base font-medium text-background ring-1 ring-inset ring-background/30 transition-colors hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
            >
              Kirim Kebutuhan via Form
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
