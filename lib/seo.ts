import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  const images = ogImage ? [{ url: ogImage }] : undefined;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "ACTA", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
