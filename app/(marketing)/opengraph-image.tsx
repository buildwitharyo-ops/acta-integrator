import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

// Default site-wide OG image — used by every route without its own opengraph-image (home, hubs,
// about, contact, etc.). Detail routes override this with their own segment file.
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — Commercial AV & Multimedia Systems Integrator, Indonesia";

export default function OgImage() {
  return renderOgImage({
    eyebrow: "Commercial AV / Multimedia",
    title: "AV Systems, Engineered. Not Just Installed.",
    subtitle: "Kami merancang, memasang, dan merawat sistem audio visual komersial terintegrasi. Jakarta & Tangerang.",
  });
}
