import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { MarqueeStrip } from "@/components/shared/MarqueeStrip";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { SignalChainDiagram } from "@/components/shared/SignalChainDiagram";
import { SignalMeter } from "@/components/shared/SignalMeter";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";

const SWATCHES = [
  { token: "background", note: "#F5F4F0 / #14161A", cls: "bg-background" },
  { token: "card", note: "surface", cls: "bg-card" },
  { token: "muted", note: "soft panel", cls: "bg-muted" },
  { token: "border", note: "hairline", cls: "bg-border" },
  { token: "foreground", note: "ink", cls: "bg-foreground" },
  { token: "muted-foreground", note: "meta text", cls: "bg-muted-foreground" },
  { token: "primary", note: "Signal Amber #D9962E", cls: "bg-primary" },
  { token: "accent-hover", note: "#E8A33D", cls: "bg-accent-hover" },
  { token: "status", note: "live #3DBE7B", cls: "bg-status" },
  { token: "destructive", note: "error", cls: "bg-destructive" },
];

const TYPE = [
  { cls: "display-xl", label: "display-xl · GS 700", sample: "Smarter Systems" },
  { cls: "display-lg", label: "display-lg · GS 600", sample: "Real Impact" },
  { cls: "display-md", label: "display-md · GS 600", sample: "Smart Meeting Room" },
  { cls: "heading-lg", label: "heading-lg · GS 600", sample: "Divisible Ballroom" },
  { cls: "heading-md", label: "heading-md · GS 600", sample: "QSC K12.2" },
  { cls: "body-lg", label: "body-lg · Inter 400", sample: "Partner teknologi audio visual komersial." },
  { cls: "body-md", label: "body-md · Inter 400", sample: "Integrator sistem AV untuk ruang rapat dan auditorium." },
  { cls: "body-sm", label: "body-sm · Inter 400", sample: "Meta, helper, dan keterangan form." },
  { cls: "mono-label", label: "mono-label · Plex 500", sample: "TECHNOLOGY WE WORK WITH" },
  { cls: "mono-spec", label: "mono-spec · Plex 400", sample: "RT60 0.6s · SPL 98dB · P3.9" },
  { cls: "caption", label: "caption · Inter 400", sample: "Foto: TO-REPLACE (Unsplash)." },
];

const BRANDS = [
  "Absen",
  "BenQ",
  "Samsung",
  "QSC",
  "Shure",
  "Logitech",
  "Crestron",
  "BrightSign",
].map((name) => ({ name }));

const CHAIN = [
  { label: "Source", sublabel: "Mic, kamera, media player", annotation: "IN 8ch" },
  { label: "Process", sublabel: "DSP, matrix, kontrol", annotation: "DSP 0.6ms" },
  { label: "Distribute", sublabel: "AV over IP, HDBaseT", annotation: "1G/PoE" },
  { label: "Output", sublabel: "Display, line array, LED", annotation: "SPL 98dB" },
];

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="container">
      <div className="mb-8 flex items-baseline gap-4">
        <span className="mono-spec text-muted-foreground">{index}</span>
        <h2 className="display-md">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main className="min-h-screen pb-32">
      <header className="container flex items-center justify-between border-b border-border py-6">
        <div>
          <p className="mono-label text-accent-text">ACTA / DESIGN SYSTEM</p>
          <p className="body-sm mt-1 text-muted-foreground">
            Fase 1 · sementara — dihapus sebelum launch
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="space-y-6 pt-16">
        <Section index="01" title="Warna">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {SWATCHES.map((s) => (
              <div
                key={s.token}
                className="rounded-md bg-card p-3 ring-1 ring-border"
              >
                <div
                  className={`h-16 w-full rounded-sm ring-1 ring-border/60 ${s.cls}`}
                />
                <p className="mono-spec mt-3 text-foreground">{s.token}</p>
                <p className="caption text-muted-foreground">{s.note}</p>
              </div>
            ))}
          </div>
          <p className="body-sm mt-6 max-w-[52ch] text-muted-foreground">
            Amber sebagai teks di light memakai{" "}
            <span className="mono-spec text-accent-text">accent-text</span> —
            bukan <span className="mono-spec">primary</span> (kontras AA).
          </p>
        </Section>

        <MeterDivider annotation="SEC 02 / TYPE" className="container my-16 md:my-24" />

        <Section index="02" title="Tipografi">
          <div className="space-y-8">
            {TYPE.map((t) => (
              <div
                key={t.cls}
                className="grid gap-2 border-b border-border pb-6 md:grid-cols-[220px_1fr] md:items-baseline"
              >
                <span className="mono-spec text-muted-foreground">{t.label}</span>
                <span className={t.cls}>{t.sample}</span>
              </div>
            ))}
          </div>
        </Section>

        <MeterDivider annotation="SEC 03 / BUTTONS" className="container my-16 md:my-24" />

        <Section index="03" title="Tombol & CTA">
          <div className="flex flex-wrap items-center gap-4">
            <Button>Konsultasi Gratis</Button>
            <Button variant="secondary">Lihat Solusi</Button>
            <Button variant="pill">Bandingkan Produk</Button>
            <Button variant="ghost">Selengkapnya</Button>
            <Button variant="destructive">Hapus</Button>
            <Button variant="link">Pelajari lebih lanjut</Button>
            <WhatsAppCTA context="general" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="mono-label inline-flex h-6 items-center rounded-pill bg-muted px-3 text-muted-foreground">
              Neutral
            </span>
            <span className="mono-label inline-flex h-6 items-center rounded-pill bg-primary/12 px-3 text-accent-text">
              Baru
            </span>
            <span className="mono-label inline-flex h-6 items-center gap-2 rounded-pill bg-status/12 px-3 text-status-text">
              <span className="h-1.5 w-1.5 rounded-pill bg-status motion-reduce:animate-none animate-status-pulse" />
              Tersedia
            </span>
          </div>
        </Section>

        <MeterDivider annotation="SEC 04 / MOTIF" className="container my-16 md:my-24" />

        <Section index="04" title="Signal Meter & chrome teknik">
          <div className="space-y-10">
            <div className="space-y-3">
              <span className="mono-spec text-muted-foreground">variant divider</span>
              <SignalMeter variant="divider" />
            </div>
            <div className="space-y-3">
              <span className="mono-spec text-muted-foreground">variant footer</span>
              <SignalMeter variant="footer" />
            </div>
            <div className="relative aspect-[16/10] max-w-2xl overflow-hidden rounded-sm bg-muted p-4">
              <CornerTicks />
              <span className="mono-spec absolute left-4 top-4 text-muted-foreground">
                SPL 98dB
              </span>
              <span className="mono-spec absolute bottom-4 right-4 text-muted-foreground">
                P3.9
              </span>
              <span className="body-sm absolute inset-0 flex items-center justify-center text-muted-foreground">
                media 16/10 · corner registration ticks
              </span>
            </div>
          </div>
        </Section>

        <MeterDivider annotation="SEC 05 / CHAIN" className="container my-16 md:my-24" />

        <Section index="05" title="Signal chain diagram">
          <SignalChainDiagram stages={CHAIN} />
        </Section>

        <div className="my-16 md:my-24">
          <MarqueeStrip logos={BRANDS} />
        </div>

        <Section index="06" title="Tekstur">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="texture-paper flex aspect-[16/9] items-center justify-center rounded-md bg-card ring-1 ring-border">
              <span className="mono-label text-muted-foreground">texture-paper</span>
            </div>
            <div className="texture-grid flex aspect-[16/9] items-center justify-center rounded-md bg-card ring-1 ring-border">
              <span className="mono-label text-muted-foreground">texture-grid</span>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
