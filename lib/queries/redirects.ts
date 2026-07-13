import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

// Dynamic-route miss → lookup redirects → permanentRedirect (03 §5.4, 09 §4.16).
// Read uncached at request time; the table is empty until an editor changes a published slug.
export async function getRedirectDestination(sourcePath: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("v_redirects")
    .select("destination_path")
    .eq("source_path", sourcePath)
    .maybeSingle();
  return data?.destination_path ?? null;
}
