import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/auth";
import { PAGES } from "@/lib/page-sections/registry";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPagesPage() {
  await requireAdminPage();
  const sb = createAdminClient();
  const { data: rows } = await sb.from("page_sections").select("page_key, is_enabled");

  const enabledByPage = new Map<string, number>();
  for (const r of rows ?? []) {
    if (r.page_key && r.is_enabled) enabledByPage.set(r.page_key, (enabledByPage.get(r.page_key) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pages</h1>
        <p className="text-sm text-muted-foreground">Konten section per halaman — field terstruktur, bukan page builder.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PAGES.map((p) => (
          <Link
            key={p.key}
            href={`/admin/pages/${p.key}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-foreground/30"
          >
            <div>
              <div className="text-sm font-semibold">{p.label}</div>
              <p className="text-xs text-muted-foreground">
                {p.sections.length} section · {enabledByPage.get(p.key) ?? 0} aktif
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
