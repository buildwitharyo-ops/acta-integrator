"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ActaLogo } from "@/components/shared/ActaLogo";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WhatsAppCTA } from "@/components/shared/WhatsAppCTA";
import { SignalMeter } from "@/components/shared/SignalMeter";
import { categoryIcon, solutionIcon } from "@/components/shared/section-icons";
import { cn } from "@/lib/utils";

type NavSolution = {
  slug: string | null;
  name: string | null;
  tier: string | null;
  value_prop: string | null;
};
type NavCategory = {
  slug: string | null;
  name: string | null;
  description: string | null;
  count: number;
  image: string | null;
};

const LINKS = [
  { label: "Learn", href: "/learn" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar({
  solutions,
  categories,
  contact,
}: {
  solutions: NavSolution[];
  categories: NavCategory[];
  contact: { email: string | null; instagram: string | null };
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<"solutions" | "products" | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const core = solutions.filter((s) => s.tier === "core");
  const supporting = solutions.filter((s) => s.tier === "supporting");
  const solid = scrolled || open !== null;

  return (
    <header
      onMouseLeave={() => setOpen(null)}
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-200",
        solid
          ? "border-border bg-background/85 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-[72px] items-center justify-between">
        <Link href="/" aria-label="ACTA — Beranda" className="shrink-0">
          <ActaLogo className="h-9 md:h-10" priority />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <MegaTrigger
            label="Solutions"
            href="/solutions"
            active={open === "solutions"}
            onOpen={() => setOpen("solutions")}
          />
          <MegaTrigger
            label="Products"
            href="/products"
            active={open === "products"}
            onOpen={() => setOpen("products")}
          />
          {LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} active={pathname.startsWith(l.href)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <WhatsAppCTA context="general" label="Konsultasi" size="sm" emphasis="orbit" />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Sheet open={mobile} onOpenChange={setMobile}>
            <SheetTrigger
              aria-label="Buka menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-pill ring-1 ring-border"
            >
              <Menu className="h-[18px] w-[18px]" />
            </SheetTrigger>
            <MobileMenu
              core={core}
              supporting={supporting}
              categories={categories}
              contact={contact}
              onClose={() => setMobile(false)}
            />
          </Sheet>
        </div>
      </div>

      {open === "solutions" && (
        <MegaPanel>
          <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <p className="mono-label mb-3 text-muted-foreground">Core Solutions</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {core.map((s) => (
                  <SolutionRow key={s.slug} solution={s} />
                ))}
              </ul>
            </div>
            <div className="lg:border-l lg:border-border lg:pl-8">
              <p className="mono-label mb-3 text-muted-foreground">Supporting</p>
              <ul className="grid gap-1">
                {supporting.map((s) => (
                  <SolutionRow key={s.slug} solution={s} compact />
                ))}
              </ul>
            </div>
          </div>
          <MegaFooter>
            <Link href="/solutions" className="mono-label text-accent-text">
              Lihat semua solusi →
            </Link>
          </MegaFooter>
        </MegaPanel>
      )}

      {open === "products" && <ProductsMega categories={categories} />}
    </header>
  );
}

function SolutionRow({ solution, compact }: { solution: NavSolution; compact?: boolean }) {
  return (
    <li>
      <Link
        href={`/solutions/${solution.slug}`}
        className="group flex items-start gap-3 rounded-md p-2.5 transition-colors hover:bg-card"
      >
        <HugeiconsIcon
          icon={solutionIcon(solution.slug)}
          size={22}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-text"
        />
        <span className="min-w-0">
          <span className="heading-md block transition-colors group-hover:text-accent-text">
            {solution.name}
          </span>
          {!compact ? (
            <span className="body-sm mt-0.5 line-clamp-1 text-muted-foreground">{solution.value_prop}</span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

function ProductsMega({ categories }: { categories: NavCategory[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? null);
  const current = categories.find((c) => c.slug === active) ?? categories[0];

  return (
    <MegaPanel>
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="mono-label mb-3 text-muted-foreground">{categories.length} Kategori</p>
          <ul>
            {categories.map((c, i) => {
              const on = c.slug === current?.slug;
              return (
                <li key={c.slug}>
                  {i > 0 ? <div className="h-px bg-border" /> : null}
                  <Link
                    href={`/products/c/${c.slug}`}
                    onMouseEnter={() => setActive(c.slug)}
                    onFocus={() => setActive(c.slug)}
                    className={cn(
                      "flex items-center gap-3 py-2.5 transition-colors",
                      on ? "text-accent-text" : "text-foreground/85 hover:text-foreground",
                    )}
                  >
                    <HugeiconsIcon icon={categoryIcon(c.slug)} size={20} strokeWidth={1.5} className="shrink-0" />
                    <span className="heading-md flex-1">{c.name}</span>
                    <span className="mono-spec text-muted-foreground">{c.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="lg:border-l lg:border-border lg:pl-8">
          {current ? (
            <Link href={`/products/c/${current.slug}`} className="group block">
              <div className="relative h-[220px] overflow-hidden rounded-md bg-muted">
                {current.image ? (
                  <Image
                    key={current.slug}
                    src={current.image}
                    alt={current.name ? `Perangkat kategori ${current.name}` : "Perangkat AV"}
                    fill
                    sizes="560px"
                    className="object-cover"
                  />
                ) : null}
                <CornerTicks />
              </div>
              <p className="heading-md mt-3 transition-colors group-hover:text-accent-text">{current.name}</p>
              <p className="body-sm mt-1 text-muted-foreground">{current.description}</p>
            </Link>
          ) : null}
        </div>
      </div>
      <MegaFooter>
        <Link href="/products" className="mono-label text-accent-text">
          Lihat Katalog →
        </Link>
        <Link href="/products/compare" className="mono-label text-muted-foreground transition-colors hover:text-foreground">
          Bandingkan Produk
        </Link>
      </MegaFooter>
    </MegaPanel>
  );
}

function MegaTrigger({
  label,
  href,
  active,
  onOpen,
}: {
  label: string;
  href: string;
  active: boolean;
  onOpen: () => void;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      aria-expanded={active}
      onMouseEnter={onOpen}
      onFocus={onOpen}
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-3 py-2 text-[0.95rem] transition-colors",
        active || pathname.startsWith(href) ? "text-foreground" : "text-foreground/80 hover:text-foreground",
      )}
    >
      {label}
      <ChevronDown className={cn("h-4 w-4 transition-transform", active && "rotate-180")} />
    </Link>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-pill px-3 py-2 text-[0.95rem] transition-colors",
        active ? "text-foreground" : "text-foreground/80 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function MegaPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-full border-b border-border bg-background shadow-[0_16px_40px_-16px_rgba(23,24,26,0.12)]">
      <div className="container py-6">{children}</div>
    </div>
  );
}

function MegaFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-center gap-6 border-t border-border pt-3">
      <SignalMeter variant="divider" className="hidden max-w-[160px] flex-1 sm:block" />
      {children}
    </div>
  );
}

function MobileMenu({
  core,
  supporting,
  categories,
  contact,
  onClose,
}: {
  core: NavSolution[];
  supporting: NavSolution[];
  categories: NavCategory[];
  contact: { email: string | null; instagram: string | null };
  onClose: () => void;
}) {
  return (
    <SheetContent side="right" className="flex w-full max-w-sm flex-col p-0">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <SheetTitle asChild>
          <Link href="/" aria-label="ACTA — Beranda" onClick={onClose}>
            <ActaLogo className="h-9" />
          </Link>
        </SheetTitle>
        <button aria-label="Tutup menu" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-pill ring-1 ring-border">
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="solutions" className="border-border">
            <AccordionTrigger className="text-base">Solutions</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {[...core, ...supporting].map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/solutions/${s.slug}`}
                      className="flex items-center gap-3 py-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <HugeiconsIcon icon={solutionIcon(s.slug)} size={20} strokeWidth={1.5} className="shrink-0" />
                      <span className="body-md">{s.name}</span>
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link href="/solutions" className="mono-label text-accent-text">
                    Lihat Semua Solutions →
                  </Link>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="products" className="border-border">
            <AccordionTrigger className="text-base">Products</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/products/c/${c.slug}`}
                      className="flex items-center gap-3 py-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <HugeiconsIcon icon={categoryIcon(c.slug)} size={20} strokeWidth={1.5} className="shrink-0" />
                      <span className="body-md flex-1">{c.name}</span>
                      <span className="mono-spec text-muted-foreground/70">{c.count}</span>
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link href="/products" className="mono-label text-accent-text">
                    Lihat Katalog →
                  </Link>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <ul className="mt-4 space-y-1 border-t border-border pt-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block py-2 text-base text-foreground/90 hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 border-t border-border px-6 py-5">
        <WhatsAppCTA context="general" label="Konsultasi" className="w-full" />
        <div className="flex flex-col gap-1">
          <a href={`mailto:${contact.email ?? "acta.arc@gmail.com"}`} className="mono-spec text-muted-foreground hover:text-foreground">
            {contact.email ?? "acta.arc@gmail.com"}
          </a>
          <a
            href={`https://instagram.com/${(contact.instagram ?? "@acta.integrator").replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-spec text-muted-foreground hover:text-foreground"
          >
            {contact.instagram ?? "@acta.integrator"}
          </a>
        </div>
      </div>
    </SheetContent>
  );
}
