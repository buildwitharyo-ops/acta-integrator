"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { forwardLeadToActaOs } from "@/lib/acta-os";
import { notifyOwnerOfLead } from "@/lib/notify";
import { leadSchema, type ActionResult } from "@/lib/schemas/lead";

export async function submitLead(formData: FormData): Promise<ActionResult> {
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  // Honeypot — bots fill the hidden 'website' field. Pretend success, store nothing.
  if (str("website")) return { ok: true };

  const parsed = leadSchema.safeParse({
    form_type: str("form_type"),
    name: str("name"),
    company: str("company"),
    email: str("email"),
    phone: str("phone"),
    message: str("message"),
    product_slug: str("product_slug"),
    solution_slug: str("solution_slug"),
    page_url: str("page_url") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const lead = parsed.data;
  const admin = createAdminClient();

  // Rate limit: max 5/hour/IP, keyed by a hash of IP + day (no raw IP stored).
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const ipHash = createHash("sha256")
    .update(`${ip}:${new Date().toISOString().slice(0, 10)}`)
    .digest("hex");

  const { data: throttle } = await admin
    .from("lead_throttle")
    .select("*")
    .eq("ip_hash", ipHash)
    .maybeSingle();
  if (throttle) {
    const ageMs = Date.now() - new Date(throttle.window_start).getTime();
    if (ageMs < 3_600_000) {
      if (throttle.count >= 5) {
        return { ok: false, error: "Terlalu banyak permintaan. Coba lagi dalam satu jam." };
      }
      await admin.from("lead_throttle").update({ count: throttle.count + 1 }).eq("ip_hash", ipHash);
    } else {
      await admin
        .from("lead_throttle")
        .update({ window_start: new Date().toISOString(), count: 1 })
        .eq("ip_hash", ipHash);
    }
  } else {
    await admin.from("lead_throttle").insert({ ip_hash: ipHash });
  }

  // Persist locally first (durability — survives an ACTA-OS outage).
  const { data: inserted, error } = await admin
    .from("leads")
    .insert({
      form_type: lead.form_type,
      name: lead.name,
      company: lead.company ?? null,
      email: lead.email || null,
      phone: lead.phone || null,
      message: lead.message ?? null,
      product_slug: lead.product_slug ?? null,
      solution_slug: lead.solution_slug ?? null,
      page_url: lead.page_url,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    return { ok: false, error: "Gagal menyimpan. Silakan hubungi kami via WhatsApp." };
  }

  // Forward to ACTA-OS — failure never fails the user's submit (10-TECH §6).
  const forward = await forwardLeadToActaOs({
    name: lead.name,
    company: lead.company,
    email: lead.email || null,
    phone: lead.phone || null,
    message: lead.message,
    page_url: lead.page_url,
    product_slug: lead.product_slug,
    solution_slug: lead.solution_slug,
    form_type: lead.form_type,
  });
  await admin
    .from("leads")
    .update({ forwarded_ok: forward.ok, forward_error: forward.ok ? null : forward.error })
    .eq("id", inserted.id);

  // Best-effort owner notification — never fails the submit.
  await notifyOwnerOfLead({
    name: lead.name,
    company: lead.company,
    email: lead.email || null,
    phone: lead.phone || null,
    page_url: lead.page_url,
  }).catch(() => {});

  return { ok: true };
}
