import { notFound } from "next/navigation";
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/admin/auth";
import {
  getBrands,
  getCategories,
  getMediaForPicker,
  getProductOptions,
  getSolutionOptions,
  getSpecDefs,
} from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { id: string };

export default async function EditProductPage({ params }: { params: Promise<Params> }) {
  await requireAdminPage();
  const { id } = await params;
  const sb = createAdminClient();

  const [
    { data: product },
    { data: imgs },
    { data: specVals },
    { data: solLinks },
    { data: similarLinks },
    brands,
    categories,
    specDefs,
    solutions,
    products,
    media,
  ] = await Promise.all([
    sb.from("products").select("*").eq("id", id).maybeSingle(),
    sb.from("product_images").select("media_id, image_annotation, sort_order").eq("product_id", id).order("sort_order"),
    sb.from("product_spec_values").select("spec_definition_id, value_text, value_number, value_boolean, value_options").eq("product_id", id),
    sb.from("product_solutions").select("solution_id, sort_order").eq("product_id", id).order("sort_order"),
    sb.from("product_similar").select("similar_product_id, sort_order").eq("product_id", id).order("sort_order"),
    getBrands(),
    getCategories(),
    getSpecDefs(),
    getSolutionOptions(),
    getProductOptions(),
    getMediaForPicker(),
  ]);

  if (!product) notFound();

  const defType = new Map(specDefs.map((d) => [d.id, d.data_type]));
  const specInputs: Record<string, string> = {};
  for (const sv of specVals ?? []) {
    if (!sv.spec_definition_id) continue;
    const type = defType.get(sv.spec_definition_id);
    if (type === "boolean") specInputs[sv.spec_definition_id] = sv.value_boolean ? "true" : "false";
    else if (type === "enum") specInputs[sv.spec_definition_id] = sv.value_options?.[0] ?? sv.value_text ?? "";
    else if (type === "number") specInputs[sv.spec_definition_id] = sv.value_number != null ? String(sv.value_number) : sv.value_text ?? "";
    else specInputs[sv.spec_definition_id] = sv.value_text ?? "";
  }

  const data: ProductFormData = {
    id: product.id,
    name: product.name ?? "",
    slug: product.slug ?? "",
    brand_id: product.brand_id ?? "",
    category_id: product.category_id ?? "",
    short_spec: product.short_spec ?? "",
    description_md: product.description_md ?? "",
    suitable_for: product.suitable_for ?? "",
    spec_source_url: product.spec_source_url ?? "",
    internal_price: product.internal_price != null ? String(product.internal_price) : "",
    is_featured: product.is_featured ?? false,
    seo_title: product.seo_title ?? "",
    seo_description: product.seo_description ?? "",
    status: (product.status as "draft" | "published") ?? "draft",
    images: (imgs ?? []).map((i) => ({ media_id: i.media_id!, image_annotation: i.image_annotation ?? "" })),
    spec_inputs: specInputs,
    related_solution_ids: (solLinks ?? []).map((l) => l.solution_id).filter((x): x is string => Boolean(x)),
    similar_product_ids: (similarLinks ?? []).map((l) => l.similar_product_id).filter((x): x is string => Boolean(x)),
  };

  return (
    <ProductForm
      data={data}
      brands={brands}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      specDefs={specDefs}
      solutions={solutions}
      products={products}
      media={media}
    />
  );
}
