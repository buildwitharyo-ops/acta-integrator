import Image from "next/image";
import { mediaUrl } from "@/lib/media";

type Project = {
  slug: string | null;
  public_label: string | null;
  year: number | null;
  scope_description: string | null;
  scope_chips: string[] | null;
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
};

export function Proof({
  content,
  projects,
}: {
  content: { eyebrow?: string; headline?: string };
  projects: Project[];
}) {
  if (projects.length === 0) return null;

  return (
    <section className="container py-section">
      <p className="mono-label text-accent-text">05 / SELECTED WORK</p>
      <h2 className="display-lg mt-3 max-w-[16ch]">{content.headline ?? "Installed and Working."}</h2>

      <div className="mt-10 space-y-6">
        {projects.slice(0, 2).map((p) => (
          <ProofCard key={p.slug} project={p} />
        ))}
      </div>
    </section>
  );
}

function ProofCard({ project }: { project: Project }) {
  const img = mediaUrl({
    storage_path: project.cover_image_path,
    external_url: project.cover_image_url_ext,
  });
  const chips = project.scope_chips ?? [];
  const eyebrow = chips[0]?.toUpperCase() ?? "SELECTED WORK";
  const scopeChips = chips.slice(1);

  return (
    <div className="grid overflow-hidden rounded-[24px] bg-card ring-1 ring-border lg:grid-cols-2">
      <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[280px]">
        {img ? (
          <Image
            src={img}
            alt="Ilustrasi ruang terpasang"
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
        ) : null}
        <span className="mono-label absolute left-4 top-4 rounded-pill bg-background/80 px-2.5 py-1 text-muted-foreground backdrop-blur-sm">
          FOTO ILUSTRASI
        </span>
      </div>
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="flex items-baseline justify-between gap-4">
          <span className="mono-label text-muted-foreground">{eyebrow}</span>
          {project.year ? <span className="mono-spec text-muted-foreground">{project.year}</span> : null}
        </div>
        <p className="heading-lg mt-3">{project.public_label}</p>
        <p className="body-md mt-3 max-w-[46ch] text-muted-foreground">{project.scope_description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {scopeChips.map((c) => (
            <span key={c} className="mono-spec rounded-pill bg-muted px-3 py-1 text-muted-foreground">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
