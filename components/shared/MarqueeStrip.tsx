import { cn } from "@/lib/utils";

export type MarqueeLogo = {
  name: string;
  src: string;
};

function LogoItem({ logo }: { logo: MarqueeLogo }) {
  return (
    <span
      role="img"
      aria-label={logo.name}
      title={logo.name}
      className="block h-10 w-[120px] shrink-0 bg-foreground/45 transition-colors duration-200 hover:bg-foreground/80"
      style={{
        maskImage: `url(${logo.src})`,
        WebkitMaskImage: `url(${logo.src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
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
      className={cn("flex shrink-0 items-center gap-12 pr-12", className)}
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
      <div className="relative overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)] motion-reduce:[mask-image:none]">
        <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center motion-reduce:px-6">
          <LogoRow
            logos={logos}
            className="motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8 motion-reduce:pr-0"
          />
          <LogoRow logos={logos} ariaHidden className="motion-reduce:hidden" />
        </div>
      </div>
    </section>
  );
}
