import "server-only";
import { slugify } from "@/lib/article";
import { createAdminClient } from "@/lib/supabase/admin";

export { slugify };

// Ensure a slug is unique within a table (optionally per `type`), excluding the current row.
// Appends -2, -3, … on collision. Uses service-role to see drafts too.
export async function uniqueSlug(
  table: "solutions" | "products" | "articles" | "product_categories" | "brands",
  base: string,
  opts: { excludeId?: string; type?: string } = {},
): Promise<string> {
  const sb = createAdminClient();
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  while (true) {
    let q = sb.from(table).select("id").eq("slug", candidate);
    if (opts.type) q = q.filter("type", "eq", opts.type);
    if (opts.excludeId) q = q.neq("id", opts.excludeId);
    const { data } = await q.limit(1);
    if (!data || data.length === 0) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}
