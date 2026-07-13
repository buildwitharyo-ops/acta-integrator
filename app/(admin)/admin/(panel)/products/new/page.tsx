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

export default async function NewProductPage() {
  await requireAdminPage();
  const [brands, categories, specDefs, solutions, products, media] = await Promise.all([
    getBrands(),
    getCategories(),
    getSpecDefs(),
    getSolutionOptions(),
    getProductOptions(),
    getMediaForPicker(),
  ]);

  const data: ProductFormData = {
    id: null,
    name: "",
    slug: "",
    brand_id: "",
    category_id: "",
    short_spec: "",
    description_md: "",
    suitable_for: "",
    spec_source_url: "",
    internal_price: "",
    is_featured: false,
    seo_title: "",
    seo_description: "",
    status: "draft",
    images: [],
    spec_inputs: {},
    related_solution_ids: [],
    similar_product_ids: [],
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
