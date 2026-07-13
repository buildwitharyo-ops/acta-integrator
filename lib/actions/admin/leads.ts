"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { getActaOsLeadDetail, type ActaOsActivity } from "@/lib/acta-os";

// Read-only: fetch a lead's activity timeline from ACTA-OS for the detail drawer (08 §3.7).
export async function fetchLeadActivities(id: string): Promise<{ ok: true; activities: ActaOsActivity[] } | { ok: false; error: string }> {
  const { ctx, error } = await requireAdmin("editor");
  if (!ctx) return { ok: false, error };
  const res = await getActaOsLeadDetail(id);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, activities: res.activities };
}
