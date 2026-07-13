import { LeadsMonitor } from "@/components/admin/LeadsMonitor";
import { requireAdminPage } from "@/lib/admin/auth";
import { getActaOsLeads } from "@/lib/acta-os";

export default async function AdminLeadsPage() {
  await requireAdminPage();
  const res = await getActaOsLeads();
  const osUrl = process.env.NEXT_PUBLIC_ACTA_OS_URL ?? null;

  if (!res.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Leads</h1>
        <div className="rounded-lg border border-border bg-muted/30 px-5 py-8 text-center text-sm text-muted-foreground">
          Tidak bisa terhubung ke ACTA-OS ({res.error}). Lead tetap dikelola di ACTA-OS.
        </div>
      </div>
    );
  }

  return <LeadsMonitor leads={res.leads} osUrl={osUrl} />;
}
