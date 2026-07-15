import Link from "next/link";
import { SignalMeter } from "./SignalMeter";
import { ActaLogo } from "./ActaLogo";
import { WaLink } from "@/components/shared/WaLink";
import { buildWaLink } from "@/lib/wa";

type FooterSettings = {
  tagline: string | null;
  footer_description: string | null;
  email: string | null;
  whatsapp_number: string | null;
  instagram: string | null;
  city: string | null;
};

type FooterSolution = { slug: string | null; name: string | null };

const RESOURCES = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Katalog Produk", href: "/products" },
  { label: "News", href: "/news" },
  { label: "Learn with ACTA", href: "/learn" },
];

export function Footer({
  settings,
  solutions,
}: {
  settings: FooterSettings | null;
  solutions: FooterSolution[];
}) {
  const year = new Date().getFullYear();
  const waHref = buildWaLink({ context: "general" });

  return (
    <footer className="dark bg-background text-foreground">
      <div className="container py-compact">
        <div className="mb-9 flex items-center gap-4">
          <SignalMeter variant="footer" className="flex-1" />
          <span className="mono-label shrink-0 text-muted-foreground">
            OUTPUT — TANGERANG, ID
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" aria-label="ACTA — Beranda" className="inline-block">
              <ActaLogo className="h-10" />
            </Link>
            <p className="heading-lg mt-4 max-w-[16ch] text-foreground">
              {settings?.tagline ?? "Smarter Systems. Real Impact."}
            </p>
            <p className="body-sm mt-3 max-w-[42ch] text-muted-foreground">
              {settings?.footer_description ??
                "Integrator sistem audio visual komersial untuk ruang rapat, auditorium, hall, dan gedung komersial di Jakarta & Tangerang."}
            </p>
            <p className="mono-spec mt-4 text-muted-foreground">
              PT ACTA SOLUSI TEKNOLOGI — {(settings?.city ?? "Tangerang, Indonesia").toUpperCase()}
            </p>
          </div>

          <FooterColumn label="Solutions">
            {solutions.map((s) => (
              <FooterLink key={s.slug} href={`/solutions/${s.slug}`}>
                {s.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn label="Company & Resources">
            {RESOURCES.map((r) => (
              <FooterLink key={r.href} href={r.href}>
                {r.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn label="Kontak">
            <li>
              <WaLink href={waHref} waContext="footer" target="_blank" rel="noopener noreferrer" className="mono-spec inline-block py-1 text-muted-foreground transition-colors hover:text-foreground">
                {formatWa(settings?.whatsapp_number)}
              </WaLink>
            </li>
            <li>
              <a href={`mailto:${settings?.email ?? "acta.arc@gmail.com"}`} className="mono-spec inline-block py-1 text-muted-foreground transition-colors hover:text-foreground">
                {settings?.email ?? "acta.arc@gmail.com"}
              </a>
            </li>
            <li>
              <a href={`https://instagram.com/${(settings?.instagram ?? "@acta.integrator").replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="mono-spec inline-block py-1 text-muted-foreground transition-colors hover:text-foreground">
                {settings?.instagram ?? "@acta.integrator"}
              </a>
            </li>
            <li className="mono-spec pt-1 text-muted-foreground/70">
              {settings?.city ?? "Tangerang, Indonesia"}
            </li>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="caption text-muted-foreground">
            © {year} PT ACTA Solusi Teknologi. All rights reserved.
          </p>
          <p className="caption text-muted-foreground/70">
            Instalasi Audio Visual Profesional · Integrator AV Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mono-label mb-4 text-muted-foreground">{label}</p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="body-sm inline-block py-1 text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}

function formatWa(number?: string | null) {
  const digits = (number ?? "6281563905555").replace(/\D/g, "");
  const rest = digits.startsWith("62") ? digits.slice(2) : digits;
  return `+62 ${rest.replace(/(\d{3})(\d{4})(\d+)/, "$1 $2 $3")}`;
}
