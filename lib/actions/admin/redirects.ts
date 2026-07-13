"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export type RedirectResult = { ok: true } | { ok: false; error: string };

const schema = z
  .object({
    source_path: z.string().trim().regex(/^\/[^\s]*$/, "Source harus path yang diawali / (mis. /old-url)"),
    destination_path: z.string().trim().min(1, "Destination wajib").regex(/^(\/[^\s]*|https?:\/\/\S+)$/, "Destination harus path / atau URL lengkap"),
  })
  .refine((v) => v.source_path !== v.destination_path, { message: "Source dan destination tidak boleh sama.", path: ["destination_path"] });

export async function createRedirect(input: unknown): Promise<RedirectResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const supabase = await createClient();
  const { error: insErr } = await supabase.from("redirects").insert(parsed.data).select("id").single();
  if (insErr) return { ok: false, error: insErr.code === "23505" ? "Source path itu sudah punya redirect." : "Gagal menyimpan redirect." };
  return { ok: true };
}

export async function deleteRedirect(id: string): Promise<RedirectResult> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const supabase = await createClient();
  const { data: deleted, error: delErr } = await supabase.from("redirects").delete().eq("id", id).select("id");
  if (delErr) return { ok: false, error: "Gagal menghapus redirect." };
  if (!deleted || deleted.length === 0) return { ok: false, error: "Tidak bisa menghapus (akses ditolak)." };
  return { ok: true };
}
