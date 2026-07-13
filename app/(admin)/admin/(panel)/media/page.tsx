import { MediaLibrary, type MediaRow } from "@/components/admin/MediaLibrary";
import { requireAdminPage } from "@/lib/admin/auth";
import { buildMediaUsageMap } from "@/lib/admin/media-usage";
import { fetchAllRows } from "@/lib/admin/paginate";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminMediaPage() {
  await requireAdminPage();
  const sb = createAdminClient();

  const [media, usage] = await Promise.all([
    fetchAllRows<MediaRow>((from, to) =>
      sb
        .from("media")
        .select("id, kind, storage_path, external_url, alt, caption, source_license, is_placeholder, created_at")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    buildMediaUsageMap(),
  ]);

  return <MediaLibrary media={media} usage={usage} />;
}
