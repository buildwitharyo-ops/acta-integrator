import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Catalog";

export default function Image() {
  return renderOgImage({
    eyebrow: "Catalog",
    title: "Professional Gear, Curated by Need.",
    subtitle: "Katalog perangkat AV komersial dari brand tepercaya.",
  });
}
