import type { Metadata } from "next";
import { TrackedLink } from "@/components/shared/TrackedLink";
import { JsonLd } from "@/components/shared/JsonLd";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { SolutionsHubGrid } from "@/components/sections/SolutionsHubGrid";
import { itemListNode } from "@/lib/jsonld";
import { getPageSections } from "@/lib/queries/pages";
import { getSolutions } from "@/lib/queries/solutions";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Solusi Audio Visual Komersial per Tipe Ruang | ACTA",
  description:
    "Smart meeting room, auditorium, ballroom hotel, PA gedung, smart classroom, dan lainnya — dirancang, dipasang, dan dirawat oleh satu integrator.",
  path: "/solutions",
});

export default async function SolutionsHubPage() {
  const [solutions, sections] = await Promise.all([
    getSolutions(),
    getPageSections("solutions_hub"),
  ]);

  const intro = (sections["intro"] ?? {}) as { headline?: string; subheadline?: string };

  const itemList = itemListNode(
    solutions
      .filter((s) => s.slug)
      .map((s) => ({ name: s.name ?? s.slug!, path: `/solutions/${s.slug}` })),
  );

  return (
    <>
      <JsonLd data={itemList} />

      <section className="container py-section">
        <header className="max-w-3xl">
          <p className="mono-label text-accent-text">SOLUTIONS — 8 TIPE RUANG</p>
          <h1 className="display-xl mt-4 text-balance">
            {intro.headline ?? "Ruang yang mana yang sedang Anda rancang?"}
          </h1>
          <p className="body-lg mt-5 max-w-[52ch] text-muted-foreground">
            {intro.subheadline ??
              "Setiap tipe ruang punya masalah teknisnya sendiri. Kami merancang sistemnya dari kebutuhan ruang Anda — bukan dari katalog perangkat."}
          </p>
        </header>

        <MeterDivider annotation="SIGNAL CHAIN" className="mt-8" />

        <SolutionsHubGrid solutions={solutions} />
      </section>

      <section className="container pb-expansive">
        <div className="relative overflow-hidden rounded-[26px] bg-foreground px-6 py-12 text-background sm:px-12 sm:py-16">
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[34ch]">
              <p className="mono-label text-background/60">TIDAK YAKIN?</p>
              <p className="display-md mt-3 text-background">
                Belum yakin ruang Anda masuk kategori yang mana?
              </p>
              <p className="body-md mt-3 text-background/70">
                Ceritakan kebutuhannya — kami bantu petakan sistem yang tepat untuk ruang Anda.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <WhatsAppCTA context="general" label="Konsultasi Gratis" emphasis="orbit" size="lg" />
              <TrackedLink
                href="/contact"
                ctaId="solutions_hub_hubungi_tim"
                location="solutions_hub_cta"
                className="inline-flex h-[52px] items-center justify-center rounded-pill px-8 text-base font-medium text-background ring-1 ring-inset ring-background/30 transition-colors hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
              >
                Hubungi Tim
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
