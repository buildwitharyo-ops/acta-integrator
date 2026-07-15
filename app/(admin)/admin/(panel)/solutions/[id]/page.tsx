import { notFound } from "next/navigation";
import { SolutionForm, type SolutionFormData } from "@/components/admin/SolutionForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { getMediaForPicker, getProductOptions } from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { id: string };

function asItems(items: unknown): Record<string, string>[] {
  return Array.isArray(items) ? (items as Record<string, string>[]) : [];
}

export default async function EditSolutionPage({ params }: { params: Promise<Params> }) {
  await requireAdminPage();
  const { id } = await params;
  const sb = createAdminClient();

  const [{ data: solution }, { data: sections }, { data: links }, media, products] = await Promise.all([
    sb.from("solutions").select("*").eq("id", id).maybeSingle(),
    sb.from("solution_sections").select("type, heading, items").eq("solution_id", id),
    sb.from("product_solutions").select("product_id, sort_order").eq("solution_id", id).order("sort_order"),
    getMediaForPicker(),
    getProductOptions(),
  ]);

  if (!solution) notFound();

  const pain = sections?.find((s) => s.type === "pain_points");
  const scope = sections?.find((s) => s.type === "scope_pillar");

  const data: SolutionFormData = {
    id: solution.id,
    name: solution.name ?? "",
    slug: solution.slug ?? "",
    tier: (solution.tier as "core" | "supporting") ?? "core",
    value_prop: solution.value_prop ?? "",
    hero_headline: solution.hero_headline ?? "",
    hero_subcopy: solution.hero_subcopy ?? "",
    hero_media_id: solution.hero_media_id ?? null,
    wa_message: solution.wa_message ?? "",
    seo_title: solution.seo_title ?? "",
    seo_description: solution.seo_description ?? "",
    sort_order: solution.sort_order ?? 0,
    status: (solution.status as "draft" | "published") ?? "draft",
    related_product_ids: (links ?? []).map((l) => l.product_id).filter((x): x is string => Boolean(x)),
    pain_heading: pain?.heading ?? "",
    pain_points: asItems(pain?.items).map((it) => ({ title: it.title ?? "", body: it.body ?? "", image_url: it.image_url ?? "" })),
    scope_pillars: asItems(scope?.items).map((it) => ({ title: it.title ?? "", description: it.description ?? "" })),
  };

  return <SolutionForm data={data} products={products} media={media} />;
}
