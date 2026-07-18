"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { retryFailedJob } from "@/lib/actions/admin/catalog-pipeline";

type Job = {
  id: string;
  type: string;
  status: string;
  provider: string;
  import_item_id: string | null;
  error: string | null;
  attempt: number;
  max_attempts: number;
  external_run_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  item: { id: string; brand_raw: string; model_raw: string } | null;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "outline",
  claimed: "secondary",
  running: "secondary",
  succeeded: "default",
  partial: "secondary",
  failed: "destructive",
  cancelled: "outline",
};

function duration(job: Job): string {
  if (!job.started_at) return "—";
  const end = job.finished_at ? new Date(job.finished_at) : new Date();
  const secs = Math.round((end.getTime() - new Date(job.started_at).getTime()) / 1000);
  return `${secs}s`;
}

export function CatalogJobHistory({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onRetry(jobId: string) {
    setBusyId(jobId);
    const res = await retryFailedJob(jobId);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Job di-retry, masuk antrian lagi.");
    router.refresh();
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada job.</p>;
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Percobaan</TableHead>
            <TableHead>Durasi</TableHead>
            <TableHead>Error</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.item ? `${job.item.brand_raw} ${job.item.model_raw}` : "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[job.status] ?? "outline"}>{job.status}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {job.attempt}/{job.max_attempts}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{duration(job)}</TableCell>
              <TableCell className="max-w-[280px] truncate text-xs text-destructive" title={job.error ?? ""}>
                {job.error ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {job.status === "failed" ? (
                  <button
                    type="button"
                    onClick={() => onRetry(job.id)}
                    disabled={busyId === job.id}
                    className="text-sm font-medium text-accent-text hover:underline disabled:opacity-50"
                  >
                    {busyId === job.id ? "Retry…" : "Retry"}
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
