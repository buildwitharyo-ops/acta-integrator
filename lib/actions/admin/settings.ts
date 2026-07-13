"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/schemas/lead";

const optionalText = z.string().trim().optional().nullable();

const settingsSchema = z.object({
  email: z.email("Email tidak valid"),
  whatsapp_number: z.string().trim().min(5, "Nomor WhatsApp wajib diisi"),
  instagram: optionalText,
  address: optionalText,
  city: optionalText,
  business_hours: optionalText,
  tagline: optionalText,
  footer_description: optionalText,
  response_claim: optionalText,
  claim_verified: z.boolean(),
  seo_default_title: optionalText,
  seo_default_description: optionalText,
  featured_product_id: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().uuid().nullable(),
  ),
});

// Admin-only (RLS also enforces admin_role='admin' on site_settings). One tag: 'settings'.
export async function updateSettings(input: unknown): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const supabase = await createClient();
  const { data: updated, error: updateError } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, updated_by: ctx.userId })
    .eq("id", 1)
    .select("id");

  if (updateError) return { ok: false, error: "Gagal menyimpan pengaturan." };
  if (!updated || updated.length === 0) return { ok: false, error: "Baris pengaturan tidak ditemukan atau akses ditolak." };

  revalidateTag("settings");
  return { ok: true };
}
