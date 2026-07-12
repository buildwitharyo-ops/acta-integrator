import "server-only";

export type LeadNotice = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  page_url: string;
};

// Best-effort owner notification for a new lead (09 §4.17 / 01-PRD §5.5).
// The delivery channel (email/WA) is connected in Fase 12 (lead end-to-end);
// until then this is a no-op. Callers must treat failure as non-fatal.
export async function notifyOwnerOfLead(lead: LeadNotice): Promise<void> {
  void lead;
}
