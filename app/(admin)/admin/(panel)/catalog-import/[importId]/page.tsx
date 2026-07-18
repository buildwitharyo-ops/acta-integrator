import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/auth";
import { CatalogStagingTable } from "@/components/admin/CatalogStagingTable";
import { getApprovableItemIds, getImportWithItems } from "@/lib/catalog-pipeline/queries";

type Params = { importId: string };

export default async function CatalogImportDetailPage({ params }: { params: Promise<Params> }) {
  await requireAdminPage();
  const { importId } = await params;
  const [data, approvableIds] = await Promise.all([getImportWithItems(importId), getApprovableItemIds(importId)]);
  if (!data) notFound();

  return (
    <div className="space-y-4 pb-16">
      <div>
        <h1 className="text-xl font-semibold">{data.import.source_filename}</h1>
        <p className="text-sm text-muted-foreground">{data.items.length} baris produk terbaca.</p>
      </div>
      <CatalogStagingTable importId={importId} items={data.items} approvableCount={approvableIds.length} />
    </div>
  );
}
