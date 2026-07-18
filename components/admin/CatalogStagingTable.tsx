"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bulkApproveReady, getItemStatuses, startResearch } from "@/lib/actions/admin/catalog-pipeline";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  row_index: number;
  brand_raw: string;
  model_raw: string;
  category_guess: string | null;
  price_internal: number | null;
  dedupe_status: string;
  matched_product_id: string | null;
  status: string;
};

const DEDUPE_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "Baru", variant: "outline" },
  dup_in_sheet: { label: "Duplikat di sheet", variant: "secondary" },
  dup_in_db: { label: "Mirip di DB", variant: "secondary" },
  skip_manual: { label: "Di-skip manual", variant: "secondary" },
};

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Belum diriset", variant: "outline" },
  queued: { label: "Antre…", variant: "secondary" },
  researching: { label: "Meriset…", variant: "secondary" },
  ready_for_review: { label: "Siap review", variant: "default" },
  approved: { label: "Disetujui", variant: "default" },
  rejected: { label: "Ditolak/skip", variant: "destructive" },
  seeded: { label: "Sudah jadi produk", variant: "default" },
  failed: { label: "Gagal", variant: "destructive" },
};

const IN_FLIGHT = new Set(["queued", "researching"]);
const POLL_MS = 4000;

export function CatalogStagingTable({
  importId,
  items: initialItems,
  approvableCount,
}: {
  importId: string;
  items: Item[];
  approvableCount: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enqueuing, setEnqueuing] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);

  const researchable = useMemo(() => items.filter((i) => i.dedupe_status === "new" && i.status === "pending"), [items]);
  const allResearchableSelected = researchable.length > 0 && researchable.every((i) => selected.has(i.id));
  const hasInFlight = useMemo(() => items.some((i) => IN_FLIGHT.has(i.status)), [items]);

  // Fase 2 (PRD §6): jobs run on Trigger.dev, not in this request — poll lightly (no websocket)
  // while anything is queued/researching, stop as soon as nothing is in flight.
  useEffect(() => {
    if (!hasInFlight) return;
    const interval = setInterval(async () => {
      const statuses = await getItemStatuses(importId);
      const byId = new Map(statuses.map((s) => [s.id, s.status]));
      setItems((prev) => prev.map((it) => (byId.has(it.id) ? { ...it, status: byId.get(it.id)! } : it)));
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [importId, hasInFlight]);

  function toggleAll() {
    setSelected(allResearchableSelected ? new Set() : new Set(researchable.map((i) => i.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function enqueueOne(id: string) {
    const res = await startResearch(id);
    if (res.ok) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "queued" } : it)));
    } else {
      toast.error(`${id.slice(0, 8)}: ${res.error}`);
    }
    return res.ok;
  }

  async function enqueueBulk() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setEnqueuing(true);
    let okCount = 0;
    for (const id of ids) {
      const ok = await enqueueOne(id);
      if (ok) okCount += 1;
    }
    setEnqueuing(false);
    setSelected(new Set());
    toast.success(`${okCount}/${ids.length} item masuk antrian riset.`);
  }

  // Fase 4 (PRD §10 item 1): explicit, confirmed bulk action — never automatic.
  async function onBulkApprove() {
    if (!confirmingBulk) {
      setConfirmingBulk(true);
      return;
    }
    setBulkApproving(true);
    const res = await bulkApproveReady(importId);
    setBulkApproving(false);
    setConfirmingBulk(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (res.skipped.length > 0) {
      toast.warning(`${res.approved} produk dipublish, ${res.skipped.length} dilewati (lihat detail di konsol).`);
      console.warn("bulkApproveReady skipped:", res.skipped);
    } else {
      toast.success(`${res.approved} produk berhasil dipublish.`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={enqueueBulk}
            disabled={selected.size === 0 || enqueuing}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            {enqueuing ? "Memasukkan ke antrian…" : `Antre Riset (${selected.size} dipilih)`}
          </button>
          <p className="text-xs text-muted-foreground">
            Job berjalan di background (Trigger.dev) — boleh tinggalkan halaman ini, status update sendiri saat dibuka lagi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {approvableCount > 0 ? (
            <button
              type="button"
              onClick={onBulkApprove}
              disabled={bulkApproving}
              className={cn(
                "h-9 rounded-md px-4 text-sm font-medium disabled:opacity-50",
                confirmingBulk ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "border border-border hover:bg-muted",
              )}
            >
              {bulkApproving
                ? "Memproses…"
                : confirmingBulk
                  ? `Yakin publish ${approvableCount} produk?`
                  : `Approve Semua Confidence Tinggi (${approvableCount})`}
            </button>
          ) : null}
          <Link href="/admin/catalog-import/jobs" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            Riwayat Pekerjaan →
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allResearchableSelected} onChange={toggleAll} disabled={researchable.length === 0} />
              </TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Kategori (dari sheet)</TableHead>
              <TableHead>Dedupe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const dedupe = DEDUPE_LABEL[item.dedupe_status] ?? DEDUPE_LABEL.new!;
              const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.pending!;
              const canResearch = item.dedupe_status === "new" && item.status === "pending";
              const canReview = item.status === "ready_for_review" || item.status === "approved" || item.status === "seeded";
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(item.id)} onChange={() => toggleOne(item.id)} disabled={!canResearch || enqueuing} />
                  </TableCell>
                  <TableCell className="font-medium">{item.brand_raw}</TableCell>
                  <TableCell>{item.model_raw}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{item.category_guess ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={dedupe.variant}>{dedupe.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={cn(item.status === "ready_for_review" && "bg-status/15 text-status-text border-transparent")}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canReview ? (
                      <Link href={`/admin/catalog-import/${importId}/review/${item.id}`} className="text-sm font-medium text-accent-text hover:underline">
                        Review →
                      </Link>
                    ) : canResearch ? (
                      <button
                        type="button"
                        onClick={() => enqueueOne(item.id)}
                        disabled={enqueuing}
                        className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        Mulai Riset
                      </button>
                    ) : item.status === "failed" ? (
                      <Link href="/admin/catalog-import/jobs" className="text-sm text-destructive hover:underline">
                        Lihat error →
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
