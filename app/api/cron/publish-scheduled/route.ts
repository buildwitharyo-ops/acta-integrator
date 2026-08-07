import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Vercel Cron (once daily — Hobby tier caps cron at 1×/day; runs 00:00 UTC = 07:00 WIB) → flips every
// due 'scheduled' article (scheduled_at <= now) to 'published' and revalidates (08 §3.5). Because the
// run is daily, a scheduled article goes live at the next daily run at/after its scheduled_at, not at
// the exact minute. Protected by CRON_SECRET (Vercel Cron sends it as `Authorization: Bearer <secret>`).
//
// PRACTICAL CONSEQUENCE, stated so nobody debugs it twice: the single run is at 07:00 WIB, so anything
// scheduled later in the day does not publish until the following morning — up to ~22 hours late. That
// makes "schedule for Monday 09:00" unusable in practice; publish manually from the admin instead
// (the server action fires the same revalidateTag fan-out, so it is not a lesser path).
//
// Raising this to `*/15 * * * *` in vercel.json fixes it, but sub-daily crons require Vercel Pro. The
// stronger reason to move to Pro is unrelated to cron: Hobby's terms prohibit commercial use. Change
// the schedule at the same time as that upgrade, not before — a sub-daily cron on Hobby risks the
// deployment being rejected.
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
