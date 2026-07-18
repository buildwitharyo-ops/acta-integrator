import { requireAdminPage } from "@/lib/admin/auth";
import { CatalogJobHistory } from "@/components/admin/CatalogJobHistory";
import { getJobs } from "@/lib/catalog-pipeline/queries";

export default async function CatalogJobsPage() {
  await requireAdminPage();
  const jobs = await getJobs();
  return (
    <div className="max-w-4xl space-y-4 pb-16">
      <div>
        <h1 className="text-xl font-semibold">Riwayat Pekerjaan</h1>
        <p className="text-sm text-muted-foreground">Semua job riset AI (Trigger.dev) — retry per job yang gagal, tanpa mengulang batch penuh.</p>
      </div>
      <CatalogJobHistory jobs={jobs} />
    </div>
  );
}
