import { mediaUrl } from "@/lib/media";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";
import { getSolutionBySlug, getSolutions } from "@/lib/queries/solutions";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Solution";

export async function generateStaticParams() {
  const solutions = await getSolutions();
  return solutions.filter((s) => s.slug).map((s) => ({ slug: s.slug! }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);
  // Skip placeholder heroes (03 §7.3: never imply a real project with TO-REPLACE imagery).
  const heroUrl =
    solution && !solution.hero_is_placeholder
      ? mediaUrl({ storage_path: solution.hero_image_path, external_url: solution.hero_image_url_ext })
      : null;
  return renderOgImage({
    eyebrow: `Solution / ${solution?.name ?? slug}`,
    title: solution?.seo_title ?? solution?.name ?? "Solusi AV",
    subtitle: solution?.value_prop ?? null,
    heroUrl,
  });
}
