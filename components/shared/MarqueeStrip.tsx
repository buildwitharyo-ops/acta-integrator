import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MarqueeLogo = {
  name: string;
  mark?: ReactNode;
};

function LogoItem({ logo }: { logo: MarqueeLogo }) {
  return (
    <span className="flex shrink-0 items-center text-foreground/40">
      {logo.mark ?? (
        <span className="font-display text-xl font-medium tracking-[0.02em]">
          {logo.name}
        </span>
      )}
    </span>
  );
}

function LogoRow({
  logos,
  ariaHidden,
  className,
}: {
  logos: MarqueeLogo[];
  ariaHidden?: boolean;
  className?: string;
}) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className={cn("flex shrink-0 items-center gap-14 pr-14", className)}
    >
      {logos.map((logo, i) => (
        <li key={`${logo.name}-${i}`}>
          <LogoItem logo={logo} />
        </li>
      ))}
    </ul>
  );
}

export function MarqueeStrip({
  logos,
  heading = "Technology We Work With",
  className,
}: {
  logos: MarqueeLogo[];
  heading?: string;
  className?: string;
}) {
  return (
    <section className={cn("border-y border-border", className)}>
      <div className="container pt-8">
        <p className="mono-label text-muted-foreground">{heading}</p>
      </div>
      <div className="relative overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
        <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-14 motion-reduce:gap-y-6 motion-reduce:px-6">
          <LogoRow logos={logos} />
          <LogoRow logos={logos} ariaHidden className="motion-reduce:hidden" />
        </div>
      </div>
    </section>
  );
}
