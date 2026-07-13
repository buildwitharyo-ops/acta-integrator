"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { inputCls } from "@/components/admin/fields";
import { createRedirect, deleteRedirect } from "@/lib/actions/admin/redirects";

export type RedirectRow = { id: string; source_path: string; destination_path: string; created_at: string };

export function RedirectsManager({ redirects }: { redirects: RedirectRow[] }) {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    const res = await createRedirect({ source_path: source, destination_path: dest });
    setBusy(false);
    if (res.ok) {
      toast.success("Redirect ditambahkan.");
      setSource("");
      setDest("");
      router.refresh();
    } else toast.error(res.error);
  }
  async function remove(r: RedirectRow) {
    if (!confirm(`Hapus redirect ${r.source_path}?`)) return;
    const res = await deleteRedirect(r.id);
    if (res.ok) {
      toast.success("Redirect dihapus.");
      router.refresh();
    } else toast.error(res.error);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Redirects</h1>
        <p className="text-sm text-muted-foreground">301 permanen. Slug published yang berubah otomatis menambah baris di sini.</p>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-4">
        <label className="flex-1 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Source path</span>
          <input className={inputCls} placeholder="/url-lama" value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <ArrowRight className="mb-2.5 h-4 w-4 text-muted-foreground" />
        <label className="flex-1 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Destination</span>
          <input className={inputCls} placeholder="/url-baru" value={dest} onChange={(e) => setDest(e.target.value)} />
        </label>
        <button type="button" onClick={add} disabled={busy || !source || !dest} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-60">
          <Plus className="h-3.5 w-3.5" /> Tambah
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">Source</th><th className="px-4 py-2.5 font-medium">Destination</th><th className="px-4 py-2.5" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {redirects.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-mono text-xs">{r.source_path}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.destination_path}</td>
                <td className="px-4 py-2.5 text-right">
                  <button type="button" onClick={() => remove(r)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
            {redirects.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada redirect.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
