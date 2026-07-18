import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { CatalogReviewPanel } from "@/components/admin/CatalogReviewPanel";
import type { ProductFormData } from "@/components/admin/ProductForm";
import {
  getBrands,
  getCategories,
  getMediaForPicker,
  getProductOptions,
  getProductTypes,
  getSolutionOptions,
  getSpecDefs,
} from "@/lib/admin/queries";
import { getItemForReview, materializeDraftImages } from "@/lib/catalog-pipeline/queries";
import type { DraftSpec, ProposedImage } from "@/lib/catalog-pipeline/types";

type Params = { importId: string; itemId: string };

export default async function CatalogReviewPage({ params }: { params: Promise<Params> }) {
  await requireAdminPage();
  const { importId, itemId } = await params;

  const [reviewData, brands, categories, productTypes, specDefs, solutions, products] = await Promise.all([
    getItemForReview(itemId),
    getBrands(),
    getCategories(),
    getProductTypes(),
    getSpecDefs(),
    getSolutionOptions(),
    getProductOptions(),
  ]);
  if (!reviewData || !reviewData.draft) notFound();
  const { item, draft } = reviewData;

  const brandMatch = brands.find((b) => b.name.toLowerCase() === item.brand_raw.toLowerCase());

  const draftSpecs = (draft.specs as unknown as DraftSpec[]) ?? [];
  // Fase 3 (PRD §5.4 build-prompt #5/#6): copy any newly-finished processed images into real
  // media rows FIRST, so the Gallery tab below and the media picker's list both see them — this
  // is why `media` is fetched after, not in the same Promise.all as the reads above.
  const proposedImages = await materializeDraftImages(draft.id, (draft.proposed_images as unknown as ProposedImage[]) ?? []);
  const media = await getMediaForPicker();

  const specInputs: Record<string, string> = {};
  const unmatchedSpecs: DraftSpec[] = [];
  const typeDefs = draft.product_type_id ? specDefs.filter((d) => d.product_type_id === draft.product_type_id) : [];
  const defByKey = new Map(typeDefs.map((d) => [d.key, d]));
  for (const s of draftSpecs) {
    const def = defByKey.get(s.key);
    if (!def) {
      unmatchedSpecs.push(s);
      continue;
    }
    if (def.data_type === "boolean") specInputs[def.id] = s.value_boolean != null ? String(s.value_boolean) : s.value_text;
    else if (def.data_type === "number") specInputs[def.id] = s.value_number != null ? String(s.value_number) : s.value_text;
    else specInputs[def.id] = s.value_text;
  }

  const formData: ProductFormData = {
    id: null,
    name: draft.name_correction || draft.name,
    slug: "",
    brand_id: brandMatch?.id ?? "",
    category_id: draft.category_id ?? "",
    product_type_id: draft.product_type_id ?? "",
    short_spec: draft.short_spec ?? "",
    description_md: draft.description_md ?? "",
    suitable_for: draft.suitable_for ?? "",
    spec_source_url: draft.spec_source_url ?? "",
    internal_price: item.price_internal != null ? String(item.price_internal) : "",
    is_featured: false,
    seo_title: "",
    seo_description: "",
    status: "draft",
    images: proposedImages
      .filter((img): img is ProposedImage & { committed_media_id: string } => Boolean(img.committed_media_id))
      .map((img) => ({ media_id: img.committed_media_id, image_annotation: img.angle_note ?? "" })),
    spec_inputs: specInputs,
    related_solution_ids: [],
    similar_product_ids: [],
  };

  return (
    <CatalogReviewPanel
      importId={importId}
      draftId={draft.id}
      draft={{
        confidence: draft.confidence,
        confidence_notes: draft.confidence_notes,
        status_recommendation: draft.status_recommendation,
        skip_reason: draft.skip_reason,
        name_correction: draft.name_correction,
        new_product_type_name: draft.new_product_type_name,
      }}
      brandMatched={Boolean(brandMatch)}
      brandRaw={item.brand_raw}
      unmatchedSpecs={unmatchedSpecs}
      proposedImages={proposedImages}
      formData={formData}
      brands={brands}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      productTypes={productTypes.map((t) => ({ id: t.id, category_id: t.category_id, name: t.name }))}
      specDefs={specDefs}
      solutions={solutions}
      products={products}
      media={media}
    />
  );
}
