import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

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
  noindex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path = "/",
  ogImage,
  noindex = false,
}: BuildMetadataArgs = {}): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const desc = clampDescription(description);
  // Only set images when a caller passes one. Omitting the key (vs setting undefined) lets Next's
  // file-based opengraph-image (default + per-segment ImageResponse) supply the OG image instead.
  const images = ogImage ? [{ url: ogImage }] : undefined;

  return {
    title,
    description: desc,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    ...(noindex ? { robots: { index: false } } : {}), // noindex but follow (03 §7.1: compare links stay crawlable)
    openGraph: { title: title ?? undefined, description: desc, url, siteName: "ACTA", ...(images ? { images } : {}) },
    twitter: { card: "summary_large_image", title: title ?? undefined, description: desc, ...(images ? { images } : {}) },
  };
}
