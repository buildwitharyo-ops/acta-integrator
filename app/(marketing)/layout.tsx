import { Footer } from "@/components/shared/Footer";
import { JsonLd } from "@/components/shared/JsonLd";
import { Navbar } from "@/components/shared/Navbar";
import { organizationNode } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";
import { getCategoryPreviews } from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import { getSolutions } from "@/lib/queries/solutions";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, solutions, categories] = await Promise.all([
    getSiteSettings(),
    getSolutions(),
    getCategoryPreviews(),
  ]);

  const navSolutions = solutions.map((s) => ({
    slug: s.slug,
    name: s.name,
    tier: s.tier,
    value_prop: s.value_prop,
  }));

  const navCategories = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    count: c.count,
    image: mediaUrl(c.image),
  }));

  return (
    <>
      <JsonLd data={organizationNode({ email: settings?.email, instagram: settings?.instagram })} />
      <Navbar
        solutions={navSolutions}
        categories={navCategories}
        contact={{ email: settings?.email ?? null, instagram: settings?.instagram ?? null }}
      />
      <main className="min-h-screen">{children}</main>
      <Footer settings={settings} solutions={navSolutions} />
    </>
  );
}
