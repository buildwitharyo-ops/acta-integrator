import { RedirectsManager, type RedirectRow } from "@/components/admin/RedirectsManager";
import { requireAdminPage } from "@/lib/admin/auth";
import { fetchAllRows } from "@/lib/admin/paginate";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminRedirectsPage() {
  await requireAdminPage();
  const sb = createAdminClient();
  const redirects = await fetchAllRows<RedirectRow>((from, to) =>
    sb.from("redirects").select("id, source_path, destination_path, created_at").order("created_at", { ascending: false }).range(from, to),
  );
  return <RedirectsManager redirects={redirects} />;
}
