import Link from "next/link";
import { SignalMeter } from "@/components/shared/SignalMeter";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { Button } from "@/components/ui/button";
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
  const contact = [
    settings?.email ?? "acta.arc@gmail.com",
    formatWaDisplay(settings?.whatsapp_number),
    settings?.city ?? "Tangerang, Indonesia",
    settings?.instagram ?? "@acta.integrator",
  ].join(" · ");

  return (
    <section className="dark relative bg-card text-foreground">
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="container relative py-expansive text-center">
        <SignalMeter variant="footer" className="mx-auto mb-10 max-w-[440px]" />
        <h2 className="display-xl mx-auto max-w-[16ch]">
          {content.headline ?? "Have a Project? Let's Talk."}
        </h2>
        <p className="body-lg mx-auto mt-5 max-w-[48ch] text-muted-foreground">
          {content.subheadline ??
            "Ceritakan kebutuhan ruang Anda — tim ACTA bantu petakan opsi sistem dan anggarannya. Gratis, tanpa komitmen."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <WhatsAppCTA context="general" label="Konsultasi via WhatsApp" size="lg" emphasis="orbit" />
          <Button asChild variant="glass" size="lg">
            <Link href="/contact">Kirim Kebutuhan</Link>
          </Button>
        </div>
        <p className="mono-spec mx-auto mt-10 max-w-[64ch] text-muted-foreground">{contact}</p>
      </div>
    </section>
  );
}
