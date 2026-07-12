import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Cookie-less anon client for cached marketing reads (safe inside unstable_cache).
// Public reads only ever touch the v_* views, which expose published + public columns.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
