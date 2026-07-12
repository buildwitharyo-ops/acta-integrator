import Image from "next/image";
import Link from "next/link";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { SignalMeter } from "@/components/shared/SignalMeter";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Solution = {
  slug: string | null;
  name: string | null;
  tier: string | null;
  value_prop: string | null;
  hero_image_path: string | null;
  hero_image_url_ext: string | null;
  hero_image_alt: string | null;
};

const CORE_SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-8", "lg:col-span-4", "lg:col-span-5"];
const CORE_ANNOTATIONS: Record<string, string> = {
  "smart-meeting-room": "ONE-TOUCH JOIN",
  "auditorium-performance-hall": "RT60 0.6s",
  "divisible-room-multipurpose-hall": "ZONE A/B/C",
  "pa-commercial-sound-system": "100V LINE",
  "smart-classroom-training-room": "4K TOUCH",
};

export function SolutionsBento({
  content,
  solutions,
}: {
  content: { headline?: string; subheadline?: string };
  solutions: Solution[];
}) {
  const core = solutions.filter((s) => s.tier === "core").slice(0, 5);
  const supporting = solutions.filter((s) => s.tier === "supporting").slice(0, 3);

  return (
    <section className="container py-section">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono-label text-accent-text">02 / SOLUTIONS</p>
          <h2 className="display-lg mt-3 max-w-[16ch]">
            {content.headline ?? "A Solution for Every Space."}
          </h2>
        </div>
        <p className="body-lg max-w-[38ch] text-muted-foreground">
          {content.subheadline ??
            "Sistem terintegrasi yang dirancang sesuai karakter ruang dan cara organisasi Anda bekerja."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {core.map((s, i) => (
          <CoreCard key={s.slug} solution={s} className={CORE_SPANS[i]} />
        ))}
        <div className="rounded-[24px] bg-card p-6 ring-1 ring-border lg:col-span-7">
          <p className="mono-label mb-4 text-muted-foreground">Supporting</p>
          <ul>
            {supporting.map((s, i) => (
              <li key={s.slug}>
                {i > 0 && <div className="my-4 h-px bg-border" />}
                <Link
                  href={`/solutions/${s.slug}`}
                  className="flex items-baseline gap-3 transition-colors hover:text-accent-text"
                >
                  <span className="mono-spec text-muted-foreground">
                    S-{String(i + 6).padStart(2, "0")}
                  </span>
                  <span className="heading-md">{s.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CoreCard({ solution, className }: { solution: Solution; className?: string }) {
  const img = mediaUrl({
    storage_path: solution.hero_image_path,
    external_url: solution.hero_image_url_ext,
  });
  const annotation = solution.slug ? CORE_ANNOTATIONS[solution.slug] : undefined;

  return (
    <Link
      href={`/solutions/${solution.slug}`}
      className={cn(
        "dark group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-[24px] bg-muted p-6 text-foreground",
        className,
      )}
    >
      {img ? (
        <Image
          src={img}
          alt={solution.hero_image_alt ?? solution.name ?? "Solusi ACTA"}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
      <CornerTicks />
      <div className="relative">
        {annotation ? <span className="mono-spec text-foreground/70">{annotation}</span> : null}
        <p className="heading-lg mt-1">{solution.name}</p>
        <p className="body-sm mt-1 line-clamp-1 text-foreground/70">{solution.value_prop}</p>
        <SignalMeter
          variant="divider"
          className="mt-4 max-w-[90px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>
    </Link>
  );
}
