import { CategoriesManager, type BrandRow, type CategoryRow, type SpecDefRow } from "@/components/admin/CategoriesManager";
import { requireAdminPage } from "@/lib/admin/auth";
import { fetchAllRows } from "@/lib/admin/paginate";
import { getMediaForPicker } from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCategoriesPage() {
  await requireAdminPage("admin");
  const sb = createAdminClient();

  const [{ data: cats }, { data: brands }, { data: defs }, products, specVals, media] = await Promise.all([
    sb.from("product_categories").select("id, name, slug, description, sort_order").order("sort_order"),
    sb.from("brands").select("id, name, website, is_authorized_dealer, logo_media_id").order("name"),
    sb.from("spec_definitions").select("*").order("sort_order"),
    fetchAllRows<{ category_id: string | null; brand_id: string | null }>((from, to) =>
      sb.from("products").select("category_id, brand_id").order("id").range(from, to),
    ),
    fetchAllRows<{ spec_definition_id: string | null }>((from, to) =>
      sb.from("product_spec_values").select("spec_definition_id").order("id").range(from, to),
    ),
    getMediaForPicker(),
  ]);

  const prodByCat = new Map<string, number>();
  const prodByBrand = new Map<string, number>();
  for (const p of products ?? []) {
    if (p.category_id) prodByCat.set(p.category_id, (prodByCat.get(p.category_id) ?? 0) + 1);
    if (p.brand_id) prodByBrand.set(p.brand_id, (prodByBrand.get(p.brand_id) ?? 0) + 1);
  }
  const valByDef = new Map<string, number>();
  for (const sv of specVals ?? []) {
    if (sv.spec_definition_id) valByDef.set(sv.spec_definition_id, (valByDef.get(sv.spec_definition_id) ?? 0) + 1);
  }

  const categories: CategoryRow[] = (cats ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    sort_order: c.sort_order,
    productCount: prodByCat.get(c.id) ?? 0,
  }));
  const brandRows: BrandRow[] = (brands ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    website: b.website,
    is_authorized_dealer: b.is_authorized_dealer,
    logo_media_id: b.logo_media_id,
    productCount: prodByBrand.get(b.id) ?? 0,
  }));
  const specDefs: SpecDefRow[] = (defs ?? []).map((d) => ({
    id: d.id,
    category_id: d.category_id,
    key: d.key,
    label: d.label,
    spec_group: d.spec_group,
    data_type: d.data_type,
    unit: d.unit,
    enum_options: d.enum_options,
    sort_order: d.sort_order,
    is_filterable: d.is_filterable,
    is_comparable: d.is_comparable,
    better_direction: d.better_direction,
    is_archived: d.is_archived,
    valueCount: valByDef.get(d.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Categories &amp; Specs</h1>
        <p className="text-sm text-muted-foreground">Kategori, brand, dan template spesifikasi — basis fitur Bandingkan katalog.</p>
      </div>
      <CategoriesManager categories={categories} brands={brandRows} specDefs={specDefs} media={media} />
    </div>
  );
}
