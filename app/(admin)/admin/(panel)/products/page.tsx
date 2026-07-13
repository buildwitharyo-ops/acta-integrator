import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/admin/fields";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { mediaUrl } from "@/lib/media";

export default async function AdminProductsPage() {
  await requireAdminPage();
  const sb = createAdminClient();

  const [{ data: products }, { data: brands }, { data: cats }, { data: images }, { data: media }] = await Promise.all([
    sb.from("products").select("id, name, brand_id, category_id, status").order("created_at", { ascending: false }),
    sb.from("brands").select("id, name"),
    sb.from("product_categories").select("id, name"),
    sb.from("product_images").select("product_id, media_id, sort_order").order("sort_order"),
    sb.from("media").select("id, storage_path, external_url, is_placeholder"),
  ]);

  const brandName = new Map((brands ?? []).map((b) => [b.id, b.name]));
  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const mediaById = new Map((media ?? []).map((m) => [m.id, m]));
  const firstImage = new Map<string, string>();
  const placeholder = new Map<string, boolean>();
  for (const img of images ?? []) {
    if (!img.product_id) continue;
    const m = img.media_id ? mediaById.get(img.media_id) : null;
    if (!firstImage.has(img.product_id) && m) firstImage.set(img.product_id, img.media_id!);
    if (m?.is_placeholder) placeholder.set(img.product_id, true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">{products?.length ?? 0} produk.</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover">
          <Plus className="h-3.5 w-3.5" /> Produk
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Produk</th>
              <th className="px-4 py-2.5 font-medium">Brand</th>
              <th className="px-4 py-2.5 font-medium">Kategori</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products ?? []).map((p) => {
              const mid = firstImage.get(p.id);
              const url = mid ? mediaUrl(mediaById.get(mid)) : null;
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded bg-muted">
                        {url ? <Image src={url} alt="" fill sizes="48px" className="object-cover" /> : null}
                      </div>
                      <span className="font-medium">{p.name}</span>
                      {placeholder.get(p.id) ? <span className="text-xs text-primary" title="Foto placeholder">⚠</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.brand_id ? brandName.get(p.brand_id) : "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.category_id ? catName.get(p.category_id) : "—"}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-sm text-accent-text hover:underline">Edit</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
