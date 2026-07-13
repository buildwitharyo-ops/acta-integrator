import Link from "next/link";
import { AlertTriangle, ImagePlus, Plus } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/auth";
import { getDashboardData } from "@/lib/admin/queries";

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Metric({ value, sub }: { value: number | string; sub: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  );
}

const quickActions = [
  { label: "Produk", href: "/admin/products/new", icon: Plus },
  { label: "Artikel", href: "/admin/articles/new", icon: Plus },
  { label: "Upload media", href: "/admin/media", icon: ImagePlus },
];

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const { counts, attention } = await getDashboardData();
  const attentionCount =
    attention.placeholderProducts.length + (attention.mediaNoAltCount > 0 ? 1 : 0) + attention.scheduledOverdue.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Orientasi kerja — kelola konten situs ACTA.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover"
            >
              <a.icon className="h-3.5 w-3.5" /> {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produk">
          <Metric value={counts.products.published} sub="published" />
          <p className="mt-1 text-xs text-muted-foreground">{counts.products.draft} draft</p>
        </StatCard>
        <StatCard label="Artikel">
          <Metric value={counts.articles.published} sub="published" />
          <p className="mt-1 text-xs text-muted-foreground">
            {counts.articles.draft} draft · {counts.articles.scheduled} scheduled
          </p>
        </StatCard>
        <StatCard label="Solutions">
          <Metric value={counts.solutions} sub="published" />
        </StatCard>
        <StatCard label="Leads (7 hari)">
          <Metric value="—" sub="ACTA-OS" />
          <p className="mt-1 text-xs text-muted-foreground">Lihat modul Leads</p>
        </StatCard>
      </div>

      <section>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Perlu perhatian</h2>
          {attentionCount > 0 ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-accent-text">
              {attentionCount}
            </span>
          ) : null}
        </div>

        <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
          {attentionCount === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Semua bersih — tidak ada yang perlu ditindak.</p>
          ) : (
            <>
              {attention.placeholderProducts.map((p) => (
                <Link
                  key={`ph-${p.id}`}
                  href={`/admin/products/${p.id}`}
                  className="flex items-center justify-between gap-3 p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span>
                    <span className="font-medium">{p.name}</span> — produk published masih pakai foto placeholder
                  </span>
                  <span className="text-xs text-muted-foreground">Perbaiki →</span>
                </Link>
              ))}
              {attention.mediaNoAltCount > 0 ? (
                <Link
                  href="/admin/media"
                  className="flex items-center justify-between gap-3 p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span>
                    <span className="font-medium">{attention.mediaNoAltCount} media</span> tanpa alt text
                  </span>
                  <span className="text-xs text-muted-foreground">Perbaiki →</span>
                </Link>
              ) : null}
              {attention.scheduledOverdue.map((a) => (
                <Link
                  key={`sc-${a.id}`}
                  href={`/admin/articles/${a.id}`}
                  className="flex items-center justify-between gap-3 p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span>
                    <span className="font-medium">{a.title}</span> — artikel scheduled lewat jadwal
                  </span>
                  <span className="text-xs text-muted-foreground">Perbaiki →</span>
                </Link>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
