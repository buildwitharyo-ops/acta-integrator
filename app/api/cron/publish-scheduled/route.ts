import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Vercel Cron (once daily — Hobby tier caps cron at 1×/day; runs 00:00 UTC = 07:00 WIB) → flips every
// due 'scheduled' article (scheduled_at <= now) to 'published' and revalidates (08 §3.5). Because the
// run is daily, a scheduled article goes live at the next daily run at/after its scheduled_at, not at
// the exact minute. Protected by CRON_SECRET (Vercel Cron sends it as `Authorization: Bearer <secret>`).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
  if (provided !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("publish_due_articles");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const published = data ?? [];
  for (const row of published) {
    if (!row.type || !row.slug) continue;
    revalidateTag(row.type); // 'news' | 'learn'
    revalidateTag(`${row.type}:${row.slug}`);
  }
  if (published.length > 0) revalidateTag("page:home");

  return NextResponse.json({ ok: true, published: published.length, slugs: published.map((r) => `${r.type}/${r.slug}`) });
}
