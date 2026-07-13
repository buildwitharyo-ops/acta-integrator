"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LinkIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Field, inputCls } from "@/components/admin/fields";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteMedia, registerExternalMedia, updateMedia, uploadMedia } from "@/lib/actions/admin/media";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type MediaRow = {
  id: string;
  kind: "upload" | "external";
  storage_path: string | null;
  external_url: string | null;
  alt: string | null;
  caption: string | null;
  source_license: string | null;
  is_placeholder: boolean;
  created_at: string;
};
type Usage = { where: string; label: string };

function fileName(m: MediaRow): string {
  if (m.storage_path) return m.storage_path.split("/").pop() ?? m.storage_path;
  if (m.external_url) {
    try {
      return new URL(m.external_url).pathname.split("/").pop() || m.external_url;
    } catch {
      return m.external_url;
    }
  }
  return m.id;
}

const btnPrimary = "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-60";
const btnGhost = "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted";

export function MediaLibrary({ media, usage }: { media: MediaRow[]; usage: Record<string, Usage[]> }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<"all" | "upload" | "external">("all");
  const [onlyPlaceholder, setOnlyPlaceholder] = useState(false);
  const [onlyNoAlt, setOnlyNoAlt] = useState(false);
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const [externalOpen, setExternalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return media.filter((m) => {
      if (source !== "all" && m.kind !== source) return false;
      if (onlyPlaceholder && !m.is_placeholder) return false;
      if (onlyNoAlt && m.alt) return false;
      if (query && !(`${fileName(m)} ${m.alt ?? ""}`.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [media, q, source, onlyPlaceholder, onlyNoAlt]);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const fd = new FormData();
    for (const file of Array.from(list)) fd.append("files", file);
    setUploading(true);
    const res = await uploadMedia(fd);
    setUploading(false);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      if (res.count > 0) {
        toast.success(`${res.count} media terupload.`);
        router.refresh();
      }
      if (res.errors.length) toast.error(res.errors.join("; "));
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Media</h1>
          <p className="text-sm text-muted-foreground">{media.length} aset. Upload atau daftarkan URL eksternal.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setExternalOpen(true)} className={btnGhost}><LinkIcon className="h-3.5 w-3.5" /> URL eksternal</button>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={cn(btnPrimary, "inline-flex items-center gap-1.5")}>
            <Upload className="h-3.5 w-3.5" /> {uploading ? "Mengupload…" : "Upload"}
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground"
      >
        Tarik & lepas file gambar ke sini (jpg/png/webp/svg, maks 5 MB).
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input className={inputCls + " max-w-xs"} placeholder="Cari nama file / alt…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputCls + " w-auto"} value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
          <option value="all">Semua sumber</option>
          <option value="upload">Upload</option>
          <option value="external">Eksternal</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlyPlaceholder} onChange={(e) => setOnlyPlaceholder(e.target.checked)} className="h-4 w-4 rounded border-border" /> Placeholder</label>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlyNoAlt} onChange={(e) => setOnlyNoAlt(e.target.checked)} className="h-4 w-4 rounded border-border" /> Tanpa alt</label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((m) => {
          const url = mediaUrl(m);
          return (
            <button key={m.id} type="button" onClick={() => setSelected(m)} className="group relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted text-left hover:border-foreground/40">
              {url ? <Image src={url} alt={m.alt ?? ""} fill sizes="200px" className="object-cover" /> : null}
              <span className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">{fileName(m)}</span>
              {m.is_placeholder ? <span className="absolute left-1 top-1 rounded bg-background/85 px-1 text-[9px] font-medium text-muted-foreground">PLACEHOLDER</span> : null}
              {!m.alt ? <span className="absolute right-1 top-1 rounded bg-destructive/90 px-1 text-[9px] text-white">no alt</span> : null}
            </button>
          );
        })}
        {filtered.length === 0 ? <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Tidak ada media.</p> : null}
      </div>

      {selected ? (
        <MediaDetail
          key={selected.id}
          media={selected}
          usage={usage[selected.id] ?? []}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      ) : null}

      <ExternalDialog open={externalOpen} onOpenChange={setExternalOpen} onDone={() => router.refresh()} />
    </div>
  );
}

function MediaDetail({ media, usage, onClose, onChanged }: { media: MediaRow; usage: Usage[]; onClose: () => void; onChanged: () => void }) {
  const [alt, setAlt] = useState(media.alt ?? "");
  const [caption, setCaption] = useState(media.caption ?? "");
  const [license, setLicense] = useState(media.source_license ?? "");
  const [placeholder, setPlaceholder] = useState(media.is_placeholder);
  const [busy, setBusy] = useState(false);
  const url = mediaUrl(media);

  async function save() {
    setBusy(true);
    const res = await updateMedia({ id: media.id, alt, caption, source_license: license, is_placeholder: placeholder });
    setBusy(false);
    if (res.ok) {
      toast.success("Media tersimpan.");
      onChanged();
    } else toast.error(res.error);
  }
  async function remove() {
    if (usage.length > 0) return;
    if (!confirm("Hapus media ini permanen?")) return;
    setBusy(true);
    const res = await deleteMedia(media.id);
    setBusy(false);
    if (res.ok) {
      toast.success("Media dihapus.");
      onChanged();
    } else toast.error(res.error);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Detail media</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
            {url ? <Image src={url} alt={media.alt ?? ""} fill sizes="320px" className="object-contain" /> : null}
          </div>
          <div className="space-y-3">
            <Field label="Alt" hint="Wajib sebelum dipakai untuk publish.">
              <input className={inputCls} value={alt} onChange={(e) => setAlt(e.target.value)} />
            </Field>
            <Field label="Caption"><input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} /></Field>
            {media.kind === "external" ? (
              <Field label="Source / lisensi" required hint="mis. Unsplash — @user, free license">
                <input className={inputCls} value={license} onChange={(e) => setLicense(e.target.value)} />
              </Field>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={placeholder} onChange={(e) => setPlaceholder(e.target.checked)} className="h-4 w-4 rounded border-border" />
              Placeholder (TO-REPLACE)
            </label>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
          <span className="font-medium">Dipakai di:</span>{" "}
          {usage.length === 0 ? <span className="text-muted-foreground">tidak dipakai — aman dihapus.</span> : usage.map((u, i) => (
            <span key={i} className="text-muted-foreground">{i > 0 ? "; " : ""}{u.where}: {u.label}</span>
          ))}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <button type="button" onClick={remove} disabled={busy || usage.length > 0} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40" title={usage.length > 0 ? "Masih dipakai" : "Hapus"}>
            <Trash2 className="h-3.5 w-3.5" /> Hapus
          </button>
          <button type="button" onClick={save} disabled={busy} className={btnPrimary}>{busy ? "Menyimpan…" : "Simpan"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExternalDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [license, setLicense] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await registerExternalMedia({ external_url: url, alt, source_license: license, is_placeholder: true });
    setBusy(false);
    if (res.ok) {
      toast.success("URL terdaftar.");
      setUrl("");
      setAlt("");
      setLicense("");
      onOpenChange(false);
      onDone();
    } else toast.error(res.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Daftarkan URL eksternal</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="URL gambar" required hint="Domain harus ada di next.config remotePatterns."><input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></Field>
          <Field label="Alt"><input className={inputCls} value={alt} onChange={(e) => setAlt(e.target.value)} /></Field>
          <Field label="Source / lisensi" required hint="mis. Crestron press kit — pending permission"><input className={inputCls} value={license} onChange={(e) => setLicense(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <button type="button" onClick={submit} disabled={busy} className={btnPrimary}>{busy ? "Memverifikasi…" : "Verifikasi & simpan"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
