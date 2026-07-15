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
    // 23505 = an existing company already holds this phone under the unique dedup index
    // normalize_phone(coalesce(whatsapp,phone)). PostgREST can't filter that functional index, so we
    // best-effort re-select on the raw phone in either column. LIMITATION: a company whose phone is
    // stored non-normalized (e.g. "(021)…") won't match here — robustly recovering every collision
    // needs an ACTA-OS RPC comparing normalize_phone() on both sides (a CRM-side change, 09 §10).
    // Email is deliberately NOT a match key: it could attach this lead to an unrelated company that
    // merely shares an address. Miss ⇒ forward fails but the lead stays durably saved locally.
    if (!phone) return { ok: false, error: "company dedup 23505 without phone key" };
    const existing = await os
      .from("companies")
      .select("id")
      .or(`whatsapp.eq.${phone},phone.eq.${phone}`)
      .limit(1)
      .maybeSingle();
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

// ── Read side (09 §10.4): /admin/leads MONITORS ACTA-OS via the same read-only connection.
// The site never mutates ACTA-OS from here — source of truth is the CRM.

function osReadClient() {
  const url = process.env.ACTA_OS_SUPABASE_URL;
  const key = process.env.ACTA_OS_SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// research_notes is written as "web:{page_url}; produk:{slug}; solusi:{slug}; form:{form_type}".
function parseNotes(notes: string | null): { page_url: string; product_slug: string; solution_slug: string; form: string } {
  const out = { page_url: "", product_slug: "", solution_slug: "", form: "" };
  if (!notes) return out;
  for (const part of notes.split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === "web") out.page_url = val;
    else if (key === "produk") out.product_slug = val === "-" ? "" : val;
    else if (key === "solusi") out.solution_slug = val === "-" ? "" : val;
    else if (key === "form") out.form = val;
  }
  return out;
}

export type ActaOsLead = {
  id: string;
  created_at: string | null;
  status: string | null;
  company_name: string | null;
  contact_name: string | null;
  target_need: string | null;
  form: string;
  page_url: string;
  product_slug: string;
  solution_slug: string;
};

export type ActaOsActivity = { id: string; type: string; body: string | null; created_at: string | null };

type EmbeddedLead = {
  id: string;
  created_at: string | null;
  status: string | null;
  target_need: string | null;
  research_notes: string | null;
  companies: { name: string | null } | null;
  contacts: { name: string | null } | null;
};

function shapeLead(row: EmbeddedLead): ActaOsLead {
  const notes = parseNotes(row.research_notes);
  return {
    id: row.id,
    created_at: row.created_at,
    status: row.status,
    company_name: row.companies?.name ?? null,
    contact_name: row.contacts?.name ?? null,
    target_need: row.target_need,
    form: notes.form,
    page_url: notes.page_url,
    product_slug: notes.product_slug,
    solution_slug: notes.solution_slug,
  };
}

export async function getActaOsLeads(): Promise<{ ok: true; leads: ActaOsLead[] } | { ok: false; error: string }> {
  const os = osReadClient();
  if (!os) return { ok: false, error: "ACTA-OS belum dikonfigurasi." };
  const { data, error } = await os
    .from("leads")
    .select("id, created_at, status, target_need, research_notes, companies(name), contacts(name)")
    .eq("source", "website")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return { ok: false, error: error.message };
  return { ok: true, leads: (data as unknown as EmbeddedLead[] | null ?? []).map(shapeLead) };
}

export async function getActaOsLeadDetail(
  id: string,
): Promise<{ ok: true; lead: ActaOsLead; activities: ActaOsActivity[] } | { ok: false; error: string }> {
  const os = osReadClient();
  if (!os) return { ok: false, error: "ACTA-OS belum dikonfigurasi." };
  const [{ data: lead, error: lErr }, { data: acts }] = await Promise.all([
    os.from("leads").select("id, created_at, status, target_need, research_notes, companies(name), contacts(name)").eq("id", id).maybeSingle(),
    os.from("lead_activities").select("id, type, body, created_at").eq("lead_id", id).order("created_at", { ascending: true }),
  ]);
  if (lErr || !lead) return { ok: false, error: lErr?.message ?? "Lead tidak ditemukan." };
  return { ok: true, lead: shapeLead(lead as unknown as EmbeddedLead), activities: (acts as ActaOsActivity[] | null) ?? [] };
}
