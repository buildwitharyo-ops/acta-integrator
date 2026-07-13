import { ArticleForm, type ArticleFormData } from "@/components/admin/ArticleForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { getArticleCategoriesAll, getAuthors, getMediaForPicker, getProductOptions, getSolutionOptions } from "@/lib/admin/queries";

type Search = { type?: string };

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminPage();
  const { type: typeParam } = await searchParams;
  const type = typeParam === "learn" ? "learn" : "news";

  const [authors, categories, products, solutions, media] = await Promise.all([
    getAuthors(),
    getArticleCategoriesAll(),
    getProductOptions(),
    getSolutionOptions(),
    getMediaForPicker(),
  ]);

  const data: ArticleFormData = {
    id: null,
    type,
    title: "",
    slug: "",
    excerpt: "",
    cover_media_id: null,
    body: { type: "doc", content: [] },
    category_id: "",
    level: "",
    author_id: authors[0]?.id ?? "",
    tags: [],
    is_featured: false,
    seo_title: "",
    seo_description: "",
    status: "draft",
    scheduled_at: "",
    related_product_ids: [],
    related_solution_ids: [],
  };

  return <ArticleForm data={data} authors={authors} categories={categories} products={products} solutions={solutions} media={media} />;
}
