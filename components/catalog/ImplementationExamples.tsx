import Image from "next/image";
import { mediaUrl } from "@/lib/media";

export type ImplementationProject = {
  public_label: string | null;
  year: number | null;
  location_label: string | null;
  cover_image_path: string | null;
  cover_image_url_ext: string | null;
  cover_image_alt: string | null;
};

// "Contoh Implementasi" (06 §2.4) — real installs, anonymised. Client names never rendered.
export function ImplementationExamples({ projects }: { projects: ImplementationProject[] }) {
  if (!projects.length) return null;

  return (
    <section>
      <h2 className="display-md">Contoh Implementasi</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.slice(0, 2).map((p, i) => {
          const img = mediaUrl({ storage_path: p.cover_image_path, external_url: p.cover_image_url_ext });
          const meta = [p.location_label, p.year].filter(Boolean).join(" · ");
          return (
            <figure key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-[3/2] bg-muted">
                {img ? (
                  <Image
                    src={img}
                    alt={p.cover_image_alt ?? p.public_label ?? "Instalasi ACTA"}
                    fill
                    sizes="(min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <figcaption className="p-4">
                <p className="heading-md">{p.public_label}</p>
                {meta ? <p className="mono-spec mt-1 text-muted-foreground">{meta}</p> : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
