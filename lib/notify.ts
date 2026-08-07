import "server-only";
import { SITE_URL } from "@/lib/site-url";

// Owner notification for a new lead (04 §17.0 P0-7, §18 R12; 09 §4.17 / 01-PRD §5.5).
//
// This was a verified no-op (`{ void lead; }`) while the site promised a human reply. A lead that is
// only written to a table nobody watches is a lost lead, and the CTA copy that promises otherwise is
// the most expensive kind of broken promise. It is now a real delivery with two properties that
// matter more than the transport itself:
//
//  1. Fan-out to a SHARED destination, never to one person. A WhatsApp GROUP and an email ALIAS —
//     both reach an owner and a backup, so a phone left on silent is not a single point of failure.
//  2. Non-fatal, always. Every failure is caught and logged; the visitor's submit already succeeded
//     and the lead is already durably stored in `leads` before this runs. Notification is an alert
//     layer over durable state, never the state itself.
//
// Configuration (all server-only, set in the Vercel production environment):
//   LEAD_ALERT_WA_WEBHOOK_URL  POST endpoint of the WhatsApp bridge that posts into the shared group
//                              (Fonnte / Wablas / WA Cloud API relay / n8n — anything that accepts a
//                              JSON POST). Contract sent: see WebhookBody below.
//   LEAD_ALERT_WA_TOKEN        optional; sent as `Authorization: Bearer <token>`.
//   LEAD_ALERT_WA_GROUP        optional; group id/JID, passed straight through as `group`.
//   RESEND_API_KEY             Resend API key. HTTP only — no SDK, no new dependency.
//   LEAD_ALERT_EMAIL_FROM      verified sender, e.g. "ACTA Website <lead@actainstalasiaudiovisual.com>".
//   LEAD_ALERT_EMAIL_TO        the ALIAS, comma-separated if the alias is not yet a real group.
//   LEAD_ALERT_COVERAGE        the coverage window this alert is answered within; it is quoted back
//                              in the alert so the promise on the site and the promise to the team
//                              are the same sentence. Default: "hari kerja, 09.00–18.00 WIB".
//
// A channel with missing configuration is skipped, not failed. If NO channel is configured the lead
// is still saved and forwarded — but that is an operational hole, so it is logged loudly rather than
// swallowed. Until at least one channel is live the site copy must read "Dibalas manusia pada hari
// kerja." and not a specific hour count (R12).

export type LeadNotice = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  page_url: string;
};

type AlertPayload = {
  subject: string;
  text: string;
  replyTo: string | null;
  lead: LeadNotice;
};

type WebhookBody = {
  event: "lead.created";
  group: string | null;
  text: string;
  lead: LeadNotice;
};

type Channel = { name: string; send: () => Promise<void> };

// Both channels run in parallel and are awaited by the submit action, so this bounds how long a
// visitor can be made to wait for infrastructure that is not theirs.
const TIMEOUT_MS = 5000;

const DEFAULT_COVERAGE = "hari kerja, 09.00–18.00 WIB";

function env(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

// Same normalisation the ACTA-OS dedup index applies, so the deep link in the alert and the contact
// record in the CRM point at the same number: 08xx → 628xx, bare 8xx → 628xx.
function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (!digits.startsWith("62")) digits = `62${digits}`;
  return digits;
}

function jakartaTimestamp(): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

// One body for both channels: an alert is read on a phone, and the only useful version of it is the
// one that can be acted on without opening anything else.
function buildPayload(lead: LeadNotice): AlertPayload {
  const phone = normalizePhone(lead.phone);
  const coverage = env("LEAD_ALERT_COVERAGE") ?? DEFAULT_COVERAGE;
  const who = lead.company ? `${lead.name} — ${lead.company}` : lead.name;

  const lines = [
    "Lead baru dari website ACTA",
    "",
    `Nama       : ${lead.name}`,
    `Perusahaan : ${lead.company ?? "-"}`,
    `Email      : ${lead.email ?? "-"}`,
    `Telepon/WA : ${lead.phone ?? "-"}`,
    `Halaman    : ${lead.page_url || "-"}`,
    `Masuk      : ${jakartaTimestamp()} WIB`,
    "",
    phone ? `Balas via WhatsApp: https://wa.me/${phone}` : "Tidak ada nomor WhatsApp pada lead ini.",
    lead.email ? `Balas via email  : mailto:${lead.email}` : "Tidak ada email pada lead ini.",
    `Riwayat lead      : ${SITE_URL}/admin/leads`,
    "",
    `Komitmen kita: dibalas manusia pada ${coverage}.`,
  ];

  return {
    subject: `Lead baru: ${who}`,
    text: lines.join("\n"),
    replyTo: lead.email ?? null,
    lead,
  };
}

async function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) {
    // Read the body for the log — a 4xx from either provider names the misconfiguration exactly
    // (unverified sender, expired key, unknown group), which is the whole value of the log line.
    const detail = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} ${detail.slice(0, 300)}`.trim());
  }
}

function whatsappChannel(payload: AlertPayload): Channel | null {
  const url = env("LEAD_ALERT_WA_WEBHOOK_URL");
  if (!url) return null;

  const token = env("LEAD_ALERT_WA_TOKEN");
  const body: WebhookBody = {
    event: "lead.created",
    group: env("LEAD_ALERT_WA_GROUP"),
    text: payload.text,
    lead: payload.lead,
  };

  return {
    name: "whatsapp-group",
    send: () => postJson(url, body, token ? { authorization: `Bearer ${token}` } : {}),
  };
}

function emailChannel(payload: AlertPayload): Channel | null {
  const apiKey = env("RESEND_API_KEY");
  const from = env("LEAD_ALERT_EMAIL_FROM");
  const to = (env("LEAD_ALERT_EMAIL_TO") ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address.length > 0);
  if (!apiKey || !from || to.length === 0) return null;

  return {
    name: "email-alias",
    send: () =>
      postJson(
        "https://api.resend.com/emails",
        {
          from,
          to,
          subject: payload.subject,
          text: payload.text,
          // Replying to the alert replies to the prospect. The fastest path from alert to answer is
          // the one that needs no copy-paste.
          ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
        },
        { authorization: `Bearer ${apiKey}` },
      ),
  };
}

/**
 * Alert the owner (and backup) about a new lead. Best-effort by contract: this never throws and
 * never rejects, so a dead webhook or an expired API key can never turn a saved lead into a failed
 * submit for the visitor.
 */
export async function notifyOwnerOfLead(lead: LeadNotice): Promise<void> {
  const payload = buildPayload(lead);
  const channels = [whatsappChannel(payload), emailChannel(payload)].filter(
    (channel): channel is Channel => channel !== null,
  );

  if (channels.length === 0) {
    console.error(
      "[notify] Lead tersimpan tetapi TIDAK ADA kanal notifikasi aktif — set LEAD_ALERT_WA_WEBHOOK_URL dan/atau RESEND_API_KEY + LEAD_ALERT_EMAIL_FROM + LEAD_ALERT_EMAIL_TO.",
      { page_url: lead.page_url },
    );
    return;
  }

  const results = await Promise.allSettled(channels.map((channel) => channel.send()));

  const failed = results
    .map((result, index) => ({ result, name: channels[index]?.name ?? "unknown" }))
    .filter((entry): entry is { result: PromiseRejectedResult; name: string } => entry.result.status === "rejected");

  for (const entry of failed) {
    console.error(`[notify] Kanal ${entry.name} gagal mengirim alert lead:`, entry.result.reason);
  }

  if (failed.length === channels.length) {
    console.error(
      "[notify] SEMUA kanal gagal — lead hanya ada di tabel `leads` dan (jika berhasil) di ACTA-OS. Periksa /admin/leads secara manual.",
      { page_url: lead.page_url },
    );
  }
}
