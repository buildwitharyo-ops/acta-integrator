"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/lib/actions/admin/products";

export function DeleteProductButton({ id, name, status }: { id: string; name: string; status: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const warn = status === "published" ? " Produk ini sedang LIVE di situs." : "";
    if (!confirm(`Hapus produk "${name}"?${warn} Tindakan ini permanen.`)) return;
    setBusy(true);
    const res = await deleteProduct(id);
    setBusy(false);
    if (res.ok) {
      toast.success("Produk dihapus.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      title="Hapus produk"
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
