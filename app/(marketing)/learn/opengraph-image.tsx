import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Learn";

export default function Image() {
  return renderOgImage({
    eyebrow: "Learn",
    title: "AV Knowledge, Explained.",
    subtitle: "Panduan dan dasar-dasar sistem audio visual profesional.",
  });
}
