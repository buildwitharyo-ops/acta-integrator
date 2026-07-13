import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusBadge } from "@/components/admin/fields";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSolutionsPage() {
  await requireAdminPage();
  const sb = createAdminClient();
  const { data: solutions } = await sb
    .from("solutions")
    .select("id, name, tier, status, sort_order, updated_at")
    .order("tier")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Solutions</h1>
          <p className="text-sm text-muted-foreground">{solutions?.length ?? 0} solusi.</p>
        </div>
        <Link href="/admin/solutions/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover">
          <Plus className="h-3.5 w-3.5" /> Solution
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nama</th>
              <th className="px-4 py-2.5 font-medium">Tier</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Urut</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(solutions ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{s.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.tier}</td>
                <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{s.sort_order}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/solutions/${s.id}`} className="text-sm text-accent-text hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
