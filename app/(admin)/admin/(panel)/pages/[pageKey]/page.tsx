import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageSectionForm } from "@/components/admin/PageSectionForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { getCategories, getMediaForPicker, getProductOptionsByCategory } from "@/lib/admin/queries";
import { SECTION_FIELDS, getPageDef, hydrateContent } from "@/lib/page-sections/registry";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { pageKey: string };

export default async function EditPagePage({ params }: { params: Promise<Params> }) {
  await requireAdminPage();
  const { pageKey } = await params;
  const page = getPageDef(pageKey);
  if (!page) notFound();

  const sb = createAdminClient();
  // Categories + products-by-category only feed the homepage Catalog Teaser's per-category picker
  // (type "categoryProducts") — skip the extra queries on every other page.
  const needsCategoryProducts = pageKey === "home";
  const [{ data: rows }, media, categories, productsByCategory] = await Promise.all([
    sb.from("page_sections").select("section_key, content, is_enabled").eq("page_key", pageKey),
    getMediaForPicker(),
    needsCategoryProducts ? getCategories() : Promise.resolve([]),
    needsCategoryProducts ? getProductOptionsByCategory() : Promise.resolve({}),
  ]);

  const stored = new Map((rows ?? []).map((r) => [r.section_key, r]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Pages
        </Link>
        <h1 className="text-xl font-semibold">{page.label}</h1>
        <p className="text-sm text-muted-foreground">Edit field per section. Perubahan langsung tayang via revalidate.</p>
      </div>

      <div className="space-y-3">
        {page.sections.map((section, i) => {
          const fields = SECTION_FIELDS[section.key] ?? [];
          const row = stored.get(section.key);
          const content = hydrateContent(fields, (row?.content ?? null) as Record<string, unknown> | null);
          // Row exists → use its flag; new/unseen section → default enabled unless registry says otherwise (stats off).
          const initialEnabled = row ? row.is_enabled ?? true : section.key !== "stats";
          return (
            <PageSectionForm
              key={section.key}
              pageKey={pageKey}
              section={section}
              fields={fields}
              initialContent={content}
              initialEnabled={initialEnabled}
              media={media}
              categories={categories}
              productsByCategory={productsByCategory}
              defaultOpen={i === 0}
            />
          );
        })}
      </div>
    </div>
  );
}
