import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSettingsPage() {
  await requireAdminPage("admin"); // re-verified per page (layouts skip soft nav); editors → /admin

  const sb = createAdminClient();
  const [{ data: settings }, { data: products }] = await Promise.all([
    sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("products").select("id, name").eq("status", "published").order("name"),
  ]);

  return <SettingsForm settings={settings} products={products ?? []} />;
}
