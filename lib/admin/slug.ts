import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/article";
import { createAdminClient } from "@/lib/supabase/admin";

export { slugify };

export type UniqueSlugTable =
  | "solutions"
  | "products"
  | "articles"
  | "product_categories"
  | "brands"
  | "product_types"
  | "learn_paths"
  | "learn_tools";

// uniqueSlug only ever reads `id` and filters on `slug` (+ optionally `type` /
// `category_id`), but it must now address learn_paths and learn_tools, which the
// generated Database does not know about yet — `supabase gen types` needs remote
// access this environment lacks (see lib/learn/types.ts). A minimal schema
// describing exactly the columns this function touches keeps the call site typed
// without weakening `Database` for anyone else.
type SlugRow = {
  id: string;
  slug: string;
  type: string | null;
  category_id: string | null;
};
type SlugRelation = { Row: SlugRow; Insert: SlugRow; Update: Partial<SlugRow>; Relationships: [] };
type SlugDatabase = {
  public: {
    Tables: Record<UniqueSlugTable, SlugRelation>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

// Ensure a slug is unique within a table (optionally per `type`), excluding the current row.
// Appends -2, -3, … on collision. Uses service-role to see drafts too.
export async function uniqueSlug(
  table: UniqueSlugTable,
  base: string,
  opts: { excludeId?: string; type?: string; categoryId?: string } = {},
): Promise<string> {
  const sb = createAdminClient() as unknown as SupabaseClient<SlugDatabase>;
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  while (true) {
    let q = sb.from(table).select("id").eq("slug", candidate);
    if (opts.type) q = q.filter("type", "eq", opts.type);
    if (opts.categoryId) q = q.filter("category_id", "eq", opts.categoryId);
    if (opts.excludeId) q = q.neq("id", opts.excludeId);
    const { data } = await q.limit(1);
    if (!data || data.length === 0) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}
