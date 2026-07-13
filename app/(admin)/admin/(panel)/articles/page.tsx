import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/admin/fields";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Search = { type?: string };

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdminPage();
  const { type: typeParam } = await searchParams;
  const type = typeParam === "learn" ? "learn" : "news";
  const sb = createAdminClient();

  const [{ data: articles }, { data: cats }] = await Promise.all([
    sb.from("articles").select("id, title, type, status, category_id, published_at, scheduled_at, is_featured").eq("type", type).order("created_at", { ascending: false }),
    sb.from("article_categories").select("id, name"),
  ]);
  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Articles</h1>
          <p className="text-sm text-muted-foreground">News (aktual) &amp; Learn (evergreen).</p>
        </div>
        <Link href={`/admin/articles/new?type=${type}`} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover">
          <Plus className="h-3.5 w-3.5" /> Artikel
        </Link>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["news", "learn"] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/articles?type=${t}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize ${t === type ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Judul</th>
              <th className="px-4 py-2.5 font-medium">Kategori</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Tanggal</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(articles ?? []).map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{a.title}</span>
                  {a.is_featured ? <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-accent-text">FEATURED</span> : null}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.category_id ? catName.get(a.category_id) ?? "—" : "—"}</td>
                <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.status === "scheduled" ? `→ ${fmtDate(a.scheduled_at)}` : fmtDate(a.published_at)}</td>
                <td className="px-4 py-2.5 text-right"><Link href={`/admin/articles/${a.id}`} className="text-sm text-accent-text hover:underline">Edit</Link></td>
              </tr>
            ))}
            {(articles ?? []).length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada artikel {type}.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
