"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, inputCls, textareaCls } from "@/components/admin/fields";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  archiveSpecDef,
  deleteBrand,
  deleteCategory,
  deleteSpecDef,
  reorderSpecDefs,
  saveBrand,
  saveCategory,
  saveSpecDef,
} from "@/lib/actions/admin/categories";

export type CategoryRow = { id: string; name: string; slug: string; description: string | null; sort_order: number; productCount: number };
export type BrandRow = { id: string; name: string; website: string | null; is_authorized_dealer: boolean; logo_media_id: string | null; productCount: number };
export type SpecDefRow = {
  id: string;
  category_id: string;
  key: string;
  label: string;
  spec_group: string;
  data_type: "number" | "text" | "boolean" | "enum";
  unit: string | null;
  enum_options: string[] | null;
  sort_order: number;
  is_filterable: boolean;
  is_comparable: boolean;
  better_direction: "higher" | "lower" | null;
  is_archived: boolean;
  valueCount: number;
};

const SPEC_GROUPS = ["Optik", "Audio", "Konektivitas", "Fisik", "Fitur"];
const btnPrimary = "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-60";
const btnGhost = "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted";

export function CategoriesManager({
  categories,
  brands,
  specDefs,
  media,
}: {
  categories: CategoryRow[];
  brands: BrandRow[];
  specDefs: SpecDefRow[];
  media: MediaItem[];
}) {
  return (
    <Tabs defaultValue="categories" className="space-y-6">
      <TabsList>
        <TabsTrigger value="categories">Kategori &amp; Brand</TabsTrigger>
        <TabsTrigger value="specs">Spec Templates</TabsTrigger>
      </TabsList>
      <TabsContent value="categories">
        <div className="space-y-8">
          <CategorySection categories={categories} />
          <BrandSection brands={brands} media={media} />
        </div>
      </TabsContent>
      <TabsContent value="specs">
        <SpecSection categories={categories} specDefs={specDefs} />
      </TabsContent>
    </Tabs>
  );
}

// ── Categories ───────────────────────────────────────────────────────────────────────────
function CategorySection({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function onDelete(c: CategoryRow) {
    if (!confirm(`Hapus kategori "${c.name}"?`)) return;
    const res = await deleteCategory(c.id);
    if (res.ok) { toast.success("Kategori dihapus."); router.refresh(); } else toast.error(res.error);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Kategori ({categories.length})</h2>
        <button type="button" onClick={() => setEditing("new")} className={btnGhost}><Plus className="h-3.5 w-3.5" /> Kategori</button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">Nama</th><th className="px-4 py-2.5 font-medium">Slug</th><th className="px-4 py-2.5 font-medium">Produk</th><th className="px-4 py-2.5" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.productCount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEditing(c)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onDelete(c)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Kategori baru" : "Edit kategori"}</DialogTitle></DialogHeader>
          {editing !== null ? (
            <CategoryForm
              row={editing === "new" ? null : editing}
              busy={busy}
              onSubmit={async (payload) => {
                setBusy(true);
                const res = await saveCategory(payload);
                setBusy(false);
                if (res.ok) { toast.success("Kategori tersimpan."); setEditing(null); router.refresh(); } else toast.error(res.error);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CategoryForm({ row, busy, onSubmit }: { row: CategoryRow | null; busy: boolean; onSubmit: (p: unknown) => void }) {
  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(row?.sort_order ?? 0));
  return (
    <div className="space-y-4">
      <Field label="Nama" required><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Deskripsi singkat"><textarea rows={2} className={textareaCls} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Urutan"><input type="number" className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></Field>
      <DialogFooter>
        <button type="button" disabled={busy} className={btnPrimary} onClick={() => onSubmit({ id: row?.id ?? null, name, description, sort_order: sortOrder })}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </DialogFooter>
    </div>
  );
}

// ── Brands ───────────────────────────────────────────────────────────────────────────────
function BrandSection({ brands, media }: { brands: BrandRow[]; media: MediaItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<BrandRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function onDelete(b: BrandRow) {
    if (!confirm(`Hapus brand "${b.name}"?`)) return;
    const res = await deleteBrand(b.id);
    if (res.ok) { toast.success("Brand dihapus."); router.refresh(); } else toast.error(res.error);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Brand ({brands.length})</h2>
        <button type="button" onClick={() => setEditing("new")} className={btnGhost}><Plus className="h-3.5 w-3.5" /> Brand</button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">Nama</th><th className="px-4 py-2.5 font-medium">Authorized</th><th className="px-4 py-2.5 font-medium">Produk</th><th className="px-4 py-2.5" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{b.name}</td>
                <td className="px-4 py-2.5">{b.is_authorized_dealer ? <span className="inline-flex items-center gap-1 text-xs text-accent-text"><Star className="h-3 w-3" /> Dealer</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.productCount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEditing(b)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onDelete(b)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Brand baru" : "Edit brand"}</DialogTitle></DialogHeader>
          {editing !== null ? (
            <BrandForm
              row={editing === "new" ? null : editing}
              media={media}
              busy={busy}
              onSubmit={async (payload) => {
                setBusy(true);
                const res = await saveBrand(payload);
                setBusy(false);
                if (res.ok) { toast.success("Brand tersimpan."); setEditing(null); router.refresh(); } else toast.error(res.error);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function BrandForm({ row, media, busy, onSubmit }: { row: BrandRow | null; media: MediaItem[]; busy: boolean; onSubmit: (p: unknown) => void }) {
  const [name, setName] = useState(row?.name ?? "");
  const [website, setWebsite] = useState(row?.website ?? "");
  const [dealer, setDealer] = useState(row?.is_authorized_dealer ?? false);
  const [logo, setLogo] = useState<string | null>(row?.logo_media_id ?? null);
  return (
    <div className="space-y-4">
      <Field label="Nama" required><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Website" hint="URL lengkap (https://…)"><input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} /></Field>
      <Field label="Logo"><MediaPicker media={media} value={logo} onChange={setLogo} /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={dealer} onChange={(e) => setDealer(e.target.checked)} className="h-4 w-4 rounded border-border" />
        Authorized dealer
      </label>
      <DialogFooter>
        <button type="button" disabled={busy} className={btnPrimary} onClick={() => onSubmit({ id: row?.id ?? null, name, website, is_authorized_dealer: dealer, logo_media_id: logo ?? "" })}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </DialogFooter>
    </div>
  );
}

// ── Spec definitions ─────────────────────────────────────────────────────────────────────
function SpecSection({ categories, specDefs }: { categories: CategoryRow[]; specDefs: SpecDefRow[] }) {
  const router = useRouter();
  const [catId, setCatId] = useState(categories[0]?.id ?? "");
  const [editing, setEditing] = useState<SpecDefRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const defs = specDefs.filter((d) => d.category_id === catId).sort((a, b) => a.sort_order - b.sort_order);

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= defs.length) return;
    const ids = defs.map((d) => d.id);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    const res = await reorderSpecDefs(ids);
    if (res.ok) router.refresh(); else toast.error(res.error);
  }
  async function onArchive(d: SpecDefRow) {
    const res = await archiveSpecDef(d.id, !d.is_archived);
    if (res.ok) { toast.success(d.is_archived ? "Definition dipulihkan." : "Definition diarsipkan."); router.refresh(); } else toast.error(res.error);
  }
  async function onDelete(d: SpecDefRow) {
    if (!confirm(`Hapus permanen "${d.label}"? (hanya bila belum ada nilai)`)) return;
    const res = await deleteSpecDef(d.id);
    if (res.ok) { toast.success("Definition dihapus."); router.refresh(); } else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Kategori:</label>
          <select className={inputCls + " w-auto"} value={catId} onChange={(e) => setCatId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setEditing("new")} disabled={!catId} className={btnGhost}><Plus className="h-3.5 w-3.5" /> Definition</button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Urut</th><th className="px-3 py-2.5 font-medium">Label / key</th>
              <th className="px-3 py-2.5 font-medium">Group</th><th className="px-3 py-2.5 font-medium">Tipe</th>
              <th className="px-3 py-2.5 font-medium">Filter/Compare</th><th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {defs.map((d, i) => (
              <tr key={d.id} className={d.is_archived ? "bg-muted/20 text-muted-foreground" : "hover:bg-muted/30"}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || d.is_archived} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === defs.length - 1 || d.is_archived} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{d.label} {d.is_archived ? <span className="ml-1 rounded bg-destructive/10 px-1 text-[10px] text-destructive">archived</span> : null}</div>
                  <div className="text-xs text-muted-foreground">{d.key}{d.valueCount ? ` · ${d.valueCount} nilai` : ""}</div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{d.spec_group}</td>
                <td className="px-3 py-2 text-muted-foreground">{d.data_type}{d.unit ? ` (${d.unit})` : ""}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{d.is_filterable ? "filter" : "—"} / {d.is_comparable ? "compare" : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEditing(d)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onArchive(d)} className="rounded p-1.5 text-muted-foreground hover:bg-muted" title={d.is_archived ? "Pulihkan" : "Arsipkan"}>
                      {d.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => onDelete(d)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Hapus permanen"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {defs.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">Belum ada spec definition untuk kategori ini.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing === "new" ? "Spec definition baru" : "Edit spec definition"}</DialogTitle></DialogHeader>
          {editing !== null ? (
            <SpecDefForm
              row={editing === "new" ? null : editing}
              categoryId={catId}
              nextSort={defs.length}
              busy={busy}
              onSubmit={async (payload) => {
                setBusy(true);
                const res = await saveSpecDef(payload);
                setBusy(false);
                if (res.ok) { toast.success("Definition tersimpan."); setEditing(null); router.refresh(); } else toast.error(res.error);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SpecDefForm({ row, categoryId, nextSort, busy, onSubmit }: { row: SpecDefRow | null; categoryId: string; nextSort: number; busy: boolean; onSubmit: (p: unknown) => void }) {
  const isEdit = row !== null;
  const lockType = isEdit && row!.valueCount > 0;
  const [key, setKey] = useState(row?.key ?? "");
  const [label, setLabel] = useState(row?.label ?? "");
  const [group, setGroup] = useState(row?.spec_group ?? SPEC_GROUPS[0]);
  const [dataType, setDataType] = useState<SpecDefRow["data_type"]>(row?.data_type ?? "text");
  const [unit, setUnit] = useState(row?.unit ?? "");
  const [enumOptions, setEnumOptions] = useState((row?.enum_options ?? []).join("\n"));
  const [filterable, setFilterable] = useState(row?.is_filterable ?? false);
  const [comparable, setComparable] = useState(row?.is_comparable ?? true);
  const [better, setBetter] = useState<"" | "higher" | "lower">(row?.better_direction ?? "");

  return (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <Field label="Key (snake_case)" required hint={isEdit ? "Immutable — salah ketik? archive lalu buat baru." : "Identifier permanen, mis. max_spl."}>
        <input className={inputCls} value={key} disabled={isEdit} onChange={(e) => setKey(e.target.value)} />
      </Field>
      <Field label="Label" required><input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Spec group" required>
          <input className={inputCls} list="spec-groups" value={group} onChange={(e) => setGroup(e.target.value)} />
          <datalist id="spec-groups">{SPEC_GROUPS.map((g) => <option key={g} value={g} />)}</datalist>
        </Field>
        <Field label="Data type" required hint={lockType ? "Terkunci — sudah ada nilai." : undefined}>
          <select className={inputCls} value={dataType} disabled={lockType} onChange={(e) => setDataType(e.target.value as SpecDefRow["data_type"])}>
            <option value="text">text</option><option value="number">number</option><option value="boolean">boolean</option><option value="enum">enum</option>
          </select>
        </Field>
      </div>
      {dataType === "number" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit" hint="mis. dB, nit, mm, W"><input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} /></Field>
          <Field label="Better direction" hint="Penanda unggul di compare">
            <select className={inputCls} value={better} onChange={(e) => setBetter(e.target.value as "" | "higher" | "lower")}>
              <option value="">netral</option><option value="higher">higher (makin besar makin baik)</option><option value="lower">lower (makin kecil makin baik)</option>
            </select>
          </Field>
        </div>
      ) : null}
      {dataType === "enum" ? (
        <Field label="Enum options" required hint="Satu opsi per baris.">
          <textarea rows={4} className={textareaCls} value={enumOptions} onChange={(e) => setEnumOptions(e.target.value)} />
        </Field>
      ) : null}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filterable} onChange={(e) => setFilterable(e.target.checked)} className="h-4 w-4 rounded border-border" /> Filterable (grid)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={comparable} onChange={(e) => setComparable(e.target.checked)} className="h-4 w-4 rounded border-border" /> Comparable (tabel bandingkan)</label>
      </div>
      <DialogFooter>
        <button
          type="button"
          disabled={busy}
          className={btnPrimary}
          onClick={() =>
            onSubmit({
              id: row?.id ?? null,
              category_id: categoryId,
              key,
              label,
              spec_group: group,
              data_type: dataType,
              unit,
              enum_options: enumOptions.split("\n").map((s) => s.trim()).filter(Boolean),
              sort_order: row?.sort_order ?? nextSort,
              is_filterable: filterable,
              is_comparable: comparable,
              better_direction: dataType === "number" && better ? better : null,
            })
          }
        >
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </DialogFooter>
    </div>
  );
}
