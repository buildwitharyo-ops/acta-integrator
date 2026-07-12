import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function clampDescription(text?: string) {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (trimmed.length <= 155) return trimmed;
  return `${trimmed.slice(0, 154).trimEnd()}…`;
}

type BuildMetadataArgs = {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
};

export function buildMetadata({
  title,
  description,
  path = "/",
  ogImage,
}: BuildMetadataArgs = {}): Metadata {
  const url = new URL(path, siteUrl).toString();
  const desc = clampDescription(description);
  const images = ogImage ? [{ url: ogImage }] : undefined;

  return {
    title,
    description: desc,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: url },
    openGraph: { title: title ?? undefined, description: desc, url, siteName: "ACTA", images },
    twitter: { card: "summary_large_image", title: title ?? undefined, description: desc, images },
  };
}
