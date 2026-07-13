"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/schemas/lead";

const inviteSchema = z.object({
  email: z.email("Email tidak valid"),
  displayName: z.string().min(1, "Nama wajib diisi"),
  role: z.enum(["admin", "editor"]),
});

// Admin-only. Invites a Supabase Auth user + creates their admin_users row.
export async function inviteAdminUser(input: unknown): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin("admin");
  if (!ctx) return { ok: false, error: error };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const sb = createAdminClient();
  const { data, error: inviteError } = await sb.auth.admin.inviteUserByEmail(parsed.data.email);
  if (inviteError || !data.user) {
    return { ok: false, error: "Gagal mengundang user. Cek apakah email sudah terdaftar." };
  }

  const { error: rowError } = await sb.from("admin_users").insert({
    user_id: data.user.id,
    email: parsed.data.email,
    display_name: parsed.data.displayName,
    role: parsed.data.role,
    is_active: true,
  });
  if (rowError) {
    return { ok: false, error: "User dibuat di Auth tapi gagal menyimpan role. Hubungi developer." };
  }

  return { ok: true };
}
