import { requireAdminPage } from "@/lib/admin/auth";
import { CatalogImportUpload } from "@/components/admin/CatalogImportUpload";
import { CatalogPipelineSettingsForm } from "@/components/admin/CatalogPipelineSettingsForm";
import { ImageHostsManager } from "@/components/admin/ImageHostsManager";
import { AdminSection } from "@/components/admin/fields";
import { getCatalogPipelineSettings, getImports } from "@/lib/catalog-pipeline/queries";
import { getAllowedImageHosts } from "@/lib/actions/admin/media";
import { IMAGE_REMOTE_HOSTS } from "@/lib/image-hosts";
import { cn } from "@/lib/utils";
import Link from "next/link";

function ImportProgressBar({
  progress,
}: {
  progress: {
    total_items: number | null;
    pending_count: number | null;
    queued_count: number | null;
    researching_count: number | null;
    ready_for_review_count: number | null;
    seeded_count: number | null;
    rejected_count: number | null;
    failed_count: number | null;
  } | null;
}) {
  const total = progress?.total_items ?? 0;
  if (!progress || total === 0) return null;

  const segments = [
    { count: progress.seeded_count ?? 0, className: "bg-status" },
    { count: progress.ready_for_review_count ?? 0, className: "bg-primary" },
    { count: (progress.queued_count ?? 0) + (progress.researching_count ?? 0), className: "bg-accent-hover" },
    { count: progress.failed_count ?? 0, className: "bg-destructive" },
    { count: progress.rejected_count ?? 0, className: "bg-muted-foreground/40" },
  ].filter((s) => s.count > 0);

  return (
    <div className="flex h-1.5 w-40 overflow-hidden rounded-full bg-muted">
      {segments.map((s, i) => (
        <div key={i} className={cn("h-full", s.className)} style={{ width: `${(s.count / total) * 100}%` }} />
      ))}
    </div>
  );
}

export default async function CatalogImportPage() {
  const ctx = await requireAdminPage();
  const isAdmin = ctx.role === "admin";
  const [imports, pipelineSettings, allowedHosts] = await Promise.all([
    getImports(),
    isAdmin ? getCatalogPipelineSettings() : Promise.resolve(null),
    isAdmin ? getAllowedImageHosts() : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-semibold">Import Katalog</h1>
        <p className="text-sm text-muted-foreground">
          Upload katalog vendor (.xlsx/.csv) → riset AI per item → review → publish. AI hanya mengusulkan; produk baru
          tetap lewat guardrail publish yang sama dengan form manual.
        </p>
      </div>

      <AdminSection title="Upload file baru">
        <CatalogImportUpload />
      </AdminSection>

      {pipelineSettings ? (
        <AdminSection title="Threshold Bulk-Approve" description="Kriteria minimum draft yang boleh dipublish sekaligus lewat 'Approve Semua Confidence Tinggi'. Admin only.">
          <CatalogPipelineSettingsForm initial={pipelineSettings} />
        </AdminSection>
      ) : null}

      {allowedHosts ? (
        <AdminSection title="Domain Gambar yang Diizinkan" description="Host yang boleh dipakai untuk gambar eksternal (riset AI & Media). Admin only.">
          <ImageHostsManager hardcoded={IMAGE_REMOTE_HOSTS.map((h) => h.hostname)} dbHosts={allowedHosts} />
        </AdminSection>
      ) : null}

      <AdminSection title="Riwayat import">
        {imports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada import.</p>
        ) : (
          <ul className="divide-y divide-border">
            {imports.map((imp) => {
              const p = imp.progress;
              const pending = p?.pending_count ?? 0;
              const reviewing = (p?.researching_count ?? 0) + (p?.ready_for_review_count ?? 0) + (p?.queued_count ?? 0);
              const seeded = p?.seeded_count ?? 0;
              const failed = p?.failed_count ?? 0;
              return (
                <li key={imp.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/catalog-import/${imp.id}`} className="text-sm font-medium hover:underline">
                      {imp.source_filename}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {imp.row_count} baris · {new Date(imp.created_at).toLocaleString("id-ID")}
                    </p>
                    <div className="mt-1.5">
                      <ImportProgressBar progress={p} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground">
                    {pending ? <span>{pending} belum diriset</span> : null}
                    {reviewing ? <span className="text-accent-text">{reviewing} proses/review</span> : null}
                    {seeded ? <span className="text-status-text">{seeded} seeded</span> : null}
                    {failed ? <span className="text-destructive">{failed} gagal</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminSection>
    </div>
  );
}
