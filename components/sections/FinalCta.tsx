import { TrackedLink } from "@/components/shared/TrackedLink";
import { SignalMeter } from "@/components/shared/SignalMeter";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { Button } from "@/components/ui/button";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { formatWaDisplay } from "@/lib/wa";

type Settings = {
  email: string | null;
  whatsapp_number: string | null;
  city: string | null;
  instagram: string | null;
} | null;

export function FinalCta({
  content,
  settings,
}: {
  content: { headline?: string; subheadline?: string };
  settings: Settings;
}) {
  const configuredEmail = settings?.email?.trim();
  const projectEmail = !configuredEmail || configuredEmail.toLowerCase() === "acta.arc@gmail.com"
    ? "admin@actatechnologies.com"
    : configuredEmail;
  const phone = formatWaDisplay(settings?.whatsapp_number);
  const instagram = settings?.instagram ?? "@acta.integrator";
  const heading = content.headline?.trim();
  const description = content.subheadline?.trim();
  // Translate the published default while allowing editors to replace either field.
  const projectTitle = !heading || heading === "Have a Project? Let's Talk."
    ? "Let’s discuss your space"
    : heading;
  const projectIntro = !description || description === "Konsultasikan kebutuhan sistem AV Anda dengan tim ACTA — gratis, tanpa komitmen."
    ? "What does your room need to do? Share the room layout, the activities it needs to support and your target date with our AV team."
    : description;

  return (
    <section lang="en" aria-labelledby="home-contact" className="relative isolate overflow-hidden border-y border-border bg-card text-foreground">
      <DottedSurface />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_center,hsl(var(--card)/0.85),transparent_75%)]"
      />
      <div className="container relative z-10 py-section">
        <SignalMeter variant="footer" className="mb-9 max-w-48" />
        <div className="grid items-end gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 id="home-contact" className="display-lg text-balance">{projectTitle}</h2>
            <p className="body-lg mt-4 max-w-[48ch] text-foreground/85">{projectIntro}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <WhatsAppCTA context="general" label="Chat on WhatsApp" size="lg" emphasis="orbit" />
            <Button asChild variant="glass" size="lg">
              <TrackedLink href="/contact" ctaId="final_cta_kirim_kebutuhan" location="home_final_cta">
                Send a project brief
              </TrackedLink>
            </Button>
          </div>
        </div>
        <address className="mt-10 flex flex-wrap items-center gap-x-7 border-t border-border pt-3 text-sm not-italic text-muted-foreground">
          <a href={`mailto:${projectEmail}`} className="inline-flex min-h-11 flex-wrap items-center gap-x-2 hover:underline"><span>Project email</span>{projectEmail}</a>
          <a href={`tel:+${phone.replace(/\D/g, "")}`} className="inline-flex min-h-11 items-center hover:underline">{phone}</a>
          <a href={`https://instagram.com/${instagram.replace(/^@/, "")}`} className="inline-flex min-h-11 items-center hover:underline">{instagram}</a>
          <span className="inline-flex min-h-11 items-center lg:ml-auto">{settings?.city ?? "Jakarta, Indonesia"}</span>
        </address>
      </div>
    </section>
  );
}
