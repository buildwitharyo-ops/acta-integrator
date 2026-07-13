import { notFound } from "next/navigation";
import { ArticleForm, type ArticleFormData } from "@/components/admin/ArticleForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { getArticleCategoriesAll, getAuthors, getMediaForPicker, getProductOptions, getSolutionOptions } from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { id: string };

export default async function EditArticlePage({ params }: { params: Promise<Params> }) {
  await requireAdminPage();
  const { id } = await params;
  const sb = createAdminClient();

  const [{ data: article }, { data: prodLinks }, { data: solLinks }, authors, categories, products, solutions, media] = await Promise.all([
    sb.from("articles").select("*").eq("id", id).maybeSingle(),
    sb.from("article_products").select("product_id, sort_order").eq("article_id", id).order("sort_order"),
    sb.from("article_solutions").select("solution_id").eq("article_id", id),
    getAuthors(),
    getArticleCategoriesAll(),
    getProductOptions(),
    getSolutionOptions(),
    getMediaForPicker(),
  ]);

  if (!article) notFound();

  const data: ArticleFormData = {
    id: article.id,
    type: article.type,
    title: article.title ?? "",
    slug: article.slug ?? "",
    excerpt: article.excerpt ?? "",
    cover_media_id: article.cover_media_id ?? null,
    body: article.body ?? { type: "doc", content: [] },
    category_id: article.category_id ?? "",
    level: (article.level as "" | "dasar" | "menengah") ?? "",
    author_id: article.author_id ?? "",
    tags: article.tags ?? [],
    is_featured: article.is_featured ?? false,
    seo_title: article.seo_title ?? "",
    seo_description: article.seo_description ?? "",
    status: (article.status as "draft" | "scheduled" | "published") ?? "draft",
    scheduled_at: "",
    related_product_ids: (prodLinks ?? []).map((l) => l.product_id).filter((x): x is string => Boolean(x)),
    related_solution_ids: (solLinks ?? []).map((l) => l.solution_id).filter((x): x is string => Boolean(x)),
  };

  return (
    <ArticleForm
      data={data}
      authors={authors}
      categories={categories}
      products={products}
      solutions={solutions}
      media={media}
      initialScheduledIso={article.scheduled_at ?? null}
    />
  );
}
