import "server-only";
import { createClient } from "@supabase/supabase-js";

// Adapter to the separate ACTA-OS CRM project. This is the ONLY file that knows
// ACTA-OS column names; the contract is locked in 09-DATA-SCHEMA.md §10.

export type ForwardLead = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  page_url: string;
  product_slug?: string | null;
  solution_slug?: string | null;
  form_type: string;
};

type ForwardResult = { ok: true } | { ok: false; error: string };

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (!digits.startsWith("62")) digits = `62${digits}`;
  return digits;
}

async function forward(lead: ForwardLead): Promise<ForwardResult> {
  const url = process.env.ACTA_OS_SUPABASE_URL;
  const key = process.env.ACTA_OS_SUPABASE_SERVICE_KEY;
  if (!url || !key) return { ok: false, error: "ACTA-OS not configured" };

  const os = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Normalize the phone the same way the ACTA-OS dedup index does (normalize_phone),
  // so it also matches on the 23505 re-select. As a bonus, digits-only is safe to
  // interpolate into the PostgREST .or() filter (no injection surface).
  const phone = normalizePhone(lead.phone);

  // 1. Match or create company. Dedup index is on normalize_phone/normalize_domain;
  //    we insert first and re-select on unique_violation (23505) — never upsert on name.
  let companyId: string | null = null;
  const created = await os
    .from("companies")
    .insert({
      name: lead.company ?? lead.name,
      whatsapp: phone,
      email: lead.email ?? null,
      created_by: null,
    })
    .select("id")
    .single();

  if (created.error) {
    if (created.error.code !== "23505") return { ok: false, error: created.error.message };
    const filters = [
      phone ? `whatsapp.eq.${phone}` : null,
      lead.email ? `email.eq.${lead.email}` : null,
    ]
      .filter(Boolean)
      .join(",");
    if (!filters) return { ok: false, error: "company dedup without match key" };
    const existing = await os.from("companies").select("id").or(filters).limit(1).maybeSingle();
    companyId = (existing.data?.id as string | undefined) ?? null;
  } else {
    companyId = created.data.id as string;
  }
  if (!companyId) return { ok: false, error: "company match failed" };

  // 2. Contact.
  let contactId: string | null = null;
  const contact = await os
    .from("contacts")
    .insert({ company_id: companyId, name: lead.name, whatsapp: phone, email: lead.email ?? null })
    .select("id")
    .single();
  if (!contact.error) contactId = contact.data.id as string;

  // 3. Lead — source/status fixed per contract; never write illegal fields.
  const notes = `web:${lead.page_url}; produk:${lead.product_slug ?? "-"}; solusi:${lead.solution_slug ?? "-"}; form:${lead.form_type}`;
  const inserted = await os.from("leads").insert({
    company_id: companyId,
    primary_contact_id: contactId,
    source: "website",
    status: "inbox",
    target_need: lead.message ?? null,
    research_notes: notes,
    est_value: 0,
    solution_id: null,
    assigned_to: null,
    created_by: null,
  });
  if (inserted.error) return { ok: false, error: inserted.error.message };

  return { ok: true };
}

export async function forwardLeadToActaOs(lead: ForwardLead): Promise<ForwardResult> {
  const timeout = new Promise<ForwardResult>((resolve) =>
    setTimeout(() => resolve({ ok: false, error: "ACTA-OS timeout" }), 8000),
  );
  try {
    return await Promise.race([forward(lead), timeout]);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ACTA-OS forward failed" };
  }
}
