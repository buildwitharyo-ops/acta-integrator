"use server";

import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { SECTION_FIELDS, contentSchema, isValidSection, pageRevalidateTag } from "@/lib/page-sections/registry";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type PageSaveResult = { ok: true } | { ok: false; error: string };

// Save one page section (upsert by page_key+section_key). Not a page builder: pageKey/sectionKey
// must be a known pair, and content is validated against the shared registry Zod schema (09 §4.2).
export async function savePageSection(
  pageKey: string,
  sectionKey: string,
  contentInput: unknown,
  isEnabled: boolean,
): Promise<PageSaveResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };

  if (!isValidSection(pageKey, sectionKey)) return { ok: false, error: "Section tidak dikenal." };
  const fields = SECTION_FIELDS[sectionKey];
  if (!fields) return { ok: false, error: "Schema section tidak ditemukan." };

  const parsed = contentSchema(fields).safeParse(contentInput ?? {});
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const supabase = await createClient();
  const { data, error: upErr } = await supabase
    .from("page_sections")
    .upsert(
      {
        page_key: pageKey,
        section_key: sectionKey,
        content: parsed.data as unknown as Json,
        is_enabled: isEnabled,
        updated_by: ctx.userId,
      },
      { onConflict: "page_key,section_key" },
    )
    .select("id")
    .single();
  if (upErr || !data) return { ok: false, error: "Gagal menyimpan (akses ditolak?)." };

  revalidateTag(pageRevalidateTag(pageKey));
  return { ok: true };
}
