import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/JsonLd";
import { LeadForm } from "@/components/shared/LeadForm";
import { WaLink } from "@/components/shared/WaLink";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { contactPageNode } from "@/lib/jsonld";
import { getPageSections } from "@/lib/queries/pages";
import { getSiteSettings } from "@/lib/queries/settings";
import { buildMetadata } from "@/lib/seo";
import { formatWaDisplay } from "@/lib/wa";

export const metadata: Metadata = buildMetadata({
  title: "Kontak — Konsultasi & Penawaran | ACTA",
  description:
    "Ceritakan kebutuhan sistem AV Anda — tim ACTA bantu petakan opsi sistem dan anggarannya. Konsultasi awal gratis, tanpa komitmen.",
  path: "/contact",
});

type Intro = { eyebrow?: string; headline?: string; subheadline?: string };

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <p className="mono-label text-muted-foreground">{label}</p>
      <div className="mt-1.5 body-md text-foreground">{children}</div>
    </div>
  );
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ solution?: string }>;
}) {
  const [sections, settings, sp] = await Promise.all([
    getPageSections("contact"),
    getSiteSettings(),
    searchParams,
  ]);

  const intro = (sections["intro"] ?? {}) as Intro;
  const solutionSlug = sp.solution;
  const email = settings?.email ?? "acta.arc@gmail.com";
  const whatsapp = settings?.whatsapp_number || "6281563905555";
  const instagram = settings?.instagram ?? "@acta.integrator";
  const location = [settings?.address, settings?.city].filter(Boolean).join(", ") || "Tangerang, Indonesia";

  return (
    <>
      <JsonLd data={contactPageNode({ path: "/contact", email, whatsapp })} />

      <section className="container py-section">
        <header className="max-w-3xl">
          <p className="mono-label text-accent-text">{intro.eyebrow ?? "CONTACT"}</p>
          <h1 className="display-xl mt-4 text-balance">{intro.headline ?? "Let's Talk."}</h1>
          <p className="body-lg mt-5 max-w-[54ch] text-muted-foreground">
            {intro.subheadline ??
              "Ceritakan kebutuhan sistem AV Anda — tim kami bantu petakan opsi sistem dan anggarannya. Gratis, tanpa komitmen."}
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
          <div className="max-w-xl">
            {solutionSlug ? (
              <p className="mono-label mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
                KONTEKS: {solutionSlug.replace(/-/g, " ").toUpperCase()}
              </p>
            ) : null}
            <LeadForm formType="contact_form" solutionSlug={solutionSlug} />
          </div>

          <aside>
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="mono-label text-accent-text">LANGSUNG</p>
              <p className="body-sm mt-2 text-muted-foreground">
                Butuh jawaban cepat? Chat tim kami — respons di jam kerja.
              </p>
              <div className="mt-4">
                <WhatsAppCTA context="general" label="Chat via WhatsApp" emphasis="orbit" className="w-full [&>span]:w-full" />
              </div>
            </div>

            <div className="mt-6 px-1">
              <InfoRow label="WHATSAPP">
                <WaLink href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} waContext="contact_info" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-text">
                  {formatWaDisplay(whatsapp)}
                </WaLink>
              </InfoRow>
              <InfoRow label="EMAIL">
                <a href={`mailto:${email}`} className="transition-colors hover:text-accent-text">
                  {email}
                </a>
              </InfoRow>
              <InfoRow label="INSTAGRAM">
                <a href={`https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-text">
                  {instagram}
                </a>
              </InfoRow>
              <InfoRow label="LOKASI">{location}</InfoRow>
              {typeof settings?.business_hours === "string" && settings.business_hours ? (
                <InfoRow label="JAM KERJA">{settings.business_hours}</InfoRow>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
