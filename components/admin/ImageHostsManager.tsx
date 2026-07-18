"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addAllowedImageHost, removeAllowedImageHost } from "@/lib/actions/admin/media";
import { inputCls } from "@/components/admin/fields";

type Host = { id: string; hostname: string; notes: string | null; created_at: string };

export function ImageHostsManager({ hardcoded, dbHosts }: { hardcoded: string[]; dbHosts: Host[] }) {
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAdd() {
    setBusy(true);
    const res = await addAllowedImageHost({ hostname, notes: notes || null });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`"${hostname}" ditambahkan.`);
    setHostname("");
    setNotes("");
    router.refresh();
  }

  async function onRemove(id: string, name: string) {
    setBusy(true);
    const res = await removeAllowedImageHost(id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`"${name}" dihapus.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Hardcode di kode (butuh deploy untuk ubah — dipakai next.config.ts)</p>
        <div className="flex flex-wrap gap-1.5">
          {hardcoded.map((h) => (
            <span key={h} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {h}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Ditambahkan admin (langsung aktif, tanpa deploy)</p>
        {dbHosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada.</p>
        ) : (
          <ul className="space-y-1">
            {dbHosts.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                <span>
                  {h.hostname}
                  {h.notes ? <span className="ml-2 text-xs text-muted-foreground">— {h.notes}</span> : null}
                </span>
                <button type="button" onClick={() => onRemove(h.id, h.hostname)} disabled={busy} className="text-xs text-destructive hover:underline disabled:opacity-50">
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Host baru</label>
          <input className={inputCls} placeholder="cdn.merek.com atau *.merek.com" value={hostname} onChange={(e) => setHostname(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Catatan (opsional)</label>
          <input className={inputCls} placeholder="mis. nama brand" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || !hostname.trim()}
          className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Tambah
        </button>
      </div>
    </div>
  );
}
