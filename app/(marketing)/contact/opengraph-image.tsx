import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Contact";

export default function Image() {
  return renderOgImage({
    eyebrow: "Contact",
    title: "Have a Project? Let's Talk.",
    subtitle: "Konsultasi & penawaran sistem audio visual komersial.",
  });
}
