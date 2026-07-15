import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — News";

export default function Image() {
  return renderOgImage({
    eyebrow: "News",
    title: "Insights from the AV Industry.",
    subtitle: "Kabar terbaru seputar teknologi audio visual komersial.",
  });
}
