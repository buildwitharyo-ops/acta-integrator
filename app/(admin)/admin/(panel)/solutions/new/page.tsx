import { SolutionForm, type SolutionFormData } from "@/components/admin/SolutionForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { getMediaForPicker, getProductOptions } from "@/lib/admin/queries";

export default async function NewSolutionPage() {
  await requireAdminPage();
  const [media, products] = await Promise.all([getMediaForPicker(), getProductOptions()]);

  const data: SolutionFormData = {
    id: null,
    name: "",
    slug: "",
    tier: "core",
    value_prop: "",
    hero_headline: "",
    hero_subcopy: "",
    hero_media_id: null,
    wa_message: "",
    seo_title: "",
    seo_description: "",
    sort_order: 0,
    status: "draft",
    related_product_ids: [],
    pain_heading: "",
    pain_points: [],
    scope_pillars: [],
  };

  return <SolutionForm data={data} products={products} media={media} />;
}
