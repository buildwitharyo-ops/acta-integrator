const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

type MediaRef =
  | { storage_path?: string | null; external_url?: string | null }
  | null
  | undefined;

// Resolve a media row to a final image URL (09 §5.2): Storage path → public URL, else external.
export function mediaUrl(media: MediaRef): string | null {
  if (!media) return null;
  if (media.storage_path) {
    return `${SUPABASE_URL}/storage/v1/object/public/media/${media.storage_path}`;
  }
  return media.external_url ?? null;
}
