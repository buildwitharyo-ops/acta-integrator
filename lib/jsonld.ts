import { SITE_URL, absoluteUrl as abs } from "@/lib/site-url";

export const ORG_ID = `${SITE_URL}/#organization`;

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

// WebSite (03 §8) — SearchAction points at the catalog's client-side search (?q=). Homepage only.
export function webSiteNode() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: abs("/"),
    name: "ACTA",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: abs("/products?q={search_term_string}") },
      "query-input": "required name=search_term_string",
    },
  };
}

// LocalBusiness (03 §8) — homepage only; built strictly from real site_settings (honesty rule:
// only emit fields that actually exist, no invented address/rating).
export function localBusinessNode(info: {
  email?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  address?: string | null;
  city?: string | null;
}) {
  const sameAs = info.instagram ? [instagramUrl(info.instagram)] : undefined;
  const hasAddress = Boolean(info.address || info.city);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: "PT ACTA Solusi Teknologi",
    alternateName: "ACTA",
    url: abs("/"),
    image: abs("/brand/logo-acta-black.png"),
    parentOrganization: { "@id": ORG_ID },
    areaServed: "ID",
    ...(info.email ? { email: info.email } : {}),
    ...(info.whatsapp ? { telephone: info.whatsapp } : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...(info.address ? { streetAddress: info.address } : {}),
            ...(info.city ? { addressLocality: info.city } : {}),
            addressCountry: "ID",
          },
        }
      : {}),
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
