"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchLeadActivities } from "@/lib/actions/admin/leads";
import type { ActaOsActivity, ActaOsLead } from "@/lib/acta-os";
import { inputCls } from "@/components/admin/fields";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const STATUS_CLASS: Record<string, string> = {
  inbox: "bg-primary/15 text-accent-text",
  baru: "bg-primary/15 text-accent-text",
  dikontak: "bg-muted text-foreground",
  qualified: "bg-status/15 text-status-text",
  lost: "bg-destructive/10 text-destructive",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formLabel(form: string): string {
  if (form === "quote_form" || form === "quote_request") return "Penawaran";
  if (form === "contact_form") return "Kontak";
  return form || "—";
}

export function LeadsMonitor({ leads, osUrl }: { leads: ActaOsLead[]; osUrl: string | null }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState("all");
  const [selected, setSelected] = useState<ActaOsLead | null>(null);

  const statuses = useMemo(() => Array.from(new Set(leads.map((l) => l.status).filter(Boolean))) as string[], [leads]);
  const forms = useMemo(() => Array.from(new Set(leads.map((l) => l.form).filter(Boolean))), [leads]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (form !== "all" && l.form !== form) return false;
      if (query && !`${l.company_name ?? ""} ${l.contact_name ?? ""} ${l.target_need ?? ""}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [leads, q, status, form]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">Monitor read-only. Lead dikelola sepenuhnya di ACTA-OS — halaman ini tidak mengubah data.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input className={inputCls + " max-w-xs"} placeholder="Cari nama / perusahaan…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputCls + " w-auto"} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Semua status</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={inputCls + " w-auto"} value={form} onChange={(e) => setForm(e.target.value)}>
          <option value="all">Semua sumber</option>
          {forms.map((s) => <option key={s} value={s}>{formLabel(s)}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Waktu</th>
              <th className="px-4 py-2.5 font-medium">Nama / Perusahaan</th>
              <th className="px-4 py-2.5 font-medium">Sumber</th>
              <th className="px-4 py-2.5 font-medium">Konteks</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l) => (
              <tr key={l.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(l)}>
                <td className="px-4 py-2.5 text-muted-foreground">{fmt(l.created_at)}</td>
                <td className="px-4 py-2.5">
                  <div className="font-medium">{l.contact_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{l.company_name ?? "—"}</div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{formLabel(l.form)}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.product_slug || l.solution_slug || "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[l.status ?? ""] ?? "bg-muted text-muted-foreground"}`}>{l.status ?? "—"}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">Belum ada submission dari situs. Klik WhatsApp dihitung sebagai analytics (GA4), bukan lead.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <LeadDrawer lead={selected} osUrl={osUrl} onClose={() => setSelected(null)} />
    </div>
  );
}

function LeadDrawer({ lead, osUrl, onClose }: { lead: ActaOsLead | null; osUrl: string | null; onClose: () => void }) {
  const [activities, setActivities] = useState<ActaOsActivity[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    let ignore = false;
    setActivities(null);
    setLoading(true);
    fetchLeadActivities(lead.id).then((res) => {
      if (ignore) return; // opened another lead before this resolved — drop the stale response
      setActivities(res.ok ? res.activities : []);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [lead]);

  return (
    <Sheet open={lead !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>Detail lead</SheetTitle></SheetHeader>
        {lead ? (
          <div className="mt-4 space-y-4 text-sm">
            <Row label="Waktu" value={fmt(lead.created_at)} />
            <Row label="Kontak" value={lead.contact_name ?? "—"} />
            <Row label="Perusahaan" value={lead.company_name ?? "—"} />
            <Row label="Sumber" value={formLabel(lead.form)} />
            <Row label="Status" value={lead.status ?? "—"} />
            {lead.product_slug ? <Row label="Produk" value={lead.product_slug} /> : null}
            {lead.solution_slug ? <Row label="Solusi" value={lead.solution_slug} /> : null}
            {lead.page_url ? <Row label="Halaman asal" value={lead.page_url} /> : null}
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kebutuhan</div>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{lead.target_need || "—"}</p>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktivitas</div>
              {loading ? <p className="text-muted-foreground">Memuat…</p> : null}
              {activities && activities.length === 0 && !loading ? <p className="text-muted-foreground">Belum ada aktivitas.</p> : null}
              <ul className="space-y-2">
                {(activities ?? []).map((a) => (
                  <li key={a.id} className="rounded-md border border-border px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="font-medium capitalize text-foreground">{a.type}</span><span>{fmt(a.created_at)}</span></div>
                    {a.body ? <p className="mt-1 text-foreground/90">{a.body}</p> : null}
                  </li>
                ))}
              </ul>
            </div>

            {osUrl ? (
              <a href={`${osUrl.replace(/\/$/, "")}/leads/${lead.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                <ExternalLink className="h-3.5 w-3.5" /> Buka di ACTA-OS
              </a>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="max-w-[65%] break-words text-right text-foreground">{value}</span>
    </div>
  );
}
