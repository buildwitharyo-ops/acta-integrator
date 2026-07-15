import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — About";

export default function Image() {
  return renderOgImage({
    eyebrow: "About",
    title: "A Technology Partner, Not Just an Installer.",
    subtitle: "Enterprise AV integrator untuk Jakarta & Tangerang.",
  });
}
