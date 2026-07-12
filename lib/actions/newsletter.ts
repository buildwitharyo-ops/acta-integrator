"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/schemas/lead";

const emailSchema = z.email();

export async function subscribeNewsletter(formData: FormData): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: "Email tidak valid." };

  const admin = createAdminClient();
  const { error } = await admin.from("newsletter_subscribers").insert({
    email: parsed.data,
    source_path: (formData.get("source_path") as string) || null,
  });

  // Idempotent: a duplicate email (unique violation) still returns success and
  // never reveals whether the address was already subscribed.
  if (error && error.code !== "23505") {
    return { ok: false, error: "Gagal berlangganan. Coba lagi nanti." };
  }
  return { ok: true };
}
