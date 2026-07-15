import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Solutions";

export default function Image() {
  return renderOgImage({
    eyebrow: "Solutions",
    title: "A Solution for Every Space.",
    subtitle: "Sistem AV komersial terintegrasi untuk setiap tipe ruang.",
  });
}
