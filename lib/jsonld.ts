const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const ORG_ID = `${siteUrl}/#organization`;

const abs = (path: string) => new URL(path, siteUrl).toString();

function instagramUrl(handle: string) {
  if (/^https?:\/\//.test(handle)) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function organizationNode(contact?: { email?: string | null; instagram?: string | null }) {
  const sameAs = contact?.instagram ? [instagramUrl(contact.instagram)] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "PT ACTA Solusi Teknologi",
    alternateName: "ACTA",
    slogan: "Smarter Systems. Real Impact.",
    url: abs("/"),
    logo: { "@type": "ImageObject", url: abs("/brand/logo-acta-black.png") },
    ...(contact?.email ? { email: contact.email } : {}),
    ...(sameAs ? { sameAs } : {}),
  };
}

// NewsArticle (news) / Article (learn) — 07 §6. publisher references the global Organization @id.
export function articleNode({
  type,
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorRole,
  path,
}: {
  type: "news" | "learn";
  headline: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": type === "news" ? "NewsArticle" : "Article",
    headline,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(authorName
      ? { author: { "@type": "Person", name: authorName, ...(authorRole ? { jobTitle: authorRole } : {}) } }
      : {}),
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(path) },
    url: abs(path),
  };
}

export function serviceNode({
  name,
  description,
  serviceType = "Audio visual system integration",
  path,
}: {
  name: string;
  description?: string | null;
  serviceType?: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    ...(description ? { description } : {}),
    serviceType,
    provider: { "@id": ORG_ID },
    areaServed: "ID",
    url: abs(path),
  };
}

// Product node — NEVER includes offers/price (06 §2.7; lead-gen, internal price only).
export function productNode({
  name,
  brand,
  images,
  description,
  category,
  path,
}: {
  name: string;
  brand?: string | null;
  images?: string[];
  description?: string | null;
  category?: string | null;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(images && images.length ? { image: images } : {}),
    ...(description ? { description } : {}),
    ...(category ? { category } : {}),
    url: abs(path),
  };
}

// AboutPage (03 §8) — references the global Organization and adds founders.
export function aboutPageNode({
  path,
  team,
}: {
  path: string;
  team: { name: string; role: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: abs(path),
    mainEntity: {
      "@type": "Organization",
      "@id": ORG_ID,
      ...(team.length
        ? { founder: team.map((m) => ({ "@type": "Person", name: m.name, jobTitle: m.role })) }
        : {}),
    },
  };
}

// ContactPage (03 §8) — contactPoint for WhatsApp + email.
export function contactPageNode({
  path,
  email,
  whatsapp,
}: {
  path: string;
  email?: string | null;
  whatsapp?: string | null;
}) {
  const contactPoint: Record<string, unknown> = { "@type": "ContactPoint", contactType: "sales" };
  if (whatsapp) contactPoint.telephone = whatsapp;
  if (email) contactPoint.email = email;
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: abs(path),
    mainEntity: {
      "@type": "Organization",
      "@id": ORG_ID,
      ...(email || whatsapp ? { contactPoint } : {}),
    },
  };
}

type Crumb = { name: string; path: string };

export function breadcrumbNode(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function itemListNode(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: abs(it.path),
    })),
  };
}
